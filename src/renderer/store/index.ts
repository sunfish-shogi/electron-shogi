import api from "@/renderer/ipc/api";
import {
  Color,
  exportCSA,
  ImmutableRecord,
  Move,
  PositionChange,
  Record,
  formatSpecialMove,
  exportKIF,
  RecordMetadataKey,
  ImmutablePosition,
  DoMoveOption,
  SpecialMoveType,
  exportKI2,
  RecordFormatType,
  exportJKFString,
  countJishogiDeclarationPoint,
  judgeJishogiDeclaration,
  JishogiDeclarationRule,
} from "electron-shogi-core";
import { reactive, UnwrapNestedRefs } from "vue";
import { GameSetting } from "@/common/settings/game";
import { ClockSoundTarget, Tab, TextDecodingRule } from "@/common/settings/app";
import { beepShort, beepUnlimited, playPieceBeat, stopBeep } from "@/renderer/devices/audio";
import {
  RecordManager,
  SearchInfoSenderType,
  SearchInfo as SearchInfoParam,
  ResetRecordHandler,
  ChangePositionHandler,
  UpdateCustomDataHandler,
  UpdateFollowingMovesHandler,
  PieceSet,
  UpdateTreeHandler,
} from "./record";
import { GameManager, GameResults } from "./game";
import { generateRecordFileName, join } from "@/renderer/helpers/path";
import { ResearchSetting } from "@/common/settings/research";
import { BussyStore } from "./bussy";
import { USIPlayerMonitor, USIMonitor } from "./usi";
import { AppState } from "@/common/control/state";
import { Message, MessageStore, Attachment, ListItem } from "./message";
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
import { CSAGameSetting, appendCSAGameSettingHistory } from "@/common/settings/csa";
import { defaultPlayerBuilder } from "@/renderer/players/builder";
import { USIInfoCommand } from "@/common/game/usi";
import { ResearchManager } from "./research";
import { SearchInfo } from "@/renderer/players/player";
import { useAppSetting } from "./setting";
import { t } from "@/common/i18n";
import { MateSearchManager } from "./mate";
import { detectUnsupportedRecordProperties } from "@/renderer/helpers/record";
import { RecordFileFormat, detectRecordFileFormatByPath } from "@/common/file/record";
import { setOnUpdateUSIInfoHandler, setOnUpdateUSIPonderInfoHandler } from "@/renderer/players/usi";

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

