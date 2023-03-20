import { BrowserWindow, dialog, ipcMain, shell, WebContents } from "electron";
import { Background, Renderer } from "@/common/ipc/channel";
import path from "path";
import fs from "fs";
import {
  loadAnalysisSetting,
  loadAppSetting,
  loadCSAGameSettingHistory,
  loadGameSetting,
  loadResearchSetting,
  loadUSIEngineSetting,
  saveAnalysisSetting,
  saveAppSetting,
  saveCSAGameSettingHistory,
  saveGameSetting,
  saveResearchSetting,
  saveUSIEngineSetting,
} from "@/background/settings";
import { USIEngineSetting, USIEngineSettings } from "@/common/settings/usi";
import { setupMenu, updateAppState } from "@/background/menu";
import { MenuEvent } from "@/common/control/menu";
import { USIInfoCommand } from "@/common/usi";
import { AppState } from "@/common/control/state";
import {
  gameover as usiGameover,
  getUSIEngineInfo as usiGetUSIEngineInfo,
  go as usiGo,
  goPonder as usiGoPonder,
  goInfinite as usiGoInfinite,
  ponderHit as usiPonderHit,
  quit as usiQuit,
  sendSetOptionCommand as usiSendSetOptionCommand,
  setupPlayer as usiSetupPlayer,
  stop as usiStop,
} from "@/background/usi";
import { GameResult } from "@/common/player";
import { LogLevel } from "@/common/log";
import { getAppLogger } from "./log";
import {
  login as csaLogin,
  logout as csaLogout,
  agree as csaAgree,
  doMove as csaDoMove,
  resign as csaResign,
  win as csaWin,
  stop as csaStop,
} from "./csa";
import {
  CSAGameResult,
  CSAGameSummary,
  CSAPlayerStates,
  CSASpecialMove,
} from "@/common/csa";
import { CSAServerSetting } from "@/common/settings/csa";
import { isEncryptionAvailable } from "./encrypt";
import { validateIPCSender } from "./security";
import { t } from "@/common/i18n";
import { Rect } from "@/common/graphics";
import { exportCaptureJPEG, exportCapturePNG } from "./image";

const isWindows = process.platform === "win32";

let mainWindow: BrowserWindow; // TODO: refactoring
let appState = AppState.NORMAL;

export function setup(win: BrowserWindow): void {
  mainWindow = win;
  setupMenu();
}

export function getAppState(): AppState {
  return appState;
}

export function getWebContents(): WebContents {
  return mainWindow.webContents;
}

ipcMain.handle(Background.GET_RECORD_PATH_FROM_PROC_ARG, (event) => {
  validateIPCSender(event.senderFrame);
  const path = process.argv[process.argv.length - 1];
  if (isValidRecordFilePath(path)) {
    getAppLogger().debug(`record path from proc arg: ${path}`);
    return path;
  }
});

ipcMain.on(
  Background.UPDATE_APP_STATE,
  (_, state: AppState, bussy: boolean) => {
    getAppLogger().debug(
      `change app state: AppState=${state} BussyState=${bussy}`
    );
    appState = state;
    updateAppState(state, bussy);
  }
);

ipcMain.on(Background.OPEN_EXPLORER, (_, target: string) => {
  const stats = fs.statSync(target, { throwIfNoEntry: false });
  if (!stats) {
    sendError(new Error(t.failedToOpenDirectory(target)));
    return;
  }
  if (stats.isDirectory()) {
    shell.openPath(target);
  } else {
    shell.openPath(path.dirname(target));
  }
});

function isValidRecordFilePath(path: string) {
  return (
    path.endsWith(".kif") || path.endsWith(".kifu") || path.endsWith(".csa")
  );
}

ipcMain.handle(
  Background.SHOW_OPEN_RECORD_DIALOG,
  async (event): Promise<string> => {
    validateIPCSender(event.senderFrame);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("Failed to open dialog by unexpected error.");
    }
    const appSetting = loadAppSetting();
    getAppLogger().debug(`show open-record dialog`);
    const results = dialog.showOpenDialogSync(win, {
      defaultPath: appSetting.lastRecordFilePath,
      properties: ["openFile"],
      filters: [{ name: t.recordFile, extensions: ["kif", "kifu", "csa"] }],
    });
    getAppLogger().debug(`open-record dialog result: ${results}`);
    if (!results || results.length !== 1) {
      return "";
    }
    saveAppSetting({
      ...appSetting,
      lastRecordFilePath: results[0],
    });
    return results[0];
  }
);

