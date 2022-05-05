import {
  openRecord,
  saveAppSetting,
  saveGameSetting,
  saveRecord,
  saveResearchSetting,
  showOpenRecordDialog,
  showSaveRecordDialog,
} from "@/ipc/renderer";
import {
  Color,
  exportCSA,
  ImmutableRecord,
  importCSA,
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
import { reactive, UnwrapNestedRefs } from "vue";
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
import { InfoCommand, USIInfoSender } from "@/store/usi";
import { RecordEntryCustomData } from "./record";
import { GameManager } from "./game";
import { defaultRecordFileName } from "@/helpers/path";
import { ResearchSetting } from "@/settings/research";
import { BussyStore } from "./bussy";
import { USIPlayerMonitor, USIMonitor } from "./usi";
import { Mode } from "./mode";
import { MessageStore } from "./message";
import { ErrorStore } from "./error";
import * as uri from "@/uri";
import { Confirmation } from "./confirm";
import { USIPlayer } from "@/players/usi";

class Store {
  private _bussy: BussyStore;
  private _message: MessageStore;
  private _error: ErrorStore;
  private _appSetting: AppSetting;
  private _mode: Mode;
  private lastMode?: Mode;
  private _confirmation?: Confirmation;
  private _usi: USIMonitor;
  private game: GameManager;
  private researcher?: USIPlayer;
  private unlimitedBeepHandler?: AudioEventHandler;
  private _recordFilePath?: string;
  private _record: Record;

  constructor() {
    this._bussy = new BussyStore();
    this._message = new MessageStore();
    this._error = new ErrorStore();
    this._appSetting = defaultAppSetting();
    this._mode = Mode.NORMAL;
    this._usi = new USIMonitor();
    this.game = new GameManager(this);
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
    if (this.record.usi != usi) {
      return;
    }
    this._usi.update(sessionID, this.record.position, sender, name, info);
    const entryData = new RecordEntryCustomData(this.record.current.customData);
    entryData.updateUSIInfo(this.record.position.color, sender, info);
    this.record.current.customData = entryData.stringify();
  }

  get gameSetting(): GameSetting {
    return this.game.setting;
  }

  get blackTimeMs(): number {
    return this.game.blackTimeMs;
  }

  get blackByoyomi(): number {
    return this.game.blackByoyomi;
  }

  get whiteTimeMs(): number {
    return this.game.whiteTimeMs;
  }

  get whiteByoyomi(): number {
    return this.game.whiteByoyomi;
  }

  get elapsedMs(): number {
    return this.game.elapsedMs;
  }

  startGame(setting: GameSetting): void {
    this.startGameAsync(setting).catch((e) => {
      this.pushError("対局の初期化中にエラーが出ました: " + e);
    });
  }

  private async startGameAsync(setting: GameSetting): Promise<void> {
    if (this.mode !== Mode.GAME_DIALOG) {
      return;
    }
    this.retainBussyState();
    try {
      await saveGameSetting(setting);
      this.initializeRecordForGame(setting);
      this.initializeDisplaySettingForGame(setting);
      await this.game.startGame(setting);
      this._mode = Mode.GAME;
    } finally {
      this.releaseBussyState();
    }
  }

  private initializeRecordForGame(setting: GameSetting): void {
    if (setting.startPosition) {
      const position = new Position();
      position.reset(setting.startPosition);
      this._record.clear(position);
      this.onUpdatePosition();
      this.clearRecordFilePath();
    }
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.BLACK_NAME,
      setting.black.name
    );
    this._record.metadata.setStandardMetadata(
      RecordMetadataKey.WHITE_NAME,
      setting.white.name
    );
    // TODO: タイトルを棋譜情報に入れる。
    // TODO: 対局日時を棋譜情報に入れる。
    // TODO: 持ち時間を棋譜情報に入れる。
  }

  private initializeDisplaySettingForGame(setting: GameSetting): void {
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
  }

  stopGame(): void {
    if (this.mode === Mode.GAME) {
      this.game.endGame(SpecialMove.INTERRUPT);
    }
  }

  onMove(move: Move): void {
    if (this.mode !== Mode.GAME) {
      return;
    }
    this._record.append(move, {
      ignoreValidation: true,
    });
    this.onUpdatePosition();
    this.record.current.setElapsedMs(this.elapsedMs);
    playPieceBeat(this.appSetting.pieceVolume);
  }

  onEndGame(specialMove?: SpecialMove): void {
    if (this.mode !== Mode.GAME) {
      return;
    }
    if (specialMove) {
      this.enqueueMessage(
        `対局終了（${specialMoveToDisplayString(specialMove)})`
      );
    }
    this._record.append(specialMove || SpecialMove.INTERRUPT);
    this.onUpdatePosition();
    this.record.current.setElapsedMs(this.elapsedMs);
    this._mode = Mode.NORMAL;
  }

  onBeepShort(): void {
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

  onBeepUnlimited(): void {
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

  onStopBeep(): void {
    if (this.unlimitedBeepHandler) {
      this.unlimitedBeepHandler.stop();
      this.unlimitedBeepHandler = undefined;
    }
  }

  onError(e: unknown): void {
    this.pushError(e);
  }

  doMove(move: Move): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    this._record.append(move);
    this.onUpdatePosition();
    playPieceBeat(this.appSetting.pieceVolume);
  }

  startResearch(researchSetting: ResearchSetting): void {
    this.startResearchAsync(researchSetting)
      .then(() => {
        this.onUpdatePosition();
      })
      .catch((e) => {
        this.pushError("検討の初期化中にエラーが出ました: " + e);
      });
  }

  private async startResearchAsync(
    researchSetting: ResearchSetting
  ): Promise<void> {
    if (this.mode !== Mode.RESEARCH_DIALOG) {
      return;
    }
    if (!researchSetting.usi) {
      this.pushError("検討に使用するエンジンの設定が取得できませんでした。");
      return;
    }
    this.retainBussyState();
    try {
      await saveResearchSetting(researchSetting);
      const researcher = new USIPlayer(researchSetting.usi);
      await researcher.launch();
      this.researcher = researcher;
      this._mode = Mode.RESEARCH;
    } finally {
      this.releaseBussyState();
    }
  }

  stopResearch(): void {
    this.stopResearchAsync().catch((e) => {
      this.pushError("検討の終了中にエラーが出ました: " + e);
    });
  }

  private async stopResearchAsync(): Promise<void> {
    if (this.mode !== Mode.RESEARCH) {
      return;
    }
    this.retainBussyState();
    try {
      if (this.researcher) {
        await this.researcher.close();
        this.researcher = undefined;
      }
      this._mode = Mode.NORMAL;
    } finally {
      this.releaseBussyState();
    }
  }

  private onUpdatePosition(): void {
    if (this.researcher) {
      this.researcher.startResearch(this.record).catch((e) => {
        this.pushError("エンジンとの通信でエラーが出ました: " + e);
      });
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

  get record(): ImmutableRecord {
    return this._record;
  }

  newRecord(): void {
    if (this.mode != Mode.NORMAL) {
      return;
    }
    this._record.clear(new Position());
    this.onUpdatePosition();
    this.clearRecordFilePath();
  }

  updateRecordComment(comment: string): void {
    this.record.current.comment = comment;
  }

  updateStandardRecordMetadata(update: {
    key: RecordMetadataKey;
    value: string;
  }): void {
    this._record.metadata.setStandardMetadata(update.key, update.value);
  }

  insertSpecialMove(specialMove: SpecialMove): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    this._record.append(specialMove);
    this.onUpdatePosition();
  }

  startPositionEditing(): void {
    if (this.mode !== Mode.NORMAL) {
      return;
    }
    this.showConfirmation({
      message: "現在の棋譜は削除されます。よろしいですか？",
      onOk: () => {
        this._mode = Mode.POSITION_EDITING;
        this._record.clear(this.record.position);
        this.onUpdatePosition();
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
        this._record.clear(position);
        this.onUpdatePosition();
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
    this._record.clear(position);
    this.onUpdatePosition();
    this.clearRecordFilePath();
  }

  editPosition(change: PositionChange): void {
    if (this.mode === Mode.POSITION_EDITING) {
      const position = this.record.position.clone();
      position.edit(change);
      this._record.clear(position);
      this.onUpdatePosition();
      this.clearRecordFilePath();
    }
  }

  changeMoveNumber(number: number): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    this._record.goto(number);
    this.onUpdatePosition();
  }

  changeBranch(index: number): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    if (this.record.current.branchIndex === index) {
      return;
    }
    this._record.switchBranchByIndex(index);
    this.onUpdatePosition();
  }

  removeRecordAfter(): void {
    if (this.mode !== Mode.NORMAL && this.mode !== Mode.RESEARCH) {
      return;
    }
    const next = this.record.current.next;
    if (!next || !(next.move instanceof Move)) {
      this._record.removeAfter();
      this.onUpdatePosition();
      return;
    }
    this.showConfirmation({
      message: `${this.record.current.number}手目以降を削除します。よろしいですか？`,
      onOk: () => {
        this._record.removeAfter();
        this.onUpdatePosition();
      },
    });
  }

  copyRecord(): void {
    const str = exportKakinoki(this._record, {
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
      this.onUpdatePosition();
    } else {
      this.pushError(recordOrError);
    }
  }

  openRecord(path?: string): void {
    this.openRecordAsync(path).catch((e) => {
      this.pushError("棋譜の読み込み中にエラーが出ました: " + e);
    });
  }

  private async openRecordAsync(path?: string): Promise<void> {
    if (this.mode !== Mode.NORMAL) {
      return;
    }
    this.retainBussyState();
    try {
      if (!path) {
        path = await showOpenRecordDialog();
        if (!path) {
          return;
        }
      }
      const data = await openRecord(path);
      let recordOrError: Record | Error;
      if (path.match(/\.kif$/) || path.match(/\.kifu$/)) {
        const str = path.match(/\.kif$/)
          ? iconv.decode(data as Buffer, "Shift_JIS")
          : new TextDecoder().decode(data);
        recordOrError = importKakinoki(str);
      } else if (path.match(/\.csa$/)) {
        recordOrError = importCSA(new TextDecoder().decode(data));
      } else {
        recordOrError = new Error("不明なファイル形式: " + path);
      }
      if (recordOrError instanceof Error) {
        throw recordOrError;
      }
      this.updateRecordFilePath(path);
      this._record = recordOrError;
      this.onUpdatePosition();
    } finally {
      this.releaseBussyState();
    }
  }

  saveRecord(options?: { overwrite: boolean }): void {
    this.saveRecordAsync(options).catch((e) => {
      this.pushError("棋譜の保存中にエラーが出ました: " + e);
    });
  }

  private async saveRecordAsync(options?: {
    overwrite: boolean;
  }): Promise<void> {
    if (this.mode !== Mode.NORMAL) {
      return;
    }
    this.retainBussyState();
    try {
      let path = this.recordFilePath;
      if (!options?.overwrite || !path) {
        const defaultPath = defaultRecordFileName(this._record.metadata);
        path = await showSaveRecordDialog(defaultPath);
        if (!path) {
          return;
        }
      }
      let data: Uint8Array;
      if (path.match(/\.kif$/) || path.match(/\.kifu$/)) {
        const str = exportKakinoki(this.record, {
          returnCode: this.appSetting.returnCode,
        });
        data = path.match(/\.kif$/)
          ? iconv.encode(str, "Shift_JIS")
          : new TextEncoder().encode(str);
      } else if (path.match(/\.csa$/)) {
        data = new TextEncoder().encode(
          exportCSA(this.record, {
            returnCode: this.appSetting.returnCode,
          })
        );
      } else {
        throw new Error("不明なファイル形式: " + path);
      }
      await saveRecord(path, data);
      this.updateRecordFilePath(path);
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

const store = reactive<Store>(new Store());

export function useStore(): UnwrapNestedRefs<Store> {
  return store;
}
