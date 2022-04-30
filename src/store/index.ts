import {
  endGame,
  endResearch,
  openRecord,
  saveAppSetting,
  saveGameSetting,
  saveRecord,
  saveResearchSetting,
  showOpenRecordDialog,
  showSaveRecordDialog,
  startGame,
  startResearch,
  stopUSI,
  updateUSIPosition,
} from "@/ipc/renderer";
import {
  Color,
  InitialPositionType,
  Move,
  Position,
  PositionChange,
  Record,
  RecordMetadataKey,
  reverseColor,
  SpecialMove,
  specialMoveToDisplayString,
} from "@/shogi";
import { exportKakinoki, importKakinoki } from "@/shogi";
import { reactive, UnwrapNestedRefs, watch } from "vue";
import iconv from "iconv-lite";
import { GameSetting } from "@/settings/game";
import {
  AppSetting,
  AppSettingUpdate,
  ClockSoundTarget,
  defaultAppSetting,
} from "@/settings/app";
import {
  AudioEventHandler,
  beepShort,
  beepUnlimited,
  playPieceBeat,
} from "@/audio";
import { InfoCommand, USIInfoSender } from "@/usi/info";
import { RecordEntryCustomData } from "./record";
import { GameStore } from "./game";
import { defaultRecordFileName } from "@/helpers/path";
import { ResearchSetting } from "@/settings/research";
import { BussyStore } from "./bussy";
import { USIPlayerMonitor, USIStore } from "./usi";
import { Mode } from "./mode";
import { MessageStore } from "./message";
import { ErrorStore } from "./error";
import * as uri from "@/uri";
import { Confirmation } from "./confirm";

class Store {
  private _bussy: BussyStore;
  private _message: MessageStore;
  private _error: ErrorStore;
  private _appSetting: AppSetting;
  private _mode: Mode;
  private lastMode?: Mode;
  private _confirmation?: Confirmation;
  private _usi: USIStore;
  private usiSessionID: number;
  private _game: GameStore;
  private unlimitedBeepHandler?: AudioEventHandler;
  private _recordFilePath?: string;
  private _record: Record;

