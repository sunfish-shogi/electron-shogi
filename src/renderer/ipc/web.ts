import { defaultAnalysisSetting } from "@/common/settings/analysis";
import { defaultAppSetting } from "@/common/settings/app";
import { defaultGameSetting } from "@/common/settings/game";
import { defaultResearchSetting } from "@/common/settings/research";
import { USIEngineSettings } from "@/common/settings/usi";
import { LogLevel } from "@/common/log";
import { Bridge } from "./api";
import { t } from "@/common/i18n";
import { defaultCSAGameSettingHistory } from "@/common/settings/csa";
import { defaultMateSearchSetting } from "@/common/settings/mate";
import { defaultBatchConversionSetting } from "@/common/settings/conversion";

enum STORAGE_KEY {
  APP_SETTING = "appSetting",
  RESEARCH_SETTING = "researchSetting",
  BATCH_CONVERSION_SETTING = "batchConversionSetting",
  ANALYSIS_SETTING = "analysisSetting",
  GAME_SETTING = "gameSetting",
  MATE_SEARCH_SETTING = "mateSearchSetting",
  CSA_GAME_SETTING_HISTORY = "csaGameSettingHistory",
}

// Electron を使わずにシンプルな Web アプリケーションとして実行した場合に使用します。
export const webAPI: Bridge = {
  async getRecordPathFromProcArg(): Promise<string> {
    return "";
  },
  updateAppState(): void {
    // DO NOTHING
  },
  openExplorer() {
    // DO NOTHING
  },
  async showOpenRecordDialog(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async openRecord(): Promise<Uint8Array> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async showSaveRecordDialog(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async saveRecord(): Promise<void> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async showSelectFileDialog(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async showSelectDirectoryDialog(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async showSelectImageDialog(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async getPieceImageBaseURL(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async cropPieceImage(): Promise<void> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async exportCaptureAsPNG(): Promise<void> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async exportCaptureAsJPEG(): Promise<void> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async convertRecordFiles(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async loadAppSetting(): Promise<string> {
    const json = localStorage.getItem(STORAGE_KEY.APP_SETTING);
    if (!json) {
      return JSON.stringify(defaultAppSetting());
    }
    return JSON.stringify({
      ...defaultAppSetting(),
      ...JSON.parse(json),
    });
  },
  async saveAppSetting(json: string): Promise<void> {
    localStorage.setItem(STORAGE_KEY.APP_SETTING, json);
  },
  async loadBatchConversionSetting(): Promise<string> {
    const json = localStorage.getItem(STORAGE_KEY.BATCH_CONVERSION_SETTING);
    if (!json) {
      return JSON.stringify(defaultBatchConversionSetting());
    }
    return JSON.stringify({
      ...defaultBatchConversionSetting(),
      ...JSON.parse(json),
    });
  },
  async saveBatchConversionSetting(json: string): Promise<void> {
    localStorage.setItem(STORAGE_KEY.BATCH_CONVERSION_SETTING, json);
  },
  async loadResearchSetting(): Promise<string> {
    const json = localStorage.getItem(STORAGE_KEY.RESEARCH_SETTING);
    if (!json) {
      return JSON.stringify(defaultResearchSetting());
    }
    return JSON.stringify({
      ...defaultResearchSetting(),
      ...JSON.parse(json),
    });
  },
  async saveResearchSetting(json: string): Promise<void> {
    localStorage.setItem(STORAGE_KEY.RESEARCH_SETTING, json);
  },
  async loadAnalysisSetting(): Promise<string> {
    const json = localStorage.getItem(STORAGE_KEY.ANALYSIS_SETTING);
    if (!json) {
      return JSON.stringify(defaultAnalysisSetting());
    }
    return JSON.stringify({
      ...defaultAnalysisSetting(),
      ...JSON.parse(json),
    });
  },
  async saveAnalysisSetting(json: string): Promise<void> {
    localStorage.setItem(STORAGE_KEY.ANALYSIS_SETTING, json);
  },
  async loadGameSetting(): Promise<string> {
    const json = localStorage.getItem(STORAGE_KEY.GAME_SETTING);
    if (!json) {
      return JSON.stringify(defaultGameSetting());
    }
    return JSON.stringify({
      ...defaultGameSetting(),
      ...JSON.parse(json),
    });
  },
  async saveGameSetting(json: string): Promise<void> {
    localStorage.setItem(STORAGE_KEY.GAME_SETTING, json);
  },
  async loadCSAGameSettingHistory(): Promise<string> {
    const json = localStorage.getItem(STORAGE_KEY.CSA_GAME_SETTING_HISTORY);
    if (!json) {
      return JSON.stringify(defaultCSAGameSettingHistory());
    }
    return JSON.stringify({
      ...defaultCSAGameSettingHistory(),
      ...JSON.parse(json),
    });
  },
  async saveCSAGameSettingHistory(json: string): Promise<void> {
    localStorage.setItem(STORAGE_KEY.CSA_GAME_SETTING_HISTORY, json);
  },
  async loadMateSearchSetting(): Promise<string> {
    const json = localStorage.getItem(STORAGE_KEY.MATE_SEARCH_SETTING);
    if (!json) {
      return JSON.stringify(defaultMateSearchSetting());
    }
    return JSON.stringify({
      ...defaultMateSearchSetting(),
      ...JSON.parse(json),
    });
  },
  async saveMateSearchSetting(json: string): Promise<void> {
    localStorage.setItem(STORAGE_KEY.MATE_SEARCH_SETTING, json);
  },
  async loadUSIEngineSetting(): Promise<string> {
    return new USIEngineSettings().json;
  },
  async saveUSIEngineSetting(): Promise<void> {
    // Do Nothing
  },
  async showSelectUSIEngineDialog(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async getUSIEngineInfo(): Promise<string> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async sendUSISetOption(): Promise<void> {
    // Do Nothing
  },
  async usiLaunch(): Promise<number> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async usiReady(): Promise<void> {
    // Do Nothing
  },
  async usiGo(): Promise<void> {
    // Do Nothing
  },
  async usiGoPonder(): Promise<void> {
    // Do Nothing
  },
  async usiPonderHit(): Promise<void> {
    // Do Nothing
  },
  async usiGoInfinite(): Promise<void> {
    // Do Nothing
  },
  async usiGoMate(): Promise<void> {
    // Do Nothing
  },
  async usiStop(): Promise<void> {
    // Do Nothing
  },
  async usiGameover(): Promise<void> {
    // Do Nothing
  },
  async usiQuit(): Promise<void> {
    // Do Nothing
  },
  async csaLogin(): Promise<number> {
    throw new Error(t.thisFeatureNotAvailableOnWebApp);
  },
  async csaLogout(): Promise<void> {
    // Do Nothing
  },
  async csaAgree(): Promise<void> {
    // Do Nothing
  },
  async csaMove(): Promise<void> {
    // Do Nothing
  },
  async csaResign(): Promise<void> {
    // Do Nothing
  },
  async csaWin(): Promise<void> {
    // Do Nothing
  },
  async csaStop(): Promise<void> {
    // Do Nothing
  },
  async isEncryptionAvailable(): Promise<boolean> {
    return false;
  },
  openLogFile(): void {
    // Do Nothing
  },
  log(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.log(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  },
  onSendError(): void {
    // Do Nothing
  },
  onMenuEvent(): void {
    // Do Nothing
  },
  onUpdateAppSetting(): void {
    // Do Nothing
  },
  onOpenRecord(): void {
    // Do Nothing
  },
  onUSIBestMove(): void {
    // Do Nothing
  },
  onUSICheckmate(): void {
    // Do Nothing
  },
  onUSICheckmateNotImplemented(): void {
    // Do Nothing
  },
  onUSICheckmateTimeout(): void {
    // Do Nothing
  },
  onUSINoMate(): void {
    // Do Nothing
  },
  onUSIInfo(): void {
    // Do Nothing
  },
  onUSIPonderInfo(): void {
    // Do Nothing
  },
  onCSAGameSummary(): void {
    // Do Nothing
  },
  onCSAReject(): void {
    // Do Nothing
  },
  onCSAStart(): void {
    // Do Nothing
  },
  onCSAMove(): void {
    // Do Nothing
  },
  onCSAGameResult(): void {
    // Do Nothing
  },
  onCSAClose(): void {
    // Do Nothing
  },
};
