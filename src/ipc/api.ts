import { USIEngineSetting, USIEngineSettings } from "@/settings/usi";
import { GameSetting, TimeLimitSetting } from "@/settings/game";
import { AppSetting } from "@/settings/app";
import { MenuEvent } from "@/ipc/menu";
import { USIInfoSender } from "./usi";
import { webAPI } from "./web";
import { ResearchSetting } from "@/settings/research";
import { AppState } from "@/store/state";
import { GameResult } from "@/players/player";
import { AnalysisSetting } from "@/settings/analysis";
import { LogLevel } from "./log";
import { CSAGameResult, CSASpecialMove } from "./csa";
import { CSAGameSettingHistory, CSAServerSetting } from "@/settings/csa";

export interface Bridge {
  getRecordPathFromProcArg(): Promise<string>;
  updateMenuState(appState: AppState, bussy: boolean): void;
  showOpenRecordDialog(): Promise<string>;
  openRecord(path: string): Promise<Uint8Array>;
  showSaveRecordDialog(defaultPath: string): Promise<string>;
  saveRecord(path: string, data: Uint8Array): Promise<void>;
  showSelectFileDialog(): Promise<string>;
  loadAppSetting(): Promise<string>;
  saveAppSetting(setting: string): Promise<void>;
  loadResearchSetting(): Promise<string>;
  saveResearchSetting(setting: string): Promise<void>;
  loadAnalysisSetting(): Promise<string>;
  saveAnalysisSetting(setting: string): Promise<void>;
  loadGameSetting(): Promise<string>;
  saveGameSetting(setting: string): Promise<void>;
  loadCSAGameSettingHistory(): Promise<string>;
  saveCSAGameSettingHistory(setting: string): Promise<void>;
  loadUSIEngineSetting(): Promise<string>;
  saveUSIEngineSetting(setting: string): Promise<void>;
  showSelectUSIEngineDialog(): Promise<string>;
  getUSIEngineInfo(path: string): Promise<string>;
  sendUSISetOption(path: string, name: string): Promise<void>;
  usiLaunch(json: string): Promise<number>;
  usiGo(
    sessionID: number,
    usi: string,
    json: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void>;
  usiGoPonder(
    sessionID: number,
    usi: string,
    json: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void>;
  usiPonderHit(sessionID: number): Promise<void>;
  usiGoInfinite(sessionID: number, usi: string): Promise<void>;
  usiStop(sessionID: number): Promise<void>;
  usiGameover(sessionID: number, result: GameResult): Promise<void>;
  usiQuit(sessionID: number): Promise<void>;
  csaLogin(json: string): Promise<number>;
  csaLogout(sessionID: number): Promise<void>;
  csaAgree(sessionID: number, gameID: string): Promise<void>;
  csaMove(sessionID: number, move: string): Promise<void>;
  csaResign(sessionID: number): Promise<void>;
  csaWin(sessionID: number): Promise<void>;
  csaStop(sessionID: number): Promise<void>;
  log(level: LogLevel, message: string): void;
  onSendError(callback: (e: Error) => void): void;
  onMenuEvent(callback: (event: MenuEvent) => void): void;
  onUSIBestMove(
    callback: (
      sessionID: number,
      usi: string,
      sfen: string,
      ponder?: string
    ) => void
  ): void;
  onUSIInfo(
    callback: (
      sessionID: number,
      usi: string,
      sender: USIInfoSender,
      name: string,
      json: string
    ) => void
  ): void;
  onUSIPonderInfo(
    callback: (
      sessionID: number,
      usi: string,
      sender: USIInfoSender,
      name: string,
      json: string
    ) => void
  ): void;
  onCSAGameSummary(
    callback: (sessionID: number, gameSummary: string) => void
  ): void;
  onCSAReject(callback: (sessionID: number) => void): void;
  onCSAStart(callback: (sessionID: number, playerStates: string) => void): void;
  onCSAMove(
    callback: (sessionID: number, mvoe: string, playerStates: string) => void
  ): void;
  onCSAGameResult(
    callback: (
      sessionID: number,
      specialMove: CSASpecialMove,
      gameResult: CSAGameResult
    ) => void
  ): void;
  onCSAClose(callback: (sessionID: number) => void): void;
}

export interface API {
  getRecordPathFromProcArg(): Promise<string>;
  updateMenuState(appState: AppState, bussy: boolean): void;
  showOpenRecordDialog(): Promise<string>;
  openRecord(path: string): Promise<Uint8Array>;
  showSaveRecordDialog(defaultPath: string): Promise<string>;
  saveRecord(path: string, data: Uint8Array): Promise<void>;
  showSelectFileDialog(): Promise<string>;
  loadAppSetting(): Promise<AppSetting>;
  saveAppSetting(setting: AppSetting): Promise<void>;
  loadResearchSetting(): Promise<ResearchSetting>;
  saveResearchSetting(setting: ResearchSetting): Promise<void>;
  loadAnalysisSetting(): Promise<AnalysisSetting>;
  saveAnalysisSetting(setting: AnalysisSetting): Promise<void>;
  loadGameSetting(): Promise<GameSetting>;
  saveGameSetting(setting: GameSetting): Promise<void>;
  loadCSAGameSettingHistory(): Promise<CSAGameSettingHistory>;
  saveCSAGameSettingHistory(setting: CSAGameSettingHistory): Promise<void>;
  loadUSIEngineSetting(): Promise<USIEngineSettings>;
  saveUSIEngineSetting(setting: USIEngineSettings): Promise<void>;
  showSelectUSIEngineDialog(): Promise<string>;
  getUSIEngineInfo(path: string): Promise<USIEngineSetting>;
  sendUSISetOption(path: string, name: string): Promise<void>;
  usiLaunch(setting: USIEngineSetting): Promise<number>;
  usiGo(
    sessionID: number,
    usi: string,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void>;
  usiGoPonder(
    sessionID: number,
    usi: string,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void>;
  usiPonderHit(sessionID: number): Promise<void>;
  usiGoInfinite(sessionID: number, usi: string): Promise<void>;
  usiStop(sessionID: number): Promise<void>;
  usiGameover(sessionID: number, result: GameResult): Promise<void>;
  usiQuit(sessionID: number): Promise<void>;
  csaLogin(setting: CSAServerSetting): Promise<number>;
  csaLogout(sessionID: number): Promise<void>;
  csaAgree(sessionID: number, gameID: string): Promise<void>;
  csaMove(sessionID: number, move: string): Promise<void>;
  csaResign(sessionID: number): Promise<void>;
  csaWin(sessionID: number): Promise<void>;
  csaStop(sessionID: number): Promise<void>;
  log(level: LogLevel, message: string): void;
}

interface ExtendedWindow extends Window {
  electronShogiAPI?: Bridge;
}

function getWindowObject(): ExtendedWindow {
  return window as unknown as ExtendedWindow;
}

export const bridge: Bridge = getWindowObject().electronShogiAPI || webAPI;

const api: API = {
  ...bridge,
  async loadAppSetting(): Promise<AppSetting> {
    return JSON.parse(await bridge.loadAppSetting());
  },
  saveAppSetting(setting: AppSetting): Promise<void> {
    return bridge.saveAppSetting(JSON.stringify(setting));
  },
  async loadResearchSetting(): Promise<ResearchSetting> {
    return JSON.parse(await bridge.loadResearchSetting());
  },
  saveResearchSetting(setting: ResearchSetting): Promise<void> {
    return bridge.saveResearchSetting(JSON.stringify(setting));
  },
  async loadAnalysisSetting(): Promise<AnalysisSetting> {
    return JSON.parse(await bridge.loadAnalysisSetting());
  },
  saveAnalysisSetting(setting: AnalysisSetting): Promise<void> {
    return bridge.saveAnalysisSetting(JSON.stringify(setting));
  },
  async loadGameSetting(): Promise<GameSetting> {
    return JSON.parse(await bridge.loadGameSetting());
  },
  saveGameSetting(setting: GameSetting): Promise<void> {
    return bridge.saveGameSetting(JSON.stringify(setting));
  },
  async loadCSAGameSettingHistory(): Promise<CSAGameSettingHistory> {
    return JSON.parse(await bridge.loadCSAGameSettingHistory());
  },
  saveCSAGameSettingHistory(setting: CSAGameSettingHistory): Promise<void> {
    return bridge.saveCSAGameSettingHistory(JSON.stringify(setting));
  },
  async loadUSIEngineSetting(): Promise<USIEngineSettings> {
    return new USIEngineSettings(await bridge.loadUSIEngineSetting());
  },
  saveUSIEngineSetting(settings: USIEngineSettings): Promise<void> {
    return bridge.saveUSIEngineSetting(settings.json);
  },
  async getUSIEngineInfo(path: string): Promise<USIEngineSetting> {
    return JSON.parse(await bridge.getUSIEngineInfo(path));
  },
  usiLaunch(setting: USIEngineSetting): Promise<number> {
    return bridge.usiLaunch(JSON.stringify(setting));
  },
  usiGo(
    sessionID: number,
    usi: string,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void> {
    return bridge.usiGo(
      sessionID,
      usi,
      JSON.stringify(timeLimit),
      blackTimeMs,
      whiteTimeMs
    );
  },
  usiGoPonder(
    sessionID: number,
    usi: string,
    timeLimit: TimeLimitSetting,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void> {
    return bridge.usiGoPonder(
      sessionID,
      usi,
      JSON.stringify(timeLimit),
      blackTimeMs,
      whiteTimeMs
    );
  },
  csaLogin(setting: CSAServerSetting): Promise<number> {
    return bridge.csaLogin(JSON.stringify(setting));
  },
};

export default api;

export function isNative(): boolean {
  return !!getWindowObject().electronShogiAPI;
}