  constructor() {
    this._bussy = new BussyStore();
    this._message = new MessageStore();
    this._error = new ErrorStore();
    this._appSetting = defaultAppSetting();
    this._mode = Mode.NORMAL;
    this._usi = new USIStore();
    this.usiSessionID = 0;
    this._game = new GameStore();
    this._record = new Record();
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

  get message(): string {
    return this._message.message;
  }

  get hasMessage(): boolean {
    return this._message.hasMessage;
  }

  enqueueMessage(message: string): void {
    this._message.enqueue(message);
  }

  dequeueMessage(): void {
    this._message.dequeue();
  }

  get errors(): Error[] {
    return this._error.errors;
  }

  get hasError(): boolean {
    return this._error.hasError;
  }

  pushError(e: unknown): void {
    this._error.push(e);
  }

  clearErrors(): void {
    this._error.clear();
  }

  get appSetting(): AppSetting {
    return this._appSetting;
  }

  async updateAppSetting(update: AppSettingUpdate): Promise<void> {
    await saveAppSetting({
      ...this.appSetting,
      ...update,
    });
    this._appSetting = {
      ...this.appSetting,
      ...update,
    };
  }

  flipBoard(): void {
    this._appSetting.boardFlipping = !this.appSetting.boardFlipping;
    saveAppSetting(this.appSetting);
  }

  get mode(): Mode {
    return this._mode;
  }

  get confirmation(): string | undefined {
    return this._confirmation?.message;
  }

  showConfirmation(confirmation: Confirmation): void {
    this._confirmation = confirmation;
    this.lastMode = this.mode;
    this._mode = Mode.TEMPORARY;
  }

  confirmationOk(): void {
    const onOk = this._confirmation?.onOk;
    this._confirmation = undefined;
    if (this.lastMode) {
      this._mode = this.lastMode;
      this.lastMode = undefined;
    }
    if (onOk) {
      onOk();
    }
  }

  confirmationCancel(): void {
    const onCancel = this._confirmation?.onCancel;
    this._confirmation = undefined;
    if (this.lastMode) {
      this._mode = this.lastMode;
      this.lastMode = undefined;
    }
    if (onCancel) {
      onCancel();
    }
  }

  showPasteDialog(): void {
    if (this.mode === Mode.NORMAL) {
      this._mode = Mode.PASTE_DIALOG;
    }
  }

  closePasteDialog(): void {
    if (this.mode === Mode.PASTE_DIALOG) {
      this._mode = Mode.NORMAL;
    }
  }

  showGameDialog(): void {
    if (this.mode === Mode.NORMAL) {
      this._mode = Mode.GAME_DIALOG;
    }
  }

  showResearchDialog(): void {
    if (this.mode === Mode.NORMAL) {
      this._mode = Mode.RESEARCH_DIALOG;
    }
  }

  openAppSettingDialog(): void {
    if (this.mode === Mode.NORMAL) {
      this._mode = Mode.APP_SETTING_DIALOG;
    }
  }

  openUsiEngineManagementDialog(): void {
    if (this.mode === Mode.NORMAL) {
      this._mode = Mode.USI_ENGINE_SETTING_DIALOG;
    }
  }

  closeDialog(): void {
    if (
      this.mode === Mode.USI_ENGINE_SETTING_DIALOG ||
      this.mode === Mode.APP_SETTING_DIALOG ||
      this.mode === Mode.GAME_DIALOG ||
      this.mode === Mode.RESEARCH_DIALOG
    ) {
      this._mode = Mode.NORMAL;
    }
  }

  get usiBlackPlayerMonitor(): USIPlayerMonitor | undefined {
    return this._usi.blackPlayer;
  }

  get usiWhitePlayerMonitor(): USIPlayerMonitor | undefined {
    return this._usi.whitePlayer;
  }

  get usiResearcherMonitor(): USIPlayerMonitor | undefined {
    return this._usi.researcher;
  }

  updateUSIInfo(
    sessionID: number,
    usi: string,
    sender: USIInfoSender,
    name: string,
    info: InfoCommand
  ): void {
    if (this.usiSessionID !== sessionID || this.record.usi != usi) {
      return;
    }
    this._usi.update(sessionID, this.record.position, sender, name, info);
    const entryData = new RecordEntryCustomData(this.record.current.customData);
    entryData.updateUSIInfo(this.record.position.color, sender, info);
    this.record.current.customData = entryData.stringify();
  }

  private issueUSISessionID(): void {
    this.usiSessionID += 1;
  }

  get gameSetting(): GameSetting {
    return this._game.setting;
  }

  get blackTimeMs(): number {
    return this._game.blackTimeMs;
  }

  get blackByoyomi(): number {
    return this._game.blackByoyomi;
  }

  get whiteTimeMs(): number {
    return this._game.whiteTimeMs;
  }

  get whiteByoyomi(): number {
    return this._game.whiteByoyomi;
  }

  get elapsedMs(): number {
    return this._game.elapsedMs;
  }

  async startGame(setting: GameSetting): Promise<boolean> {
    if (this.mode !== Mode.GAME_DIALOG) {
      return false;
    }
    this.retainBussyState();
    try {
      await saveGameSetting(setting);
      if (setting.startPosition) {
        const position = new Position();
        position.reset(setting.startPosition);
        this.record.clear(position);
        this.clearRecordFilePath();
      }
      this.issueUSISessionID();
      await startGame(setting, this.usiSessionID);
      this._game.setup(setting);
      this._mode = Mode.GAME;
      this.record.metadata.setStandardMetadata(
        RecordMetadataKey.BLACK_NAME,
        setting.black.name
      );
      this.record.metadata.setStandardMetadata(
        RecordMetadataKey.WHITE_NAME,
        setting.white.name
      );
      if (setting.humanIsFront) {
        let flip = this.appSetting.boardFlipping;
        if (
          setting.black.uri === uri.ES_HUMAN &&
          setting.white.uri !== uri.ES_HUMAN
        ) {
          flip = false;
        } else if (
          setting.black.uri !== uri.ES_HUMAN &&
          setting.white.uri === uri.ES_HUMAN
        ) {
          flip = true;
        }
        if (flip !== this.appSetting.boardFlipping) {
          this.flipBoard();
        }
      }
      return true;
    } catch (e) {
      this.pushError("対局の初期化中にエラーが出ました: " + e);
      return false;
    } finally {
      this.releaseBussyState();
    }
  }

  async stopGame(specialMove?: SpecialMove): Promise<boolean> {
    if (this.mode !== Mode.GAME) {
      return false;
    }
    if (specialMove) {
      this.enqueueMessage(
        `対局終了（${specialMoveToDisplayString(specialMove)})`
      );
    }
    this.retainBussyState();
    try {
      await endGame(this.record.usi, specialMove);
      this.record.append(specialMove || SpecialMove.INTERRUPT);
      this.record.current.setElapsedMs(this.elapsedMs);
      this._mode = Mode.NORMAL;
      return true;
    } catch (e) {
      this.pushError("対局の終了中にエラーが出ました: " + e);
      return false;
    } finally {
      this.releaseBussyState();
    }
  }

  resetGameTimer(): void {
    const color = this.record.position.color;
    this._game.startTimer(color, {
      timeout: () => {
        if (this.isMovableByUser || this._game.setting.enableEngineTimeout) {
          this.stopGame(SpecialMove.TIMEOUT);
        } else {
          stopUSI(color);
        }
      },
      onBeepShort: () => {
        this.beepShort();
      },
      onBeepUnlimited: () => {
        this.beepUnlimited();
      },
    });
  }

  async resignByUser(): Promise<boolean> {
    if (this.mode !== Mode.GAME) {
      return false;
    }
    if (!this.isMovableByUser) {
      return false;
    }
    return this.stopGame(SpecialMove.RESIGN);
  }

  doMoveByUser(move: Move): boolean {
    if (!this.isMovableByUser) {
      return false;
    }
    if (this.mode === Mode.GAME) {
      this.incrementTime();
    }
    this.doMove(move);
    return true;
  }

  doMoveByUsiEngine(
    sessionID: number,
    usi: string,
    color: Color,
    sfen: string
  ): boolean {
    if (this.mode !== Mode.GAME) {
      return false;
    }
    if (this.usiSessionID !== sessionID) {
      return false;
    }
    if (this.record.usi !== usi) {
      return false;
    }
    if (color !== this.record.position.color) {
      this.pushError("手番ではないエンジンから指し手を受信しました:" + sfen);
      this.stopGame(SpecialMove.FOUL_LOSE);
      return false;
    }
    if (sfen === "resign") {
      this.stopGame(SpecialMove.RESIGN);
      return true;
    }
    if (sfen === "win") {
      // TODO: 勝ち宣言が正当かどうかをチェックする。
      this.stopGame(SpecialMove.ENTERING_OF_KING);
      return true;
    }
    const move = this.record.position.createMoveBySFEN(sfen);
    if (!move || !this.record.position.isValidMove(move)) {
      this.pushError("エンジンから不明な指し手を受信しました:" + sfen);
      this.stopGame(SpecialMove.FOUL_LOSE);
      return false;
    }
    this.incrementTime();
    this.doMove(move);
    return true;
  }

  doMove(move: Move): void {
    this.record.append(move, {
      ignoreValidation: true,
    });
    this.record.current.setElapsedMs(this.elapsedMs);
    playPieceBeat(this.appSetting.pieceVolume);
    if (this.mode !== Mode.GAME) {
      return;
    }
    const color = this.record.perpetualCheck;
    if (color) {
      if (color === this.record.position.color) {
        this.stopGame(SpecialMove.FOUL_LOSE);
      } else {
        this.stopGame(SpecialMove.FOUL_WIN);
      }
    } else if (this.record.repetition) {
      this.stopGame(SpecialMove.REPETITION_DRAW);
    }
  }

  private incrementTime(): void {
    this._game.incrementTime(this.record.position.color);
  }

  clearGameTimer(): void {
    this._game.clearTimer();
    this.stopBeep();
  }

  private beepUnlimited(): void {
    if (
      this.appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER &&
      !this.isMovableByUser
    ) {
      return;
    }
    if (this.unlimitedBeepHandler) {
      return;
    }
    this.unlimitedBeepHandler = beepUnlimited({
      frequency: this.appSetting.clockPitch,
      volume: this.appSetting.clockVolume,
    });
  }

  private beepShort(): void {
    if (
      this.appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER &&
      !this.isMovableByUser
    ) {
      return;
    }
    if (this.unlimitedBeepHandler) {
      return;
    }
    beepShort({
      frequency: this.appSetting.clockPitch,
      volume: this.appSetting.clockVolume,
    });
  }

  async startResearch(researchSetting: ResearchSetting): Promise<boolean> {
    if (this.mode !== Mode.RESEARCH_DIALOG) {
      return false;
    }
    this.retainBussyState();
    try {
      await saveResearchSetting(researchSetting);
      this.issueUSISessionID();
      await startResearch(researchSetting, this.usiSessionID);
      this._mode = Mode.RESEARCH;
      return true;
    } catch (e) {
      this.pushError("検討の初期化中にエラーが出ました: " + e);
      return false;
    } finally {
      this.releaseBussyState();
    }
  }

  async stopResearch(): Promise<boolean> {
    if (this.mode !== Mode.RESEARCH) {
      return false;
    }
    this.retainBussyState();
    try {
      await endResearch();
      this._mode = Mode.NORMAL;
      return true;
    } catch (e) {
      this.pushError("検討の終了中にエラーが出ました: " + e);
      return false;
    } finally {
      this.releaseBussyState();
    }
  }

  get recordFilePath(): string | undefined {
    return this._recordFilePath;
  }

  private updateRecordFilePath(recordFilePath: string): void {
    this._recordFilePath = recordFilePath;
  }

  private clearRecordFilePath(): void {
    this._recordFilePath = undefined;
  }

  private stopBeep(): void {
    if (this.unlimitedBeepHandler) {
      this.unlimitedBeepHandler.stop();
      this.unlimitedBeepHandler = undefined;
    }
  }

  get record(): Record {
    return this._record;
  }

  newRecord(): void {
    if (this.mode != Mode.NORMAL) {
      return;
    }
    this.record.clear(new Position());
    this.clearRecordFilePath();
  }

  updateRecordComment(comment: string): void {
    this.record.current.comment = comment;
  }

  updateStandardRecordMetadata(update: {
    key: RecordMetadataKey;
    value: string;
  }): void {
    this.record.metadata.setStandardMetadata(update.key, update.value);
  }

  insertSpecialMove(specialMove: SpecialMove): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    this.record.append(specialMove);
  }