ipcMain.handle(
  Background.OPEN_RECORD,
  async (event, path: string): Promise<Uint8Array> => {
    validateIPCSender(event.senderFrame);
    if (!isValidRecordFilePath(path)) {
      throw new Error(t.fileExtensionNotSupported);
    }
    getAppLogger().debug(`open record: ${path}`);
    return fs.promises.readFile(path);
  }
);

ipcMain.handle(
  Background.SHOW_SAVE_RECORD_DIALOG,
  async (event, defaultPath: string): Promise<string> => {
    validateIPCSender(event.senderFrame);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("failed to open dialog by unexpected error.");
    }
    const appSetting = loadAppSetting();
    getAppLogger().debug("show save-record dialog");
    const result = dialog.showSaveDialogSync(win, {
      defaultPath: path.resolve(appSetting.lastRecordFilePath, defaultPath),
      properties: ["createDirectory", "showOverwriteConfirmation"],
      filters: [
        { name: "KIF (Shift-JIS)", extensions: ["kif"] },
        { name: "KIF (UTF-8)", extensions: ["kifu"] },
        { name: "CSA", extensions: ["csa"] },
      ],
    });
    getAppLogger().debug(`save-record dialog result: ${result}`);
    if (!result) {
      return "";
    }
    saveAppSetting({
      ...appSetting,
      lastRecordFilePath: result,
    });
    return result;
  }
);

ipcMain.handle(
  Background.SAVE_RECORD,
  async (event, filePath: string, data: Uint8Array): Promise<void> => {
    validateIPCSender(event.senderFrame);
    if (!isValidRecordFilePath(filePath)) {
      throw new Error(t.fileExtensionNotSupported);
    }
    getAppLogger().debug(`save record: ${filePath} (${data.length} bytes)`);
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.promises.writeFile(filePath, data);
  }
);

ipcMain.handle(
  Background.SHOW_SELECT_FILE_DIALOG,
  async (event): Promise<string> => {
    validateIPCSender(event.senderFrame);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("failed to open dialog by unexpected error.");
    }
    const appSetting = loadAppSetting();
    getAppLogger().debug("show select-file dialog");
    const results = dialog.showOpenDialogSync(win, {
      defaultPath: appSetting.lastOtherFilePath,
      properties: ["openFile"],
    });
    getAppLogger().debug(`select-file dialog result: ${results}`);
    if (!results || results.length !== 1) {
      return "";
    }
    saveAppSetting({
      ...appSetting,
      lastOtherFilePath: results[0],
    });
    return results[0];
  }
);

ipcMain.handle(
  Background.SHOW_SELECT_DIRECTORY_DIALOG,
  async (event, defaultPath?: string): Promise<string> => {
    validateIPCSender(event.senderFrame);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("failed to open dialog by unexpected error.");
    }
    getAppLogger().debug("show select-directory dialog");
    const results = dialog.showOpenDialogSync(win, {
      properties: ["createDirectory", "openDirectory"],
      defaultPath,
    });
    getAppLogger().debug(`select-directory dialog result: ${results}`);
    return results && results.length === 1 ? results[0] : "";
  }
);

ipcMain.handle(
  Background.EXPORT_CAPTURE_AS_PNG,
  async (event, json: string): Promise<void> => {
    validateIPCSender(event.senderFrame);
    await exportCapturePNG(new Rect(json));
  }
);

ipcMain.handle(
  Background.EXPORT_CAPTURE_AS_JPEG,
  async (event, json: string): Promise<void> => {
    validateIPCSender(event.senderFrame);
    await exportCaptureJPEG(new Rect(json));
  }
);

ipcMain.handle(Background.LOAD_APP_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load app setting");
  return JSON.stringify(loadAppSetting());
});

ipcMain.handle(Background.SAVE_APP_SETTING, (event, json: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save app setting");
  saveAppSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_RESEARCH_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load research setting");
  return JSON.stringify(loadResearchSetting());
});

ipcMain.handle(
  Background.SAVE_RESEARCH_SETTING,
  (event, json: string): void => {
    validateIPCSender(event.senderFrame);
    getAppLogger().debug("save research setting");
    saveResearchSetting(JSON.parse(json));
  }
);

ipcMain.handle(Background.LOAD_ANALYSIS_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load analysis setting");
  return JSON.stringify(loadAnalysisSetting());
});

ipcMain.handle(
  Background.SAVE_ANALYSIS_SETTING,
  (event, json: string): void => {
    validateIPCSender(event.senderFrame);
    getAppLogger().debug("save analysis setting");
    saveAnalysisSetting(JSON.parse(json));
  }
);

