import { defaultAppSetting } from "@/settings/app";
import { defaultGameSetting } from "@/settings/game";
import { defaultResearchSetting } from "@/settings/research";
import { USIEngineSettings } from "@/settings/usi";
import { API } from "./renderer";

enum STORAGE_KEY {
  APP_SETTING = "appSetting",
  RESEARCH_SETTING = "researchSetting",
  GAME_SETTING = "gameSetting",
}

// Electron を使わずにシンプルな Web アプリケーションとして実行した場合に使用します。
export const webAPI: API = {
  async getRecordPathFromProcArg(): Promise<string> {
    return "";
  },
  updateMenuState(): void {
    // DO NOTHING
  },
  async showOpenRecordDialog(): Promise<string> {
    throw "Web版では利用できない機能です。";
  },
  async openRecord(): Promise<Buffer> {
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
  async startResearch(): Promise<void> {
    throw "Web版では利用できない機能です。";
  },
  async endResearch(): Promise<void> {
    throw "Web版では利用できない機能です。";
  },
  async startGame(): Promise<void> {
    // Do Nothing
  },
  async endGame(): Promise<void> {
    // Do Nothing
  },
  async updateUSIPosition(): Promise<void> {
    // Do Nothing
  },
  async stopUSI(): Promise<void> {
    // Do Nothing
  },
  async sendUSISetOption(): Promise<void> {
    // Do Nothing
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
};
