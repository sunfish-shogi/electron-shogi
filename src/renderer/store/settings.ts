import {
  AppSettingsUpdate,
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
  buildUpdatedAppSettings,
  defaultAppSettings,
} from "@/common/settings/app";
import { UnwrapNestedRefs, reactive } from "vue";
import api from "@/renderer/ipc/api";
import { LogLevel } from "@/common/log";
import { Language } from "@/common/i18n";
import { RecordFileFormat } from "@/common/file/record";
import { BoardLayoutType } from "@/common/settings/layout";

class AppSettingsStore {
  private settings = defaultAppSettings();

  get language(): Language {
    return this.settings.language;
  }
  get thema(): Thema {
    return this.settings.thema;
  }
  get pieceImage(): PieceImageType {
    return this.settings.pieceImage;
  }
  get kingPieceType(): KingPieceType {
    return this.settings.kingPieceType;
  }
  get backgroundImageType(): BackgroundImageType {
    return this.settings.backgroundImageType;
  }
  get backgroundImageFileURL(): string | undefined {
    return this.settings.backgroundImageFileURL;
  }
  get boardLayoutType(): BoardLayoutType {
    return this.settings.boardLayoutType;
  }
  get boardImage(): BoardImageType {
    return this.settings.boardImage;
  }
  get croppedPieceImageBaseURL(): string | undefined {
    return this.settings.croppedPieceImageBaseURL;
  }
  get croppedPieceImageQuery(): string | undefined {
    return this.settings.croppedPieceImageQuery;
  }
  get pieceImageFileURL(): string | undefined {
    return this.settings.pieceImageFileURL;
  }
  get deletePieceImageMargin(): boolean {
    return this.settings.deletePieceImageMargin;
  }
  get boardImageFileURL(): string | undefined {
    return this.settings.boardImageFileURL;
  }
  get pieceStandImage(): PieceStandImageType {
    return this.settings.pieceStandImage;
  }
  get pieceStandImageFileURL(): string | undefined {
    return this.settings.pieceStandImageFileURL;
  }
  get enableTransparent(): boolean {
    return this.settings.enableTransparent;
  }
  get boardOpacity(): number {
    return this.settings.boardOpacity;
  }
  get pieceStandOpacity(): number {
    return this.settings.pieceStandOpacity;
  }
  get recordOpacity(): number {
    return this.settings.recordOpacity;
  }
  get boardLabelType(): BoardLabelType {
    return this.settings.boardLabelType;
  }
  get leftSideControlType(): LeftSideControlType {
    return this.settings.leftSideControlType;
  }
  get rightSideControlType(): RightSideControlType {
    return this.settings.rightSideControlType;
  }
  get pieceVolume(): number {
    return this.settings.pieceVolume;
  }
  get clockVolume(): number {
    return this.settings.clockVolume;
  }
  get clockPitch(): number {
    return this.settings.clockPitch;
  }
  get clockSoundTarget(): ClockSoundTarget {
    return this.settings.clockSoundTarget;
  }
  get boardFlipping(): boolean {
    return this.settings.boardFlipping;
  }
  get tabPaneType(): TabPaneType {
    return this.settings.tabPaneType;
  }
  get tab(): Tab {
    return this.settings.tab;
  }
  get tab2(): Tab {
    return this.settings.tab2;
  }
  get topPaneHeightPercentage(): number {
    return this.settings.topPaneHeightPercentage;
  }
  get topPanePreviousHeightPercentage(): number {
    return this.settings.topPanePreviousHeightPercentage;
  }
  get bottomLeftPaneWidthPercentage(): number {
    return this.settings.bottomLeftPaneWidthPercentage;
  }
  get defaultRecordFileFormat(): RecordFileFormat {
    return this.settings.defaultRecordFileFormat;
  }
  get textDecodingRule(): TextDecodingRule {
    return this.settings.textDecodingRule;
  }
  get returnCode(): string {
    return this.settings.returnCode;
  }
  get autoSaveDirectory(): string {
    return this.settings.autoSaveDirectory;
  }
  get recordFileNameTemplate(): string {
    return this.settings.recordFileNameTemplate;
  }
  get useCSAV3(): boolean {
    return this.settings.useCSAV3;
  }
  get enableUSIFileStartpos(): boolean {
    return this.settings.enableUSIFileStartpos;
  }
  get enableUSIFileResign(): boolean {
    return this.settings.enableUSIFileResign;
  }
  get translateEngineOptionName(): boolean {
    return this.settings.translateEngineOptionName;
  }
  get engineTimeoutSeconds(): number {
    return this.settings.engineTimeoutSeconds;
  }
  get evaluationViewFrom(): EvaluationViewFrom {
    return this.settings.evaluationViewFrom;
  }
  get maxArrowsPerEngine(): number {
    return this.settings.maxArrowsPerEngine;
  }
  get coefficientInSigmoid(): number {
    return this.settings.coefficientInSigmoid;
  }
  get badMoveLevelThreshold1(): number {
    return this.settings.badMoveLevelThreshold1;
  }
  get badMoveLevelThreshold2(): number {
    return this.settings.badMoveLevelThreshold2;
  }
  get badMoveLevelThreshold3(): number {
    return this.settings.badMoveLevelThreshold3;
  }
  get badMoveLevelThreshold4(): number {
    return this.settings.badMoveLevelThreshold4;
  }
  get showElapsedTimeInRecordView(): boolean {
    return this.settings.showElapsedTimeInRecordView;
  }
  get showCommentInRecordView(): boolean {
    return this.settings.showCommentInRecordView;
  }
  get enableAppLog(): boolean {
    return this.settings.enableAppLog;
  }
  get enableUSILog(): boolean {
    return this.settings.enableUSILog;
  }
  get enableCSALog(): boolean {
    return this.settings.enableCSALog;
  }
  get logLevel(): LogLevel {
    return this.settings.logLevel;
  }
  get positionImageStyle(): PositionImageStyle {
    return this.settings.positionImageStyle;
  }
  get positionImageSize(): number {
    return this.settings.positionImageSize;
  }
  get positionImageTypeface(): PositionImageTypeface {
    return this.settings.positionImageTypeface;
  }
  get positionImageHandLabelType(): PositionImageHandLabelType {
    return this.settings.positionImageHandLabelType;
  }
  get useBookmarkAsPositionImageHeader(): boolean {
    return this.settings.useBookmarkAsPositionImageHeader;
  }
  get positionImageHeader(): string {
    return this.settings.positionImageHeader;
  }
  get positionImageCharacterY(): number {
    return this.settings.positionImageCharacterY;
  }
  get positionImageFontScale(): number {
    return this.settings.positionImageFontScale;
  }
  get positionImageFontWeight(): PositionImageFontWeight {
    return this.settings.positionImageFontWeight;
  }
  get lastRecordFilePath(): string {
    return this.settings.lastRecordFilePath;
  }
  get lastUSIEngineFilePath(): string {
    return this.settings.lastUSIEngineFilePath;
  }
  get lastImageExportFilePath(): string {
    return this.settings.lastImageExportFilePath;
  }
  get lastOtherFilePath(): string {
    return this.settings.lastOtherFilePath;
  }
  get emptyRecordInfoVisibility(): boolean {
    return this.settings.emptyRecordInfoVisibility;
  }

  async loadAppSettings(): Promise<void> {
    this.settings = await api.loadAppSettings();
  }

  async updateAppSettings(update: AppSettingsUpdate): Promise<void> {
    const updated = buildUpdatedAppSettings(this.settings, update);
    if (updated instanceof Error) {
      throw updated;
    }
    await api.saveAppSettings(updated);
    this.settings = updated;
  }

  flipBoard(): void {
    this.settings.boardFlipping = !this.settings.boardFlipping;
    api.saveAppSettings(this.settings);
  }
}

export function createAppSettings(): UnwrapNestedRefs<AppSettingsStore> {
  return reactive(new AppSettingsStore());
}

let app: UnwrapNestedRefs<AppSettingsStore>;

export function useAppSettings(): UnwrapNestedRefs<AppSettingsStore> {
  if (!app) {
    app = createAppSettings();
  }
  return app;
}
