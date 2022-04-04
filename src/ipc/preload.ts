import { MenuEvent } from "@/menu/event";
import { Color, SpecialMove } from "@/shogi";
import { Mode } from "@/store/mode";
import { USIInfoSender } from "@/usi/info";
import { contextBridge, ipcRenderer } from "electron";
import { Background, Renderer } from "./channel";
import { API } from "./renderer";

const api: API = {
  // NOTICE:
  //   Do NOT publish any libraries or any references to scure objects.
  //   Must create wrapper function and publish only minimum required references.
  //   ライブラリやセキュアなオブジェクトを直接公開しないでください。
  //   必ず関数でラップして、必要最小限の参照だけをレンダラーに公開してください。
  //   See https://www.electronjs.org/docs/latest/tutorial/context-isolation#security-considerations
  async getRecordPathFromProcArg(): Promise<string> {
    return await ipcRenderer.invoke(Background.GET_RECORD_PATH_FROM_PROC_ARG);
  },
  updateMenuState(mode: Mode, bussy: boolean): void {
    ipcRenderer.send(Background.UPDATE_MENU_STATE, mode, bussy);
  },
  async showOpenRecordDialog(): Promise<string> {
    return await ipcRenderer.invoke(Background.SHOW_OPEN_RECORD_DIALOG);
  },
  async openRecord(path: string): Promise<Buffer> {
    return await ipcRenderer.invoke(Background.OPEN_RECORD, path);
  },
  async showSaveRecordDialog(defaultPath: string): Promise<string> {
    return await ipcRenderer.invoke(
      Background.SHOW_SAVE_RECORD_DIALOG,
      defaultPath
    );
  },
  async saveRecord(path: string, data: Buffer): Promise<void> {
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
  async startResearch(json: string, sessionID: number): Promise<void> {
    await ipcRenderer.invoke(Background.START_RESEARCH, json, sessionID);
  },
  async endResearch(): Promise<void> {
    await ipcRenderer.invoke(Background.END_RESEARCH);
  },
  async startGame(json: string, sessionID: number): Promise<void> {
    await ipcRenderer.invoke(Background.START_GAME, json, sessionID);
  },
  async endGame(usi: string, specialMove?: SpecialMove): Promise<void> {
    await ipcRenderer.invoke(Background.END_GAME, usi, specialMove);
  },
  async updateUSIPosition(
    usi: string,
    gameSetting: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void> {
    await ipcRenderer.invoke(
      Background.UPDATE_USI_POSITION,
      usi,
      gameSetting,
      blackTimeMs,
      whiteTimeMs
    );
  },
  async stopUSI(color: Color): Promise<void> {
    await ipcRenderer.invoke(Background.STOP_USI, color);
  },
  async sendUSISetOption(path: string, name: string): Promise<void> {
    await ipcRenderer.invoke(Background.SEND_USI_SET_OPTION, path, name);
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
    callback: (
      sessionID: number,
      usi: string,
      color: Color,
      sfen: string
    ) => void
  ): void {
    ipcRenderer.on(Renderer.USI_BEST_MOVE, (_, sessionID, usi, color, sfen) => {
      callback(sessionID, usi, color, sfen);
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