  startPositionEditing(): void {
    if (this.mode !== Mode.NORMAL) {
      return;
    }
    this.showConfirmation({
      message: "現在の棋譜は削除されます。よろしいですか？",
      onOk: () => {
        this._mode = Mode.POSITION_EDITING;
        this.record.clear(this.record.position);
        this.clearRecordFilePath();
      },
    });
  }

  endPositionEditing(): void {
    // FIXME: 局面整合性チェック
    if (this.mode === Mode.POSITION_EDITING) {
      this._mode = Mode.NORMAL;
    }
  }

  initializePosition(initialPositionType: InitialPositionType): void {
    if (this.mode != Mode.POSITION_EDITING) {
      return;
    }
    this.showConfirmation({
      message: "現在の局面は破棄されます。よろしいですか？",
      onOk: () => {
        const position = new Position();
        position.reset(initialPositionType);
        this.record.clear(position);
        this.clearRecordFilePath();
      },
    });
  }

  changeTurn(): void {
    if (this.mode != Mode.POSITION_EDITING) {
      return;
    }
    const position = this.record.position.clone();
    position.setColor(reverseColor(position.color));
    this.record.clear(position);
    this.clearRecordFilePath();
  }

  editPosition(change: PositionChange): void {
    if (this.mode === Mode.POSITION_EDITING) {
      const position = this.record.position.clone();
      position.edit(change);
      this.record.clear(position);
      this.clearRecordFilePath();
    }
  }

