import { defaultAnalysisSetting } from "@/common/settings/analysis";
import { defaultAppSetting } from "@/common/settings/app";
import { defaultGameSetting } from "@/common/settings/game";
import { defaultResearchSetting } from "@/common/settings/research";
import { USIEngineSettings } from "@/common/settings/usi";
import { LogLevel } from "../../common/log";
import { Bridge } from "./api";

enum STORAGE_KEY {
  APP_SETTING = "appSetting",
  RESEARCH_SETTING = "researchSetting",
  ANALYSIS_SETTING = "analysisSetting",
  GAME_SETTING = "gameSetting",
  CSA_GAME_SETTING_HISTORY = "csaGameSettingHistory",
}

// Electron を使わずにシンプルな Web アプリケーションとして実行した場合に使用します。
export const webAPI: Bridge = {
  async getRecordPathFromProcArg(): Promise<string> {
    return "";
  },
  updateMenuState(): void {
    // DO NOTHING
  },
  async showOpenRecordDialog(): Promise<string> {
    throw "Web版では利用できない機能です。";
  },
  async openRecord(): Promise<Uint8Array> {
    throw "Web版では利用できない機能です。";
  },
  async showSaveRecordDialog(): Promise<string> {
    throw "Web版では利用できない機能です。";
  },
  async saveRecord(): Promise<void> {
    throw "Web版では利用できない機能です。";
  },
  async showSelectFileDialog(): Promise<string> {
    throw "Web版では利用できない機能です。";
  },
  async showSelectDirectoryDialog(): Promise<string> {
    throw "Web版では利用できない機能です。";
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
    throw "Web版では利用できない機能です。";
  },
  async saveCSAGameSettingHistory(json: string): Promise<void> {
    localStorage.setItem(STORAGE_KEY.CSA_GAME_SETTING_HISTORY, json);
  },
  async loadUSIEngineSetting(): Promise<string> {
    return new USIEngineSettings().json;
  },
  async saveUSIEngineSetting(): Promise<void> {
    // Do Nothing
  },
  async showSelectUSIEngineDialog(): Promise<string> {
    throw "Web版では利用できない機能です。";
  },
  async getUSIEngineInfo(): Promise<string> {
    throw "Web版では利用できない機能です。";
  },
  async sendUSISetOption(): Promise<void> {
    // Do Nothing
  },
  async usiLaunch(): Promise<number> {
    throw "Web版では利用できない機能です。";
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
    throw "Web版では利用できない機能です。";
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
  log(level: LogLevel, message: string): void {
    switch (level) {
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
  onUSIBestMove(): void {
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