function getMessageAttachmentsByGameResults(results: GameResults): Attachment[] {
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

class Store {
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
  private gameManager = new GameManager(this.recordManager, this.blackClock, this.whiteClock);
  private csaGameManager = new CSAGameManager(this.recordManager, this.blackClock, this.whiteClock);
  private researchManager = new ResearchManager();
  private analysisManager = new AnalysisManager(this.recordManager);
  private mateSearchManager = new MateSearchManager();
  private _reactive: UnwrapNestedRefs<Store>;
  private garbledNotified = false;
  private onResetRecordHandlers: ResetRecordHandler[] = [];
  private onChangePositionHandlers: ChangePositionHandler[] = [];
  private onUpdateRecordTreeHandlers: UpdateTreeHandler[] = [];
  private onUpdateCustomDataHandlers: UpdateCustomDataHandler[] = [];
  private onUpdateFollowingMovesHandlers: (() => void)[] = [];

  constructor() {
    this.recordManager
      .on("resetRecord", () => {
        this.onResetRecordHandlers.forEach((handler) => handler());
      })
      .on("changePosition", () => {
        this.updateResearchPosition();
        this.onChangePositionHandlers.forEach((handler) => handler());
      })
      .on("updateTree", () => {
        this.onUpdateRecordTreeHandlers.forEach((handler) => handler());
      })
      .on("updateCustomData", () => {
        this.onUpdateCustomDataHandlers.forEach((handler) => handler());
      })
      .on("updateFollowingMoves", () => {
        this.onUpdateFollowingMovesHandlers.forEach((handler) => handler());
      })
      .on("backup", () => {
        return {
          returnCode: useAppSetting().returnCode,
        };
      });
    const refs = reactive(this);
    this.gameManager
      .on("saveRecord", refs.onSaveRecord.bind(refs))
      .on("gameNext", refs.onGameNext.bind(refs))
      .on("gameEnd", refs.onGameEnd.bind(refs))
      .on("flipBoard", refs.onFlipBoard.bind(refs))
      .on("pieceBeat", () => playPieceBeat(useAppSetting().pieceVolume))
      .on("beepShort", this.onBeepShort.bind(this))
      .on("beepUnlimited", this.onBeepUnlimited.bind(this))
      .on("stopBeep", stopBeep)
      .on("error", refs.pushError.bind(refs));
    this.csaGameManager
      .on("saveRecord", refs.onSaveRecord.bind(refs))
      .on("gameNext", refs.onGameNext.bind(refs))
      .on("gameEnd", refs.onCSAGameEnd.bind(refs))
      .on("flipBoard", refs.onFlipBoard.bind(refs))
      .on("pieceBeat", () => playPieceBeat(useAppSetting().pieceVolume))
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
    setOnUpdateUSIInfoHandler(this.updateUSIInfo.bind(refs));
    setOnUpdateUSIPonderInfoHandler(this.updateUSIPonderInfo.bind(refs));
  }

  addEventListener(event: "resetRecord", handler: ResetRecordHandler): void;
  addEventListener(event: "changePosition", handler: ChangePositionHandler): void;
  addEventListener(event: "updateRecordTree", handler: UpdateTreeHandler): void;
  addEventListener(event: "updateCustomData", handler: UpdateCustomDataHandler): void;
  addEventListener(event: "updateFollowingMoves", handler: UpdateFollowingMovesHandler): void;
  addEventListener(event: string, handler: unknown): void {
    switch (event) {
      case "resetRecord":
        this.onResetRecordHandlers.push(handler as ResetRecordHandler);
        break;
      case "changePosition":
        this.onChangePositionHandlers.push(handler as ChangePositionHandler);
        break;
      case "updateRecordTree":
        this.onUpdateRecordTreeHandlers.push(handler as UpdateTreeHandler);
        break;
      case "updateCustomData":
        this.onUpdateCustomDataHandlers.push(handler as UpdateCustomDataHandler);
        break;
      case "updateFollowingMoves":
        this.onUpdateFollowingMovesHandlers.push(handler as UpdateFollowingMovesHandler);
        break;
    }
  }

  removeEventListener(event: "resetRecord", handler: ResetRecordHandler): void;
  removeEventListener(event: "changePosition", handler: ChangePositionHandler): void;
  removeEventListener(event: "updateRecordTree", handler: UpdateTreeHandler): void;
  removeEventListener(event: "updateCustomData", handler: UpdateCustomDataHandler): void;
  removeEventListener(event: "updateFollowingMoves", handler: UpdateFollowingMovesHandler): void;
  removeEventListener(event: string, handler: unknown): void {
    switch (event) {
      case "resetRecord":
        this.onResetRecordHandlers = this.onResetRecordHandlers.filter((h) => h !== handler);
        break;
      case "changePosition":
        this.onChangePositionHandlers = this.onChangePositionHandlers.filter((h) => h !== handler);
        break;
      case "updateRecordTree":
        this.onUpdateRecordTreeHandlers = this.onUpdateRecordTreeHandlers.filter(
          (h) => h !== handler,
        );
        break;
      case "updateCustomData":
        this.onUpdateCustomDataHandlers = this.onUpdateCustomDataHandlers.filter(
          (h) => h !== handler,
        );
        break;
      case "updateFollowingMoves":
        this.onUpdateFollowingMovesHandlers = this.onUpdateFollowingMovesHandlers.filter(
          (h) => h !== handler,
        );
        break;
    }
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

  get isRecordFileUnsaved(): boolean {
    return this.recordManager.unsaved;
  }

  get inCommentPVs(): Move[][] {
    return this.recordManager.inCommentPVs;
  }

  updateStandardRecordMetadata(update: { key: RecordMetadataKey; value: string }): void {
    this.recordManager.updateStandardMetadata(update);
  }

  appendSearchComment(
    type: SearchInfoSenderType,
    searchInfo: SearchInfoParam,
    behavior: CommentBehavior,
    options?: {
      header?: string;
      engineName?: string;
    },
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
          ` newMessage=${confirmation.message}`,
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
      this.pushError("確認ダイアログ表示中に他の操作が行われたため処理が中止されました。");
      return;
    }
    confirmation.onOk();
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

  showRecordFileHistoryDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.RECORD_FILE_HISTORY_DIALOG;
    }
  }

  showBatchConversionDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.BATCH_CONVERSION_DIALOG;
    }
  }

  showExportBoardImageDialog() {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.EXPORT_POSITION_IMAGE_DIALOG;
    }
  }

  showLaunchUSIEngineDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.LAUNCH_USI_ENGINE_DIALOG;
    }
  }

  showConnectToCSAServerDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.CONNECT_TO_CSA_SERVER_DIALOG;
    }
  }

  showLoadRemoteFileDialog(): void {
    if (this.appState === AppState.NORMAL) {
      this._appState = AppState.LOAD_REMOTE_FILE_DIALOG;
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
      this.appState === AppState.EXPORT_POSITION_IMAGE_DIALOG ||
      this.appState === AppState.RECORD_FILE_HISTORY_DIALOG ||
      this.appState === AppState.BATCH_CONVERSION_DIALOG ||
      this.appState === AppState.LAUNCH_USI_ENGINE_DIALOG ||
      this.appState === AppState.CONNECT_TO_CSA_SERVER_DIALOG ||
      this.appState === AppState.LOAD_REMOTE_FILE_DIALOG
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

  isPausedResearchEngine(sessionID: number): boolean {
    return this.researchManager.isPaused(sessionID);
  }

  pauseResearchEngine(sessionID: number): void {
    this.researchManager.pause(sessionID);
  }

  unpauseResearchEngine(sessionID: number): void {
    this.researchManager.unpause(sessionID);
  }

  updateUSIInfo(sessionID: number, usi: string, name: string, info: USIInfoCommand): void {
    if (this.recordManager.record.usi !== usi) {
      return;
    }
    this.usiMonitor.update(sessionID, this.recordManager.record.position, name, info);
  }

  updateUSIPonderInfo(sessionID: number, usi: string, name: string, info: USIInfoCommand): void {
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
        return this.gameManager.start(setting, builder);
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

  get csaServerSessionID(): number {
    return this.csaGameManager.sessionID;
  }

  get csaGameSetting(): CSAGameSetting {
    return this.csaGameManager.setting;
  }

  get usiSessionIDs(): number[] {
    switch (this.appState) {
      case AppState.GAME:
        throw new Error("not implemented");
      case AppState.CSA_GAME:
        return [this.csaGameManager.usiSessionID].filter((id) => id);
      case AppState.RESEARCH:
        throw new Error("not implemented");
      case AppState.ANALYSIS:
        throw new Error("not implemented");
    }
    return [];
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
      this.pushError("対局が始まっているため通信対局をキャンセルできませんでした。");
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
            onOk: () => this.gameManager.stop(),
          });
        } else {
          this.gameManager.stop();
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

  onGameEnd(results: GameResults, specialMoveType: SpecialMoveType): void {
    if (this.appState !== AppState.GAME) {
      return;
    }
    if (results && results.total >= 2) {
      this.enqueueMessage({
        text: t.allGamesCompleted,
        attachments: getMessageAttachmentsByGameResults(results),
      });
    } else if (specialMoveType) {
      this.enqueueMessage({
        text: `${t.gameEnded}（${formatSpecialMove(specialMoveType)})`,
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
    const fname = generateRecordFileName(
      this.recordManager.record.metadata,
      appSetting.recordFileNameTemplate,
      appSetting.defaultRecordFileFormat,
    );
    const path = join(appSetting.autoSaveDirectory, fname);
    this.saveRecordByPath(path).catch((e) => {
      this.pushError(e);
    });
  }

  private onBeepShort(): void {
    const appSetting = useAppSetting();
    if (appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER && !this.isMovableByUser) {
      return;
    }
    beepShort({
      frequency: appSetting.clockPitch,
      volume: appSetting.clockVolume,
    });
  }

  private onBeepUnlimited(): void {
    const appSetting = useAppSetting();
    if (appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER && !this.isMovableByUser) {
      return;
    }
    beepUnlimited({
      frequency: appSetting.clockPitch,
      volume: appSetting.clockVolume,
    });
  }

  doMove(move: Move): void {
    if (this.appState !== AppState.NORMAL && this.appState !== AppState.RESEARCH) {
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
        this.updateResearchPosition();
        const appSetting = useAppSetting();
        if (
          appSetting.tab !== Tab.SEARCH &&
          appSetting.tab !== Tab.PV &&
          appSetting.tab !== Tab.CHART &&
          appSetting.tab !== Tab.PERCENTAGE_CHART &&
          appSetting.tab !== Tab.MONITOR
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
      .then(() => this.mateSearchManager.start(mateSearchSetting, this.recordManager.record))
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

  updateResearchPosition(): void {
    this.researchManager?.updatePosition(this.recordManager.record);
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

  insertSpecialMove(specialMoveType: SpecialMoveType): void {
    if (this.appState !== AppState.NORMAL && this.appState !== AppState.RESEARCH) {
      return;
    }
    this.recordManager.appendMove({ move: specialMoveType });
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

  initializePositionBySFEN(sfen: string): void {
    if (this.appState != AppState.POSITION_EDITING) {
      return;
    }
    this.showConfirmation({
      message: t.areYouSureWantToDiscardPosition,
      onOk: () => {
        this.recordManager.resetBySFEN(sfen);
      },
    });
  }

  changeTurn(): void {
    if (this.appState == AppState.POSITION_EDITING) {
      this.recordManager.swapNextTurn();
    }
  }

  showPieceSetChangeDialog() {
    if (this.appState === AppState.POSITION_EDITING) {
      this._appState = AppState.PIECE_SET_CHANGE_DIALOG;
    }
  }

  closePieceSetChangeDialog(pieceSet?: PieceSet) {
    if (this.appState !== AppState.PIECE_SET_CHANGE_DIALOG) {
      return;
    }
    if (pieceSet) {
      this.recordManager.changePieceSet(pieceSet);
    }
    this._appState = AppState.POSITION_EDITING;
  }

  editPosition(change: PositionChange): void {
    if (this.appState === AppState.POSITION_EDITING) {
      this.recordManager.changePosition(change);
    }
  }

  changePly(ply: number): void {
    if (this.appState === AppState.NORMAL || this.appState === AppState.RESEARCH) {
      this.recordManager.changePly(ply);
    }
  }

  changeBranch(index: number): void {
    if (this.appState === AppState.NORMAL || this.appState === AppState.RESEARCH) {
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
    if (this.appState !== AppState.NORMAL && this.appState !== AppState.RESEARCH) {
      return;
    }
    if (this.recordManager.record.current.isLastMove) {
      this.recordManager.removeCurrentMove();
      return;
    }
    this.showConfirmation({
      message: t.areYouSureWantToDeleteFollowingMove(this.recordManager.record.current.ply),
      onOk: () => {
        this.recordManager.removeCurrentMove();
      },
    });
  }

  jumpToBookmark(bookmark: string): boolean {
    if (this.appState === AppState.NORMAL || this.appState === AppState.RESEARCH) {
      return this.recordManager.jumpToBookmark(bookmark);
    }
    return false;
  }

  copyRecordKIF(): void {
    const appSetting = useAppSetting();
    const str = exportKIF(this.recordManager.record, {
      returnCode: appSetting.returnCode,
    });
    navigator.clipboard.writeText(str);
  }

  copyRecordKI2(): void {
    const appSetting = useAppSetting();
    const str = exportKI2(this.recordManager.record, {
      returnCode: appSetting.returnCode,
    });
    navigator.clipboard.writeText(str);
  }

  copyRecordCSA(): void {
    const appSetting = useAppSetting();
    const str = exportCSA(this.recordManager.record, {
      returnCode: appSetting.returnCode,
      v3: appSetting.useCSAV3 ? { milliseconds: true } : undefined,
    });
    navigator.clipboard.writeText(str);
  }

  copyRecordUSIBefore(): void {
    const appSetting = useAppSetting();
    const str = this.recordManager.record.getUSI({
      startpos: appSetting.enableUSIFileStartpos,
      resign: appSetting.enableUSIFileResign,
    });
    navigator.clipboard.writeText(str);
  }

  copyRecordUSIAll(): void {
    const appSetting = useAppSetting();
    const str = this.recordManager.record.getUSI({
      startpos: appSetting.enableUSIFileStartpos,
      resign: appSetting.enableUSIFileResign,
      allMoves: true,
    });
    navigator.clipboard.writeText(str);
  }

  copyBoardSFEN(): void {
    const str = this.recordManager.record.sfen;
    navigator.clipboard.writeText(str);
  }

  copyRecordJKF(): void {
    const str = exportJKFString(this.recordManager.record);
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

  openRecord(path?: string, opt?: { ply?: number }): void {
    if (this.appState !== AppState.NORMAL || this.isBussy) {
      this.pushError(t.pleaseEndActiveFeaturesBeforeOpenRecord);
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
        const autoDetect = appSetting.textDecodingRule == TextDecodingRule.AUTO_DETECT;
        return api.openRecord(path).then((data) => {
          const e = this.recordManager.importRecordFromBuffer(data, path, {
            autoDetect,
          });
          return e && Promise.reject(e);
        });
      })
      .then(() => {
        if (opt?.ply) {
          this.recordManager.changePly(opt.ply);
        }
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
          generateRecordFileName(
            this.recordManager.record.metadata,
            appSetting.recordFileNameTemplate,
            appSetting.defaultRecordFileFormat,
          );
        return api.showSaveRecordDialog(defaultPath);
      })
      .then((path) => {
        if (!path) {
          return;
        }
        return this.saveRecordByPath(path, { detectGarbled: true }).then(() => {
          const fileFormat = detectRecordFileFormatByPath(path) as RecordFileFormat;
          const props = detectUnsupportedRecordProperties(this.recordManager.record, fileFormat);
          const items = Object.entries(props)
            .filter(([, v]) => v)
            .map(([k]) => {
              switch (k) {
                case "branch":
                  return t.branches;
                case "comment":
                  return t.comments;
                case "bookmark":
                  return t.bookmark;
                case "time":
                  return t.elapsedTime;
              }
            })
            .map((v) => ({ text: v })) as ListItem[];
          if (items.length) {
            this.enqueueMessage({
              text: t.followingDataNotSavedBecauseNotSupporetedBy(fileFormat),
              attachments: [{ type: "list", items }],
            });
          }
        });
      })
      .catch((e) => {
        this.pushError(e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  private async saveRecordByPath(path: string, opt?: { detectGarbled: boolean }): Promise<void> {
    const appSetting = useAppSetting();
    const result = this.recordManager.exportRecordAsBuffer(path, {
      returnCode: appSetting.returnCode,
      detectGarbled: opt?.detectGarbled,
      csa: { v3: appSetting.useCSAV3 },
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

  restoreFromBackup(name: string): void {
    if (this.appState !== AppState.RECORD_FILE_HISTORY_DIALOG || this.isBussy) {
      return;
    }
    this.retainBussyState();
    api
      .loadRecordFileBackup(name)
      .then((data) => {
        const err = this.recordManager.importRecord(data, {
          type: RecordFormatType.KIF,
          markAsSaved: true,
        });
        if (err) {
          return Promise.reject(err);
        }
        this._appState = AppState.NORMAL;
      })
      .catch((e) => {
        this.pushError(e);
      })
      .finally(() => {
        this.releaseBussyState();
      });
  }

  get remoteRecordFileURL() {
    return this.recordManager.sourceURL;
  }

  loadRemoteRecordFile(url?: string) {
    this.retainBussyState();
    this.recordManager
      .importRecordFromRemoteURL(url)
      .catch((e) => this.pushError(e))
      .finally(() => this.releaseBussyState());
  }

  showJishogiPoints(): void {
    const position = this.recordManager.record.position;
    const blackPoint = countJishogiDeclarationPoint(position, Color.BLACK);
    const black24 = judgeJishogiDeclaration(
      JishogiDeclarationRule.GENERAL24,
      position,
      Color.BLACK,
    );
    const black27 = judgeJishogiDeclaration(
      JishogiDeclarationRule.GENERAL27,
      position,
      Color.BLACK,
    );
    const whitePoint = countJishogiDeclarationPoint(position, Color.WHITE);
    const white24 = judgeJishogiDeclaration(
      JishogiDeclarationRule.GENERAL24,
      position,
      Color.WHITE,
    );
    const white27 = judgeJishogiDeclaration(
      JishogiDeclarationRule.GENERAL27,
      position,
      Color.WHITE,
    );
    this.enqueueMessage({
      text: t.jishogiPoints,
      attachments: [
        {
          type: "list",
          items: [
            {
              text: t.sente,
              children: [
                `Points: ${blackPoint}`,
                `Rule-24: ${black24.toUpperCase()}`,
                `Rule-27: ${black27.toUpperCase()}`,
              ],
            },
            {
              text: t.gote,
              children: [
                `Points: ${whitePoint}`,
                `Rule-24: ${white24.toUpperCase()}`,
                `Rule-27: ${white27.toUpperCase()}`,
              ],
            },
          ],
        },
      ],
    });
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
          this.csaGameManager.isMyTurn && this.csaGameManager.setting.player.uri === uri.ES_HUMAN
        );
    }
    return false;
  }

  async onMainWindowClose(): Promise<void> {
    this.retainBussyState();
    try {
      await this.recordManager.saveBackup();
    } finally {
      this.releaseBussyState();
    }
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