ipcMain.handle(Background.LOAD_GAME_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load game setting");
  return JSON.stringify(loadGameSetting());
});

ipcMain.handle(Background.SAVE_GAME_SETTING, (event, json: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save game setting");
  saveGameSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_CSA_GAME_SETTING_HISTORY, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load CSA game setting history");
  return JSON.stringify(loadCSAGameSettingHistory());
});

ipcMain.handle(
  Background.SAVE_CSA_GAME_SETTING_HISTORY,
  (event, json: string): void => {
    validateIPCSender(event.senderFrame);
    getAppLogger().debug("save CSA game setting history");
    saveCSAGameSettingHistory(JSON.parse(json));
  }
);

ipcMain.handle(Background.LOAD_USI_ENGINE_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load USI engine setting");
  return loadUSIEngineSetting().json;
});

ipcMain.handle(
  Background.SAVE_USI_ENGINE_SETTING,
  (event, json: string): void => {
    validateIPCSender(event.senderFrame);
    getAppLogger().debug("save USI engine setting");
    saveUSIEngineSetting(new USIEngineSettings(json));
  }
);

ipcMain.handle(Background.SHOW_SELECT_USI_ENGINE_DIALOG, (event): string => {
  validateIPCSender(event.senderFrame);
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    throw new Error("failed to open dialog by unexpected error.");
  }
  const appSetting = loadAppSetting();
  getAppLogger().debug("show select-USI-engine dialog");
  const results = dialog.showOpenDialogSync(win, {
    defaultPath: appSetting.lastUSIEngineFilePath,
    properties: ["openFile", "noResolveAliases"],
    filters: isWindows
      ? [{ name: t.executableFile, extensions: ["exe", "cmd", "bat"] }]
      : undefined,
  });
  if (!results || results.length !== 1) {
    return "";
  }
  saveAppSetting({
    ...appSetting,
    lastUSIEngineFilePath: results[0],
  });
  return results[0];
});

ipcMain.handle(
  Background.GET_USI_ENGINE_INFO,
  async (event, path: string, timeoutSeconds: number): Promise<string> => {
    validateIPCSender(event.senderFrame);
    return JSON.stringify(await usiGetUSIEngineInfo(path, timeoutSeconds));
  }
);

ipcMain.handle(
  Background.SEND_USI_SET_OPTION,
  async (event, path: string, name: string, timeoutSeconds: number) => {
    validateIPCSender(event.senderFrame);
    await usiSendSetOptionCommand(path, name, timeoutSeconds);
  }
);

ipcMain.handle(
  Background.LAUNCH_USI,
  async (event, json: string, timeoutSeconds: number) => {
    validateIPCSender(event.senderFrame);
    const setting = JSON.parse(json) as USIEngineSetting;
    return await usiSetupPlayer(setting, timeoutSeconds);
  }
);

ipcMain.handle(
  Background.USI_GO,
  (
    event,
    sessionID: number,
    usi: string,
    json: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ) => {
    validateIPCSender(event.senderFrame);
    const timeLimit = JSON.parse(json);
    usiGo(sessionID, usi, timeLimit, blackTimeMs, whiteTimeMs);
  }
);

ipcMain.handle(
  Background.USI_GO_PONDER,
  (
    event,
    sessionID: number,
    usi: string,
    json: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ) => {
    validateIPCSender(event.senderFrame);
    const timeLimit = JSON.parse(json);
    usiGoPonder(sessionID, usi, timeLimit, blackTimeMs, whiteTimeMs);
  }
);

ipcMain.handle(Background.USI_GO_PONDER_HIT, (event, sessionID: number) => {
  validateIPCSender(event.senderFrame);
  usiPonderHit(sessionID);
});

ipcMain.handle(
  Background.USI_GO_INFINITE,
  (event, sessionID: number, usi: string) => {
    validateIPCSender(event.senderFrame);
    usiGoInfinite(sessionID, usi);
  }
);

ipcMain.handle(Background.USI_STOP, (event, sessionID: number) => {
  validateIPCSender(event.senderFrame);
  usiStop(sessionID);
});

ipcMain.handle(
  Background.USI_GAMEOVER,
  (event, sessionID: number, result: GameResult) => {
    validateIPCSender(event.senderFrame);
    usiGameover(sessionID, result);
  }
);

ipcMain.handle(Background.USI_QUIT, (event, sessionID: number) => {
  validateIPCSender(event.senderFrame);
  usiQuit(sessionID);
});

