import { MenuEvent } from "@/ipc/menu";
import { AppState } from "@/store/state";
import { GameResult } from "@/players/player";
import { USIInfoSender } from "@/store/usi";
import { contextBridge, ipcRenderer } from "electron";
import { Background, Renderer } from "./channel";
import { Bridge } from "./api";
import { LogLevel } from "./log";

const api: Bridge = {
  // NOTICE:
  //   Do NOT publish any libraries or any references to scure objects.
  //   Must create wrapper function and publish only minimum required references.
  //   ライブラリやセキュアなオブジェクトを直接公開しないでください。
  //   必ず関数でラップして、必要最小限の参照だけをレンダラーに公開してください。
  //   See https://www.electronjs.org/docs/latest/tutorial/context-isolation#security-considerations
  async getRecordPathFromProcArg(): Promise<string> {
    return await ipcRenderer.invoke(Background.GET_RECORD_PATH_FROM_PROC_ARG);
  },
  updateMenuState(appState: AppState, bussy: boolean): void {
    ipcRenderer.send(Background.UPDATE_MENU_STATE, appState, bussy);
  },
  async showOpenRecordDialog(): Promise<string> {
    return await ipcRenderer.invoke(Background.SHOW_OPEN_RECORD_DIALOG);
  },
  async openRecord(path: string): Promise<Uint8Array> {
    return await ipcRenderer.invoke(Background.OPEN_RECORD, path);
  },
  async showSaveRecordDialog(defaultPath: string): Promise<string> {
    return await ipcRenderer.invoke(
      Background.SHOW_SAVE_RECORD_DIALOG,
      defaultPath
    );
  },
  async saveRecord(path: string, data: Uint8Array): Promise<void> {
    await ipcRenderer.invoke(Background.SAVE_RECORD, path, data);
  },
  async showSelectFileDialog(): Promise<string> {
    return await ipcRenderer.invoke(Background.SHOW_SELECT_FILE_DIALOG);
  },
  async loadAppSetting(): Promise<string> {
    return await ipcRenderer.invoke(Background.LOAD_APP_SETTING);
  },
  async saveAppSetting(json: string): Promise<void> {
    await ipcRenderer.invoke(Background.SAVE_APP_SETTING, json);
  },
  async loadResearchSetting(): Promise<string> {
    return await ipcRenderer.invoke(Background.LOAD_RESEARCH_SETTING);
  },
  async saveResearchSetting(json: string): Promise<void> {
    await ipcRenderer.invoke(Background.SAVE_RESEARCH_SETTING, json);
  },
  async loadAnalysisSetting(): Promise<string> {
    return await ipcRenderer.invoke(Background.LOAD_ANALYSIS_SETTING);
  },
  async saveAnalysisSetting(json: string): Promise<void> {
    await ipcRenderer.invoke(Background.SAVE_ANALYSIS_SETTING, json);
  },
  async loadGameSetting(): Promise<string> {
    return await ipcRenderer.invoke(Background.LOAD_GAME_SETTING);
  },
  async saveGameSetting(json: string): Promise<void> {
    await ipcRenderer.invoke(Background.SAVE_GAME_SETTING, json);
  },
  async loadUSIEngineSetting(): Promise<string> {
    return await ipcRenderer.invoke(Background.LOAD_USI_ENGINE_SETTING);
  },
  async saveUSIEngineSetting(json: string): Promise<void> {
    await ipcRenderer.invoke(Background.SAVE_USI_ENGINE_SETTING, json);
  },
  async showSelectUSIEngineDialog(): Promise<string> {
    return await ipcRenderer.invoke(Background.SHOW_SELECT_USI_ENGINE_DIALOG);
  },
  async getUSIEngineInfo(path: string): Promise<string> {
    return await ipcRenderer.invoke(Background.GET_USI_ENGINE_INFO, path);
  },
  async sendUSISetOption(path: string, name: string): Promise<void> {
    await ipcRenderer.invoke(Background.SEND_USI_SET_OPTION, path, name);
  },
  async usiLaunch(json: string): Promise<number> {
    return await ipcRenderer.invoke(Background.LAUNCH_USI, json);
  },
  async usiGo(
    sessionID: number,
    usi: string,
    json: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void> {
    await ipcRenderer.invoke(
      Background.USI_GO,
      sessionID,
      usi,
      json,
      blackTimeMs,
      whiteTimeMs
    );
  },
  async usiGoInfinite(sessionID: number, usi: string): Promise<void> {
    await ipcRenderer.invoke(Background.USI_GO_INFINITE, sessionID, usi);
  },
  async usiStop(sessionID: number): Promise<void> {
    await ipcRenderer.invoke(Background.USI_STOP, sessionID);
  },
  async usiGameover(sessionID: number, result: GameResult): Promise<void> {
    await ipcRenderer.invoke(Background.USI_GAMEOVER, sessionID, result);
  },
  async usiQuit(sessionID: number): Promise<void> {
    await ipcRenderer.invoke(Background.USI_QUIT, sessionID);
  },
  log(level: LogLevel, message: string): void {
    ipcRenderer.invoke(Background.LOG, level, message);
  },
  onSendError(callback: (e: Error) => void): void {
    ipcRenderer.on(Renderer.SEND_ERROR, (_, e) => {
      callback(e);
    });
  },
  onMenuEvent(callback: (event: MenuEvent) => void): void {
    ipcRenderer.on(Renderer.MENU_EVENT, (_, event) => callback(event));
  },
  onUSIBestMove(
    callback: (sessionID: number, usi: string, sfen: string) => void
  ): void {
    ipcRenderer.on(Renderer.USI_BEST_MOVE, (_, sessionID, usi, sfen) => {
      callback(sessionID, usi, sfen);
    });
  },
  onUSIInfo(
    callback: (
      sessionID: number,
      usi: string,
      sender: USIInfoSender,
      name: string,
      json: string
    ) => void
  ): void {
    ipcRenderer.on(
      Renderer.USI_INFO,
      (_, sessionID, usi, sender, name, json) => {
        callback(sessionID, usi, sender, name, json);
      }
    );
  },
};

contextBridge.exposeInMainWorld("electronShogiAPI", api);