  changeMoveNumber(number: number): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    this.record.goto(number);
  }

  changeBranch(index: number): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    if (this.record.current.branchIndex === index) {
      return;
    }
    this.record.switchBranchByIndex(index);
  }

  removeRecordAfter(): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    const next = this.record.current.next;
    if (!next || !(next.move instanceof Move)) {
      this.record.removeAfter();
      return;
    }
    this.showConfirmation({
      message: `${this.record.current.number}手目以降を削除します。よろしいですか？`,
      onOk: () => {
        this.record.removeAfter();
      },
    });
  }

  copyRecord(): void {
    const str = exportKakinoki(this.record, {
      returnCode: this.appSetting.returnCode,
    });
    navigator.clipboard.writeText(str);
  }

  pasteRecord(data: string): void {
    if (this.mode !== Mode.NORMAL) {
      return;
    }
    const recordOrError = importKakinoki(data);
    if (recordOrError instanceof Record) {
      this.clearRecordFilePath();
      this._record = recordOrError;
    } else {
      this.pushError(recordOrError);
    }
  }

  async openRecord(path?: string): Promise<boolean> {
    if (this.mode !== Mode.NORMAL) {
      return false;
    }
    this.retainBussyState();
    try {
      if (!path) {
        path = await showOpenRecordDialog();
        if (!path) {
          return false;
        }
      }
      const data = await openRecord(path);
      if (path.match(/\.kif$/) || path.match(/\.kifu$/)) {
        const str = path.match(/\.kif$/)
          ? iconv.decode(data, "Shift_JIS")
          : data.toString();
        const recordOrError = importKakinoki(str);
        if (recordOrError instanceof Record) {
          this.updateRecordFilePath(path);
          this._record = recordOrError;
        } else {
          this.pushError(recordOrError);
        }
        return true;
      } else {
        this.pushError("不明なファイル形式: " + path);
        return false;
      }
    } catch (e) {
      this.pushError("棋譜の読み込み中にエラーが出ました: " + e);
      return false;
    } finally {
      this.releaseBussyState();
    }
  }

  async saveRecord(options?: { overwrite: boolean }): Promise<boolean> {
    if (this.mode !== Mode.NORMAL) {
      return false;
    }
    this.retainBussyState();
    try {
      let path = this.recordFilePath;
      if (!options?.overwrite || !path) {
        const defaultPath = defaultRecordFileName(this.record.metadata);
        path = await showSaveRecordDialog(defaultPath);
        if (!path) {
          return false;
        }
      }
      if (path.match(/\.kif$/) || path.match(/\.kifu$/)) {
        const str = exportKakinoki(this.record, {
          returnCode: this.appSetting.returnCode,
        });
        const data = path.match(/\.kif$/)
          ? iconv.encode(str, "Shift_JIS")
          : Buffer.from(str);
        await saveRecord(path, data);
        this.updateRecordFilePath(path);
        return true;
      } else {
        this.pushError("不明なファイル形式: " + path);
        return false;
      }
    } catch (e) {
      this.pushError("棋譜の保存中にエラーが出ました: " + e);
      return false;
    } finally {
      this.releaseBussyState();
    }
  }

  get isMovableByUser() {
    switch (this.mode) {
      case Mode.NORMAL:
      case Mode.RESEARCH:
        return true;
      case Mode.GAME:
        return (
          (this.record.position.color === Color.BLACK
            ? this.gameSetting.black.uri
            : this.gameSetting.white.uri) === uri.ES_HUMAN
        );
    }
    return false;
  }
}

const storeV2 = reactive<Store>(new Store());

export function useStore(): UnwrapNestedRefs<Store> {
  return storeV2;
}

watch(
  [() => storeV2.mode, () => storeV2.record.position],
  () => {
    storeV2.clearGameTimer();
    if (storeV2.mode === Mode.GAME) {
      storeV2.resetGameTimer();
    }
    if (storeV2.mode === Mode.GAME || storeV2.mode === Mode.RESEARCH) {
      updateUSIPosition(
        storeV2.record.usi,
        storeV2.gameSetting,
        storeV2.blackTimeMs,
        storeV2.whiteTimeMs
      );
    }
  },
  { deep: true }
);
