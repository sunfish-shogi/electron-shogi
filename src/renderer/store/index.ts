import api from "@/renderer/ipc/api";
import {
  Color,
  exportCSA,
  ImmutableRecord,
  InitialPositionType,
  Move,
  PositionChange,
  Record,
  SpecialMove,
  getSpecialMoveDisplayString,
  exportKakinoki,
  RecordMetadataKey,
  ImmutablePosition,
  DoMoveOption,
} from "@/common/shogi";
import { reactive, UnwrapNestedRefs } from "vue";
import { GameSetting } from "@/common/settings/game";
import { ClockSoundTarget, Tab, TextDecodingRule } from "@/common/settings/app";
import {
  beepShort,
  beepUnlimited,
  playPieceBeat,
  stopBeep,
} from "@/renderer/audio";
import {
  RecordManager,
  SearchInfoSenderType,
  SearchInfo as SearchInfoParam,
} from "./record";
import { GameManager, GameResults } from "./game";
import { defaultRecordFileName, join } from "@/renderer/helpers/path";
import { ResearchSetting } from "@/common/settings/research";
import { BussyStore } from "./bussy";
import { USIPlayerMonitor, USIMonitor } from "./usi";
import { AppState } from "@/common/control/state";
import { Message, MessageStore, Attachment } from "./message";
import { ErrorEntry, ErrorStore } from "./error";
import * as uri from "@/common/uri";
import { Confirmation } from "./confirm";
import { AnalysisManager } from "./analysis";
import { AnalysisSetting, CommentBehavior } from "@/common/settings/analysis";
import { MateSearchSetting } from "@/common/settings/mate";
import { LogLevel } from "@/common/log";
import { formatPercentage, toString } from "@/common/helpers/string";
import { CSAGameManager, CSAGameState } from "./csa";
import { Clock } from "./clock";
import {
  CSAGameSetting,
  appendCSAGameSettingHistory,
} from "@/common/settings/csa";
import { defaultPlayerBuilder } from "@/renderer/players/builder";
import { USIInfoCommand } from "@/common/usi";
import { ResearchManager } from "./research";
import { SearchInfo } from "@/renderer/players/player";
import { useAppSetting } from "./setting";
import { t } from "@/common/i18n";
import { MateSearchManager } from "./mate";

export type PVPreview = {
  position: ImmutablePosition;
  multiPV?: number;
  depth?: number;
  selectiveDepth?: number;
  score?: number;
  mate?: number;
  lowerBound?: boolean;
  upperBound?: boolean;
  pv: Move[];
};

function getMessageAttachmentsByGameResults(
  results: GameResults
): Attachment[] {
  const validTotal = results.total - results.invalid;
  return [
    {
      type: "list",
      items: [
        {
          text: results.player1.name,
          children: [
            `勝ち数: ${results.player1.win}`,
            `勝率: ${formatPercentage(results.player1.win, validTotal, 1)}`,
          ],
        },
        {
          text: results.player2.name,
          children: [
            `勝ち数: ${results.player2.win}`,
            `勝率: ${formatPercentage(results.player2.win, validTotal, 1)}`,
          ],
        },
        { text: `引き分け: ${results.draw}` },
        { text: `有効対局数: ${validTotal}` },
        { text: `無効対局数: ${results.invalid}` },
      ],
    },
  ];
}

type OnChangeFilePath = (path?: string) => void;

class Store {
  private onChangeFilePath: OnChangeFilePath[] = [];
  private _bussy = new BussyStore();
  private _message = new MessageStore();
  private _error = new ErrorStore();
  private recordManager = new RecordManager();
  private _appState = AppState.NORMAL;
  private _isAppSettingDialogVisible = false;
  private _confirmation?: Confirmation & { appState: AppState };
  private _pvPreview?: PVPreview;
  private usiMonitor = new USIMonitor();
  private blackClock = new Clock();
  private whiteClock = new Clock();
  private gameManager = new GameManager(
    this.recordManager,
    this.blackClock,
    this.whiteClock
  );
  private csaGameManager = new CSAGameManager(
    this.recordManager,
    this.blackClock,
    this.whiteClock
  );
  private researchManager = new ResearchManager();
  private analysisManager = new AnalysisManager(this.recordManager);
  private mateSearchManager = new MateSearchManager();
  private _reactive: UnwrapNestedRefs<Store>;
  private garbledNotified = false;