ipcMain.handle(Background.CSA_LOGIN, (event, json: string): number => {
  validateIPCSender(event.senderFrame);
  const setting: CSAServerSetting = JSON.parse(json);
  return csaLogin(setting);
});

ipcMain.handle(Background.CSA_LOGOUT, (event, sessionID: number): void => {
  validateIPCSender(event.senderFrame);
  csaLogout(sessionID);
});

ipcMain.handle(
  Background.CSA_AGREE,
  (event, sessionID: number, gameID: string): void => {
    validateIPCSender(event.senderFrame);
    csaAgree(sessionID, gameID);
  }
);

ipcMain.handle(
  Background.CSA_MOVE,
  (
    event,
    sessionID: number,
    move: string,
    score?: number,
    pv?: string
  ): void => {
    validateIPCSender(event.senderFrame);
    csaDoMove(sessionID, move, score, pv);
  }
);

ipcMain.handle(Background.CSA_RESIGN, (event, sessionID: number): void => {
  validateIPCSender(event.senderFrame);
  csaResign(sessionID);
});

ipcMain.handle(Background.CSA_WIN, (event, sessionID: number): void => {
  validateIPCSender(event.senderFrame);
  csaWin(sessionID);
});

ipcMain.handle(Background.CSA_STOP, (event, sessionID: number): void => {
  validateIPCSender(event.senderFrame);
  csaStop(sessionID);
});

ipcMain.handle(Background.IS_ENCRYPTION_AVAILABLE, (event): boolean => {
  validateIPCSender(event.senderFrame);
  return isEncryptionAvailable();
});

ipcMain.handle(Background.LOG, (event, level: LogLevel, message: string) => {
  validateIPCSender(event.senderFrame);
  switch (level) {
    case LogLevel.DEBUG:
      getAppLogger().debug("%s", message);
      break;
    case LogLevel.INFO:
      getAppLogger().info("%s", message);
      break;
    case LogLevel.WARN:
      getAppLogger().warn("%s", message);
      break;
    case LogLevel.ERROR:
      getAppLogger().error("%s", message);
      break;
  }
});

export function sendError(e: Error): void {
  mainWindow.webContents.send(Renderer.SEND_ERROR, e);
}

export function onMenuEvent(event: MenuEvent): void {
  mainWindow.webContents.send(Renderer.MENU_EVENT, event);
}

export function onUSIBestMove(
  sessionID: number,
  usi: string,
  sfen: string,
  ponder?: string
): void {
  mainWindow.webContents.send(
    Renderer.USI_BEST_MOVE,
    sessionID,
    usi,
    sfen,
    ponder
  );
}

export function onUSIInfo(
  sessionID: number,
  usi: string,
  name: string,
  info: USIInfoCommand
): void {
  mainWindow.webContents.send(
    Renderer.USI_INFO,
    sessionID,
    usi,
    name,
    JSON.stringify(info)
  );
}

export function onUSIPonderInfo(
  sessionID: number,
  usi: string,
  name: string,
  info: USIInfoCommand
): void {
  mainWindow.webContents.send(
    Renderer.USI_PONDER_INFO,
    sessionID,
    usi,
    name,
    JSON.stringify(info)
  );
}

export function onCSAGameSummary(
  sessionID: number,
  gameSummary: CSAGameSummary
): void {
  mainWindow.webContents.send(
    Renderer.CSA_GAME_SUMMARY,
    sessionID,
    JSON.stringify(gameSummary)
  );
}

export function onCSAReject(sessionID: number): void {
  mainWindow.webContents.send(Renderer.CSA_REJECT, sessionID);
}

export function onCSAStart(
  sessionID: number,
  playerStates: CSAPlayerStates
): void {
  mainWindow.webContents.send(
    Renderer.CSA_START,
    sessionID,
    JSON.stringify(playerStates)
  );
}

export function onCSAMove(
  sessionID: number,
  move: string,
  playerStates: CSAPlayerStates
): void {
  mainWindow.webContents.send(
    Renderer.CSA_MOVE,
    sessionID,
    move,
    JSON.stringify(playerStates)
  );
}

export function onCSAGameResult(
  sessionID: number,
  specialMove: CSASpecialMove,
  gameResult: CSAGameResult
): void {
  mainWindow.webContents.send(
    Renderer.CSA_GAME_RESULT,
    sessionID,
    specialMove,
    gameResult
  );
}

export function onCSAClose(sessionID: number): void {
  mainWindow.webContents.send(Renderer.CSA_CLOSE, sessionID);
}
