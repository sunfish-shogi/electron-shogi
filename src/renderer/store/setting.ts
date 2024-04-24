import {
  AppSettingUpdate,
  BackgroundImageType,
  BoardImageType,
  BoardLabelType,
  ClockSoundTarget,
  EvaluationViewFrom,
  KingPieceType,
  LeftSideControlType,
  PieceImageType,
  PieceStandImageType,
  PositionImageFontWeight,
  PositionImageHandLabelType,
  PositionImageStyle,
  PositionImageTypeface,
  RightSideControlType,
  Tab,
  TabPaneType,
  TextDecodingRule,
  Thema,
  buildUpdatedAppSetting,
  defaultAppSetting,
} from "@/common/settings/app";
import { UnwrapNestedRefs, reactive } from "vue";
import api from "@/renderer/ipc/api";
import { LogLevel } from "@/common/log";
import { Language } from "@/common/i18n";
import { RecordFileFormat } from "@/common/file/record";

class AppSettingStore {
  private setting = defaultAppSetting();

  get language(): Language {
    return this.setting.language;
  }
  get thema(): Thema {
    return this.setting.thema;
  }
  get pieceImage(): PieceImageType {
    return this.setting.pieceImage;
  }
  get kingPieceType(): KingPieceType {
    return this.setting.kingPieceType;
  }
  get backgroundImageType(): BackgroundImageType {
    return this.setting.backgroundImageType;
  }
  get backgroundImageFileURL(): string | undefined {
    return this.setting.backgroundImageFileURL;
  }
  get boardImage(): BoardImageType {
    return this.setting.boardImage;
  }
  get croppedPieceImageBaseURL(): string | undefined {
    return this.setting.croppedPieceImageBaseURL;
  }
  get croppedPieceImageQuery(): string | undefined {
    return this.setting.croppedPieceImageQuery;
  }
  get pieceImageFileURL(): string | undefined {
    return this.setting.pieceImageFileURL;
  }
  get deletePieceImageMargin(): boolean {
    return this.setting.deletePieceImageMargin;
  }
  get boardImageFileURL(): string | undefined {
    return this.setting.boardImageFileURL;
  }
  get pieceStandImage(): PieceStandImageType {
    return this.setting.pieceStandImage;
  }
  get pieceStandImageFileURL(): string | undefined {
    return this.setting.pieceStandImageFileURL;
  }
  get enableTransparent(): boolean {
    return this.setting.enableTransparent;
  }
  get boardOpacity(): number {
    return this.setting.boardOpacity;
  }
  get pieceStandOpacity(): number {
    return this.setting.pieceStandOpacity;
  }
  get recordOpacity(): number {
    return this.setting.recordOpacity;
  }
  get boardLabelType(): BoardLabelType {
    return this.setting.boardLabelType;
  }
  get leftSideControlType(): LeftSideControlType {
    return this.setting.leftSideControlType;
  }
  get rightSideControlType(): RightSideControlType {
    return this.setting.rightSideControlType;
  }
  get pieceVolume(): number {
    return this.setting.pieceVolume;
  }
  get clockVolume(): number {
    return this.setting.clockVolume;
  }
  get clockPitch(): number {
    return this.setting.clockPitch;
  }
  get clockSoundTarget(): ClockSoundTarget {
    return this.setting.clockSoundTarget;
  }
  get boardFlipping(): boolean {
    return this.setting.boardFlipping;
  }
  get tabPaneType(): TabPaneType {
    return this.setting.tabPaneType;
  }
  get tab(): Tab {
    return this.setting.tab;
  }
  get tab2(): Tab {
    return this.setting.tab2;
  }
  get topPaneHeightPercentage(): number {
    return this.setting.topPaneHeightPercentage;
  }
  get topPanePreviousHeightPercentage(): number {
    return this.setting.topPanePreviousHeightPercentage;
  }
  get bottomLeftPaneWidthPercentage(): number {
    return this.setting.bottomLeftPaneWidthPercentage;
  }
  get defaultRecordFileFormat(): RecordFileFormat {
    return this.setting.defaultRecordFileFormat;
  }
  get textDecodingRule(): TextDecodingRule {
    return this.setting.textDecodingRule;
  }
  get returnCode(): string {
    return this.setting.returnCode;
  }
  get autoSaveDirectory(): string {
    return this.setting.autoSaveDirectory;
  }
  get recordFileNameTemplate(): string {
    return this.setting.recordFileNameTemplate;
  }
  get useCSAV3(): boolean {
    return this.setting.useCSAV3;
  }
  get enableUSIFileStartpos(): boolean {
    return this.setting.enableUSIFileStartpos;
  }
  get enableUSIFileResign(): boolean {
    return this.setting.enableUSIFileResign;
  }
  get translateEngineOptionName(): boolean {
    return this.setting.translateEngineOptionName;
  }
  get engineTimeoutSeconds(): number {
    return this.setting.engineTimeoutSeconds;
  }
  get evaluationViewFrom(): EvaluationViewFrom {
    return this.setting.evaluationViewFrom;
  }
  get coefficientInSigmoid(): number {
    return this.setting.coefficientInSigmoid;
  }
  get badMoveLevelThreshold1(): number {
    return this.setting.badMoveLevelThreshold1;
  }
  get badMoveLevelThreshold2(): number {
    return this.setting.badMoveLevelThreshold2;
  }
  get badMoveLevelThreshold3(): number {
    return this.setting.badMoveLevelThreshold3;
  }
  get badMoveLevelThreshold4(): number {
    return this.setting.badMoveLevelThreshold4;
  }
  get showElapsedTimeInRecordView(): boolean {
    return this.setting.showElapsedTimeInRecordView;
  }
  get showCommentInRecordView(): boolean {
    return this.setting.showCommentInRecordView;
  }
  get enableAppLog(): boolean {
    return this.setting.enableAppLog;
  }
  get enableUSILog(): boolean {
    return this.setting.enableUSILog;
  }
  get enableCSALog(): boolean {
    return this.setting.enableCSALog;
  }
  get logLevel(): LogLevel {
    return this.setting.logLevel;
  }
  get positionImageStyle(): PositionImageStyle {
    return this.setting.positionImageStyle;
  }
  get positionImageSize(): number {
    return this.setting.positionImageSize;
  }
  get positionImageTypeface(): PositionImageTypeface {
    return this.setting.positionImageTypeface;
  }
  get positionImageHandLabelType(): PositionImageHandLabelType {
    return this.setting.positionImageHandLabelType;
  }
  get useBookmarkAsPositionImageHeader(): boolean {
    return this.setting.useBookmarkAsPositionImageHeader;
  }
  get positionImageHeader(): string {
    return this.setting.positionImageHeader;
  }
  get positionImageCharacterY(): number {
    return this.setting.positionImageCharacterY;
  }
  get positionImageFontScale(): number {
    return this.setting.positionImageFontScale;
  }
  get positionImageFontWeight(): PositionImageFontWeight {
    return this.setting.positionImageFontWeight;
  }
  get lastRecordFilePath(): string {
    return this.setting.lastRecordFilePath;
  }
  get lastUSIEngineFilePath(): string {
    return this.setting.lastUSIEngineFilePath;
  }
  get lastImageExportFilePath(): string {
    return this.setting.lastImageExportFilePath;
  }
  get lastOtherFilePath(): string {
    return this.setting.lastOtherFilePath;
  }
  get emptyRecordInfoVisibility(): boolean {
    return this.setting.emptyRecordInfoVisibility;
  }

  async loadAppSetting(): Promise<void> {
    this.setting = await api.loadAppSetting();
  }

  async updateAppSetting(update: AppSettingUpdate): Promise<void> {
    const updated = buildUpdatedAppSetting(this.setting, update);
    if (updated instanceof Error) {
      throw updated;
    }
    await api.saveAppSetting(updated);
    this.setting = updated;
  }

  flipBoard(): void {
    this.setting.boardFlipping = !this.setting.boardFlipping;
    api.saveAppSetting(this.setting);
  }
}

export function createAppSetting(): UnwrapNestedRefs<AppSettingStore> {
  return reactive(new AppSettingStore());
}

let app: UnwrapNestedRefs<AppSettingStore>;

export function useAppSetting(): UnwrapNestedRefs<AppSettingStore> {
  if (!app) {
    app = createAppSetting();
  }
  return app;
}