  constructor() {
    this.recordManager.on("changeFilePath", (path?: string) => {
      for (const listener of this.onChangeFilePath) {
        listener(path);
      }
    });
    this.recordManager.on("changePosition", () => {
      this.onUpdatePosition();
    });
    const refs = reactive(this);
    const appSetting = useAppSetting();
    this.gameManager
      .on("saveRecord", refs.onSaveRecord.bind(refs))
      .on("gameNext", refs.onGameNext.bind(refs))
      .on("gameEnd", refs.onGameEnd.bind(refs))
      .on("flipBoard", refs.onFlipBoard.bind(refs))
      .on("pieceBeat", () => playPieceBeat(appSetting.pieceVolume))
      .on("beepShort", this.onBeepShort.bind(this))
      .on("beepUnlimited", this.onBeepUnlimited.bind(this))
      .on("stopBeep", stopBeep)
      .on("error", refs.pushError.bind(refs));
    this.csaGameManager
      .on("saveRecord", refs.onSaveRecord.bind(refs))
      .on("gameNext", refs.onGameNext.bind(refs))
      .on("gameEnd", refs.onCSAGameEnd.bind(refs))
      .on("flipBoard", refs.onFlipBoard.bind(refs))
      .on("pieceBeat", () => playPieceBeat(appSetting.pieceVolume))
      .on("beepShort", this.onBeepShort.bind(this))
      .on("beepUnlimited", this.onBeepUnlimited.bind(this))
      .on("stopBeep", stopBeep)
      .on("error", refs.pushError.bind(refs));
    this.researchManager
      .on("updateSearchInfo", this.onUpdateSearchInfo.bind(refs))
      .on("error", this.pushError.bind(refs));
    this.analysisManager
      .on("finish", this.onFinish.bind(refs))
      .on("error", this.pushError.bind(refs));
    this.mateSearchManager
      .on("checkmate", this.onCheckmate.bind(refs))
      .on("notImplemented", this.onNotImplemented.bind(refs))
      .on("noMate", this.onNoMate.bind(refs))
      .on("error", this.onCheckmateError.bind(refs));
    this._reactive = refs;
  }

  addListener(event: "changeFilePath", listener: OnChangeFilePath): this;
  addListener(event: string, listener: unknown): this {
    switch (event) {
      case "changeFilePath":
        this.onChangeFilePath.push(listener as OnChangeFilePath);
        break;
    }
    return this;
  }

  get reactive(): UnwrapNestedRefs<Store> {
    return this._reactive;
  }

  get isBussy(): boolean {
    return this._bussy.isBussy;
  }

  retainBussyState(): void {
    return this._bussy.retain();
  }

  releaseBussyState(): void {
    return this._bussy.release();
  }

  get message(): Message {
    return this._message.message;
  }

  get hasMessage(): boolean {
    return this._message.hasMessage;
  }

  enqueueMessage(message: Message): void {
    this._message.enqueue(message);
  }

  dequeueMessage(): void {
    this._message.dequeue();
  }

  get errors(): ErrorEntry[] {
    return this._error.errors;
  }

  get hasError(): boolean {
    return this._error.hasError;
  }

  pushError(e: unknown): void {
    api.log(LogLevel.ERROR, toString(e));
    this._error.add(e);
  }

  clearErrors(): void {
    this._error.clear();
  }

  get record(): ImmutableRecord {
    return this.recordManager.record;
  }

  get recordFilePath(): string | undefined {
    return this.recordManager.recordFilePath;
  }

  get inCommentPVs(): Move[][] {
    return this.recordManager.inCommentPVs;
  }

  updateStandardRecordMetadata(update: {
    key: RecordMetadataKey;
    value: string;
  }): void {
    this.recordManager.updateStandardMetadata(update);
  }

  appendSearchComment(
    type: SearchInfoSenderType,
    searchInfo: SearchInfoParam,
    behavior: CommentBehavior,
    options?: {
      header?: string;
      engineName?: string;
    }
  ): void {
    this.recordManager.appendSearchComment(type, searchInfo, behavior, options);
  }

  appendMovesSilently(moves: Move[], opt?: DoMoveOption): number {
    return this.recordManager.appendMovesSilently(moves, opt);
  }

  get appState(): AppState {
    return this._appState;
  }

  get confirmation(): string | undefined {
    return this._confirmation?.message;
  }

  /**
   * 確認ダイアログを表示します。既に表示されているものは消えます。
   * @param confirmation 確認ダイアログの情報とハンドラーを指定します。
   */
  showConfirmation(confirmation: Confirmation): void {
    if (this._confirmation) {
      api.log(
        LogLevel.WARN,
        "Store#showConfirmation: 確認ダイアログを多重に表示しようとしました。" +
          ` appState=${this.appState}` +
          ` currentMessage=${this._confirmation.message}` +
          ` newMessage=${confirmation.message}`
      );
    }
    this._confirmation = {
      ...confirmation,
      appState: this.appState,
    };
  }

  confirmationOk(): void {
    if (!this._confirmation) {
      return;
    }
    const confirmation = this._confirmation;
    this._confirmation = undefined;
    if (this.appState !== confirmation.appState) {
      this.pushError(
        "確認ダイアログ表示中に他の操作が行われたため処理が中止されました。"
      );
      return;
    }
    if (confirmation.onOk) {
      confirmation.onOk();
    }
  }

  confirmationCancel(): void {
    this._confirmation = undefined;
  }

  get pvPreview(): PVPreview | undefined {
    return this._pvPreview;
  }

  showPVPreviewDialog(pvPreview: PVPreview): void {
    this._pvPreview = pvPreview;
  }

  closePVPreviewDialog(): void {
    this._pvPreview = undefined;
  }

  showPasteDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.PASTE_DIALOG;
    }
  }

  showGameDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.GAME_DIALOG;
    }
  }

  showCSAGameDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.CSA_GAME_DIALOG;
    }
  }

  showResearchDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.RESEARCH_DIALOG;
    }
  }

  showAnalysisDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.ANALYSIS_DIALOG;
    }
  }

  showMateSearchDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.MATE_SEARCH_DIALOG;
    }
  }

  showUsiEngineManagementDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.USI_ENGINE_SETTING_DIALOG;
    }
  }

  showExportBoardImageDialog() {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.EXPORT_POSITION_IMAGE_DIALOG;
    }
  }

  destroyModalDialog(): void {
    if (
      this.appState === AppState.PASTE_DIALOG ||
      this.appState === AppState.GAME_DIALOG ||
      this.appState === AppState.CSA_GAME_DIALOG ||
      this.appState === AppState.RESEARCH_DIALOG ||
      this.appState === AppState.ANALYSIS_DIALOG ||
      this.appState === AppState.MATE_SEARCH_DIALOG ||
      this.appState === AppState.USI_ENGINE_SETTING_DIALOG ||
      this.appState === AppState.EXPORT_POSITION_IMAGE_DIALOG
    ) {
      this._appState = AppState.NORMAL;
    }
  }

  closeModalDialog(): void {
    if (!this.isBussy) {
      this.destroyModalDialog();
    }
  }

  get isAppSettingDialogVisible(): boolean {
    return this._isAppSettingDialogVisible;
  }

  showAppSettingDialog(): void {
    this._isAppSettingDialogVisible = true;
  }

  closeAppSettingDialog(): void {
    this._isAppSettingDialogVisible = false;
  }

  get usiMonitors(): USIPlayerMonitor[] {
    return this.usiMonitor.sessions;
  }

  updateUSIInfo(
    sessionID: number,
    usi: string,
    name: string,
    info: USIInfoCommand
  ): void {
    if (this.recordManager.record.usi !== usi) {
      return;
    }
    this.usiMonitor.update(
      sessionID,
      this.recordManager.record.position,
      name,
      info
    );
  }

  updateUSIPonderInfo(
    sessionID: number,
    usi: string,
    name: string,
    info: USIInfoCommand
  ): void {
    const record = Record.newByUSI(usi);
    if (record instanceof Error) {
      api.log(LogLevel.ERROR, `invalid USI: ${usi} (updateUSIPonderInfo)`);
      return;
    }
    const ponderMove = record.current.move;
    if (!(ponderMove instanceof Move)) {
      return;
    }
    this.usiMonitor.update(sessionID, record.position, name, info, ponderMove);
  }

  get blackTime(): number {
    return this.blackClock.time;
  }

  get blackByoyomi(): number {
    return this.blackClock.byoyomi;
  }

  get whiteTime(): number {
    return this.whiteClock.time;
  }

  get whiteByoyomi(): number {
    return this.whiteClock.byoyomi;
  }

  startGame(setting: GameSetting): void {
    if (this.appState !== AppState.GAME_DIALOG || this.isBussy) {
      return;
    }
    this.retainBussyState();
    api
      .saveGameSetting(setting)
      .then(() => {
        const appSetting = useAppSetting();
        const builder = defaultPlayerBuilder(appSetting.engineTimeoutSeconds);
        return this.gameManager.startGame(setting, builder);
      })
      .then(() => (this._appState = AppState.GAME))
      .catch((e) => {
        this.pushError("対局の初期化中にエラーが出ました: " + e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  get gameSetting(): GameSetting {
    return this.gameManager.setting;
  }

  get gameResults(): GameResults {
    return this.gameManager.results;
  }

  get csaGameState(): CSAGameState {
    return this.csaGameManager.state;
  }

  loginCSAGame(setting: CSAGameSetting, opt: { saveHistory: boolean }): void {
    if (this.appState !== AppState.CSA_GAME_DIALOG || this.isBussy) {
      return;
    }
    this.retainBussyState();
    Promise.resolve()
      .then(async () => {
        if (opt.saveHistory) {
          const latestHistory = await api.loadCSAGameSettingHistory();
          const history = appendCSAGameSettingHistory(latestHistory, setting);
          await api.saveCSAGameSettingHistory(history);
        }
      })
      .then(() => {
        const appSetting = useAppSetting();
        const builder = defaultPlayerBuilder(appSetting.engineTimeoutSeconds);
        return this.csaGameManager.login(setting, builder);
      })
      .then(() => (this._appState = AppState.CSA_GAME))
      .catch((e) => {
        this.pushError("対局の初期化中にエラーが出ました: " + e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  cancelCSAGame(): void {
    if (this.appState !== AppState.CSA_GAME) {
      return;
    }
    if (this.csaGameManager.state === CSAGameState.GAME) {
      this.pushError(
        "対局が始まっているため通信対局をキャンセルできませんでした。"
      );
      return;
    }
    this.csaGameManager.logout();
    this._appState = AppState.NORMAL;
  }

  stopGame(): void {
    switch (this.appState) {
      case AppState.GAME:
        // 連続対局の場合は確認ダイアログを表示する。
        if (this.gameManager.setting.repeat >= 2) {
          this.showConfirmation({
            message: t.areYouSureWantToQuitGames,
            onOk: () => this.gameManager.endGame(SpecialMove.INTERRUPT),
          });
        } else {
          this.gameManager.endGame(SpecialMove.INTERRUPT);
        }
        break;
      case AppState.CSA_GAME:
        // 確認ダイアログを表示する。
        this.showConfirmation({
          message: t.areYouSureWantToRequestQuit,
          onOk: () => this.csaGameManager.stop(),
        });
        break;
    }
  }

  showGameResults(): void {
    if (this.appState !== AppState.GAME) {
      return;
    }
    const results = this.gameManager.results;
    this.enqueueMessage({
      text: t.gameProgress,
      attachments: getMessageAttachmentsByGameResults(results),
    });
  }

  onGameNext(): void {
    this.usiMonitor.clear();
  }

  onGameEnd(results: GameResults, specialMove: SpecialMove): void {
    if (this.appState !== AppState.GAME) {
      return;
    }
    if (results && results.total >= 2) {
      this.enqueueMessage({
        text: t.allGamesCompleted,
        attachments: getMessageAttachmentsByGameResults(results),
      });
    } else if (specialMove) {
      this.enqueueMessage({
        text: `${t.gameEnded}（${getSpecialMoveDisplayString(specialMove)})`,
      });
    }
    this._appState = AppState.NORMAL;
  }

  onCSAGameEnd(): void {
    if (this.appState !== AppState.CSA_GAME) {
      return;
    }
    this._appState = AppState.NORMAL;
  }

  onFlipBoard(flip: boolean): void {
    const appSetting = useAppSetting();
    if (appSetting.boardFlipping !== flip) {
      useAppSetting().flipBoard();
    }
  }

  onSaveRecord(): void {
    const appSetting = useAppSetting();
    const fname = defaultRecordFileName(
      this.recordManager.record.metadata,
      appSetting.defaultRecordFileFormat
    );
    const path = join(appSetting.autoSaveDirectory, fname);
    this.saveRecordByPath(path).catch((e) => {
      this.pushError(e);
    });
  }

  private onBeepShort(): void {
    const appSetting = useAppSetting();
    if (
      appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER &&
      !this.isMovableByUser
    ) {
      return;
    }
    beepShort({
      frequency: appSetting.clockPitch,
      volume: appSetting.clockVolume,
    });
  }

  private onBeepUnlimited(): void {
    const appSetting = useAppSetting();
    if (
      appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER &&
      !this.isMovableByUser
    ) {
      return;
    }
    beepUnlimited({
      frequency: appSetting.clockPitch,
      volume: appSetting.clockVolume,
    });
  }

  doMove(move: Move): void {
    if (
      this.appState !== AppState.NORMAL &&
      this.appState !== AppState.RESEARCH
    ) {
      return;
    }
    if (!this.recordManager.appendMove({ move })) {
      return;
    }
    const appSetting = useAppSetting();
    playPieceBeat(appSetting.pieceVolume);
  }

  onFinish(): void {
    if (this.appState === AppState.ANALYSIS) {
      this._message.enqueue({ text: "棋譜解析が終了しました。" });
      this._appState = AppState.NORMAL;
    }
  }

  startResearch(researchSetting: ResearchSetting): void {
    if (this.appState !== AppState.RESEARCH_DIALOG || this.isBussy) {
      return;
    }
    this.retainBussyState();
    if (!researchSetting.usi) {
      this.pushError(new Error("エンジンが設定されていません。"));
      return;
    }
    api
      .saveResearchSetting(researchSetting)
      .then(() => this.researchManager.launch(researchSetting))
      .then(() => {
        this._appState = AppState.RESEARCH;
        this.usiMonitor.clear();
        this.onUpdatePosition();
        const appSetting = useAppSetting();
        if (
          appSetting.tab !== Tab.SEARCH &&
          appSetting.tab !== Tab.PV &&
          appSetting.tab !== Tab.CHART &&
          appSetting.tab !== Tab.PERCENTAGE_CHART
        ) {
          useAppSetting().updateAppSetting({ tab: Tab.PV });
        }
      })
      .catch((e) => {
        this.pushError("検討の初期化中にエラーが出ました: " + e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  stopResearch(): void {
    if (this.appState !== AppState.RESEARCH) {
      return;
    }
    this.researchManager.close();
    this._appState = AppState.NORMAL;
  }

  onUpdateSearchInfo(type: SearchInfoSenderType, info: SearchInfo): void {
    this.recordManager.updateSearchInfo(type, info);
  }

  startAnalysis(analysisSetting: AnalysisSetting): void {
    if (this.appState !== AppState.ANALYSIS_DIALOG || this.isBussy) {
      return;
    }
    this.retainBussyState();
    api
      .saveAnalysisSetting(analysisSetting)
      .then(() => this.analysisManager.start(analysisSetting))
      .then(() => {
        this._appState = AppState.ANALYSIS;
        this.usiMonitor.clear();
      })
      .catch((e) => {
        this.pushError("検討の初期化中にエラーが出ました: " + e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  stopAnalysis(): void {
    if (this.appState !== AppState.ANALYSIS) {
      return;
    }
    this.analysisManager.close();
    this._appState = AppState.NORMAL;
  }

  startMateSearch(mateSearchSetting: MateSearchSetting): void {
    if (this.appState !== AppState.MATE_SEARCH_DIALOG || this.isBussy) {
      return;
    }
    this.retainBussyState();
    if (!mateSearchSetting.usi) {
      this.pushError(new Error("エンジンが設定されていません。"));
      return;
    }
    api
      .saveMateSearchSetting(mateSearchSetting)
      .then(() =>
        this.mateSearchManager.start(
          mateSearchSetting,
          this.recordManager.record
        )
      )
      .then(() => {
        this._appState = AppState.MATE_SEARCH;
        this.usiMonitor.clear();
        const appSetting = useAppSetting();
        if (appSetting.tab !== Tab.SEARCH && appSetting.tab !== Tab.PV) {
          useAppSetting().updateAppSetting({ tab: Tab.SEARCH });
        }
      })
      .catch((e) => {
        this.pushError("詰将棋探索の初期化中にエラーが出ました: " + e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  stopMateSearch(): void {
    if (this.appState !== AppState.MATE_SEARCH) {
      return;
    }
    this.mateSearchManager.close();
    this._appState = AppState.NORMAL;
  }

  onCheckmate(moves: Move[]): void {
    if (this.appState !== AppState.MATE_SEARCH) {
      return;
    }
    this._appState = AppState.NORMAL;
    const position = this.recordManager.record.position;
    this.showConfirmation({
      message: t.mateInNPlyDoYouWantToDisplay(moves.length),
      onOk: () => {
        this.showPVPreviewDialog({
          position,
          mate: moves.length,
          pv: moves,
        });
      },
    });
  }

  onNotImplemented(): void {
    if (this.appState !== AppState.MATE_SEARCH) {
      return;
    }
    this.pushError(new Error(t.thisEngineNotSupportsMateSearch));
    this._appState = AppState.NORMAL;
  }

  onNoMate(): void {
    if (this.appState !== AppState.MATE_SEARCH) {
      return;
    }
    this.enqueueMessage({ text: t.noMateFound });
    this._appState = AppState.NORMAL;
  }

  onCheckmateError(e: unknown): void {
    if (this.appState !== AppState.MATE_SEARCH) {
      return;
    }
    this.pushError(e);
    this._appState = AppState.NORMAL;
  }

  onUpdatePosition(): void {
    if (this.researchManager) {
      this.researchManager.updatePosition(this.recordManager.record);
    }
  }

  resetRecord(): void {
    if (this.appState != AppState.NORMAL) {
      return;
    }
    this.showConfirmation({
      message: t.areYouSureWantToClearRecord,
      onOk: () => {
        this.recordManager.reset();
      },
    });
  }

  updateRecordComment(comment: string): void {
    this.recordManager.updateComment(comment);
  }

  updateRecordBookmark(bookmark: string): void {
    this.recordManager.updateBookmark(bookmark);
  }

  insertSpecialMove(specialMove: SpecialMove): void {
    if (
      this.appState !== AppState.NORMAL &&
      this.appState !== AppState.RESEARCH
    ) {
      return;
    }
    this.recordManager.appendMove({ move: specialMove });
  }

  startPositionEditing(): void {
    if (this.appState !== AppState.NORMAL) {
      return;
    }
    this.showConfirmation({
      message: t.areYouSureWantToClearRecord,
      onOk: () => {
        this._appState = AppState.POSITION_EDITING;
        this.recordManager.resetByCurrentPosition();
      },
    });
  }

  endPositionEditing(): void {
    if (this.appState === AppState.POSITION_EDITING) {
      this._appState = AppState.NORMAL;
    }
  }

  initializePosition(initialPositionType: InitialPositionType): void {
    if (this.appState != AppState.POSITION_EDITING) {
      return;
    }
    this.showConfirmation({
      message: t.areYouSureWantToDiscardPosition,
      onOk: () => {
        this.recordManager.reset(initialPositionType);
      },
    });
  }

  changeTurn(): void {
    if (this.appState == AppState.POSITION_EDITING) {
      this.recordManager.swapNextTurn();
    }
  }

  editPosition(change: PositionChange): void {
    if (this.appState === AppState.POSITION_EDITING) {
      this.recordManager.changePosition(change);
    }
  }

  changePly(ply: number): void {
    if (
      this.appState === AppState.NORMAL ||
      this.appState === AppState.RESEARCH
    ) {
      this.recordManager.changePly(ply);
    }
  }

  changeBranch(index: number): void {
    if (
      this.appState === AppState.NORMAL ||
      this.appState === AppState.RESEARCH
    ) {
      this.recordManager.changeBranch(index);
    }
  }

  swapWithNextBranch(): boolean {
    return this.recordManager.swapWithNextBranch();
  }

  swapWithPreviousBranch(): boolean {
    return this.recordManager.swapWithPreviousBranch();
  }

  removeCurrentMove(): void {
    if (
      this.appState !== AppState.NORMAL &&
      this.appState !== AppState.RESEARCH
    ) {
      return;
    }
    if (this.recordManager.record.current.isLastMove) {
      this.recordManager.removeCurrentMove();
      return;
    }
    this.showConfirmation({
      message: t.areYouSureWantToDeleteFollowingMove(
        this.recordManager.record.current.ply
      ),
      onOk: () => {
        this.recordManager.removeCurrentMove();
      },
    });
  }

  jumpToBookmark(bookmark: string): boolean {
    if (
      this.appState === AppState.NORMAL ||
      this.appState === AppState.RESEARCH
    ) {
      return this.recordManager.jumpToBookmark(bookmark);
    }
    return false;
  }

  copyRecordKIF(): void {
    const appSetting = useAppSetting();
    const str = exportKakinoki(this.recordManager.record, {
      returnCode: appSetting.returnCode,
    });
    navigator.clipboard.writeText(str);
  }

  copyRecordCSA(): void {
    const appSetting = useAppSetting();
    const str = exportCSA(this.recordManager.record, {
      returnCode: appSetting.returnCode,
    });
    navigator.clipboard.writeText(str);
  }

  copyRecordUSIBefore(): void {
    const str = this.recordManager.record.usi;
    navigator.clipboard.writeText(str);
  }

  copyRecordUSIAll(): void {
    const str = this.recordManager.record.usiAll;
    navigator.clipboard.writeText(str);
  }

  copyBoardSFEN(): void {
    const str = this.recordManager.record.sfen;
    navigator.clipboard.writeText(str);
  }

  pasteRecord(data: string): void {
    if (this.appState !== AppState.NORMAL) {
      return;
    }
    const error = this.recordManager.importRecord(data);
    if (error) {
      this.pushError(error);
      return;
    }
  }

  openRecord(path?: string): void {
    if (this.appState !== AppState.NORMAL || this.isBussy) {
      return;
    }
    this.retainBussyState();
    Promise.resolve()
      .then(() => {
        return path || api.showOpenRecordDialog();
      })
      .then((path) => {
        if (!path) {
          return;
        }
        const appSetting = useAppSetting();
        const autoDetect =
          appSetting.textDecodingRule == TextDecodingRule.AUTO_DETECT;
        return api.openRecord(path).then((data) => {
          const e = this.recordManager.importRecordFromBuffer(data, path, {
            autoDetect,
          });
          return e && Promise.reject(e);
        });
      })
      .catch((e) => {
        this.pushError("棋譜の読み込み中にエラーが出ました: " + e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  saveRecord(options?: { overwrite: boolean }): void {
    if (this.appState !== AppState.NORMAL || this.isBussy) {
      return;
    }
    this.retainBussyState();
    Promise.resolve()
      .then(() => {
        const path = this.recordManager.recordFilePath;
        if (options?.overwrite && path) {
          return path;
        }
        const appSetting = useAppSetting();
        const defaultPath =
          path ||
          defaultRecordFileName(
            this.recordManager.record.metadata,
            appSetting.defaultRecordFileFormat
          );
        return api.showSaveRecordDialog(defaultPath);
      })
      .then((path) => {
        if (!path) {
          return;
        }
        return this.saveRecordByPath(path, { detectGarbled: true });
      })
      .catch((e) => {
        this.pushError(e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  private async saveRecordByPath(
    path: string,
    opt?: { detectGarbled: boolean }
  ): Promise<void> {
    const appSetting = useAppSetting();
    const result = this.recordManager.exportRecordAsBuffer(path, {
      returnCode: appSetting.returnCode,
      detectGarbled: opt?.detectGarbled,
    });
    if (result instanceof Error) {
      throw result;
    }
    try {
      await api.saveRecord(path, result.data);
      if (result.garbled && !this.garbledNotified) {
        this.enqueueMessage({
          text: `${t.recordSavedWithGarbledCharacters}\n${t.pleaseConsiderToUseKIFU}\n${t.youCanChangeDefaultRecordFileFormatFromAppSettings}`,
        });
        this.garbledNotified = true;
      }
    } catch (e) {
      throw new Error(`${t.failedToSaveRecord}: ${e}`);
    }
  }

  get isMovableByUser() {
    switch (this.appState) {
      case AppState.NORMAL:
      case AppState.RESEARCH:
        return true;
      case AppState.GAME:
        return (
          (this.recordManager.record.position.color === Color.BLACK
            ? this.gameManager.setting.black.uri
            : this.gameManager.setting.white.uri) === uri.ES_HUMAN
        );
      case AppState.CSA_GAME:
        return (
          this.csaGameManager.isMyTurn &&
          this.csaGameManager.setting.player.uri === uri.ES_HUMAN
        );
    }
    return false;
  }
}

export function createStore(): UnwrapNestedRefs<Store> {
  return new Store().reactive;
}

let store: UnwrapNestedRefs<Store>;

export function useStore(): UnwrapNestedRefs<Store> {
  if (!store) {
    store = createStore();
  }
  return store;
}
