import { BrowserWindow, dialog, FileFilter, ipcMain, shell, WebContents } from "electron";
import { Background, Renderer } from "@/common/ipc/channel";
import path from "path";
import fs from "fs";
import url from "url";
import {
  loadAnalysisSetting,
  loadAppSetting,
  loadBatchConversionSetting,
  loadCSAGameSettingHistory,
  loadGameSetting,
  loadMateSearchSetting,
  loadResearchSetting,
  loadUSIEngineSetting,
  saveAnalysisSetting,
  saveAppSetting,
  saveBatchConversionSetting,
  saveCSAGameSettingHistory,
  saveGameSetting,
  saveMateSearchSetting,
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
  goMate as usiGoMate,
  ponderHit as usiPonderHit,
  quit as usiQuit,
  sendSetOptionCommand as usiSendSetOptionCommand,
  setupPlayer as usiSetupPlayer,
  ready as usiReady,
  stop as usiStop,
} from "@/background/usi";
import { GameResult } from "@/common/player";
import { LogLevel, LogType } from "@/common/log";
import { getAppLogger, openLogFile } from "./log";
import {
  login as csaLogin,
  logout as csaLogout,
  agree as csaAgree,
  doMove as csaDoMove,
  resign as csaResign,
  win as csaWin,
  stop as csaStop,
} from "./csa";
import { CSAGameResult, CSAGameSummary, CSAPlayerStates, CSASpecialMove } from "@/common/csa";
import { CSAServerSetting } from "@/common/settings/csa";
import { isEncryptionAvailable } from "./encrypt";
import { validateIPCSender } from "./security";
import { t } from "@/common/i18n";
import { Rect } from "@/common/graphics";
import { exportCaptureJPEG, exportCapturePNG } from "./image/capture";
import { cropPieceImage } from "./image/cropper";
import { getRelativePath, resolvePath } from "./path";
import { fileURLToPath } from "./helpers/url";
import { AppSettingUpdate } from "@/common/settings/app";
import { getCroppedPieceImageBaseURL } from "@/background/image/cropper";
import { convertRecordFiles } from "./conversion";
import { BatchConversionSetting } from "@/common/settings/conversion";
import { addHistory, clearHistory, getHistory, loadBackup, saveBackup } from "./history";
import { getAppPath } from "./environment";

const isWindows = process.platform === "win32";

let initialFilePath = "";
let mainWindow: BrowserWindow; // TODO: refactoring
let appState = AppState.NORMAL;
let closable = false;

export function setInitialFilePath(path: string): void {
  initialFilePath = path;
}

export function setup(win: BrowserWindow): void {
  mainWindow = win;
  setupMenu();
}

export function getAppState(): AppState {
  return appState;
}

export function isClosable(): boolean {
  return closable;
}

export function getWebContents(): WebContents {
  return mainWindow.webContents;
}

ipcMain.handle(Background.GET_RECORD_PATH_FROM_PROC_ARG, (event) => {
  validateIPCSender(event.senderFrame);
  if (isValidRecordFilePath(initialFilePath)) {
    getAppLogger().debug(`record path from open-file event: ${initialFilePath}`);
    return initialFilePath;
  }
  const path = process.argv[process.argv.length - 1];
  if (isValidRecordFilePath(path)) {
    getAppLogger().debug(`record path from proc arg: ${path}`);
    return path;
  }
});

ipcMain.on(Background.UPDATE_APP_STATE, (_, state: AppState, bussy: boolean) => {
  getAppLogger().debug(`change app state: AppState=${state} BussyState=${bussy}`);
  appState = state;
  updateAppState(state, bussy);
});

ipcMain.on(Background.OPEN_EXPLORER, (_, targetPath: string) => {
  const fullPath = resolvePath(targetPath);
  const stats = fs.statSync(fullPath, { throwIfNoEntry: false });
  if (!stats) {
    sendError(new Error(t.failedToOpenDirectory(targetPath)));
    return;
  }
  if (stats.isDirectory()) {
    shell.openPath(fullPath);
  } else {
    shell.openPath(path.dirname(fullPath));
  }
});

function isValidRecordFilePath(path: string) {
  const lowerCasePath = path.toLowerCase();
  return (
    lowerCasePath.endsWith(".kif") ||
    lowerCasePath.endsWith(".kifu") ||
    lowerCasePath.endsWith(".ki2") ||
    lowerCasePath.endsWith(".ki2u") ||
    lowerCasePath.endsWith(".csa") ||
    lowerCasePath.endsWith(".jkf")
  );
}

ipcMain.handle(Background.SHOW_OPEN_RECORD_DIALOG, async (event): Promise<string> => {
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
    filters: [
      {
        name: t.recordFile,
        extensions: ["kif", "kifu", "ki2", "ki2u", "csa", "jkf"],
      },
    ],
  });
  getAppLogger().debug(`open-record dialog result: ${results}`);
  if (!results || results.length !== 1) {
    return "";
  }
  onUpdateAppSetting({
    lastRecordFilePath: results[0],
  });
  return results[0];
});

ipcMain.handle(Background.OPEN_RECORD, async (event, path: string): Promise<Uint8Array> => {
  validateIPCSender(event.senderFrame);
  if (!isValidRecordFilePath(path)) {
    throw new Error(t.fileExtensionNotSupported);
  }
  getAppLogger().debug(`open record: ${path}`);
  return fs.promises.readFile(path);
});

// NOTE: This function mutates filters.
function showSaveDialog(defaultPath: string, filters: FileFilter[], buttonLabel?: string): string {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    throw new Error("failed to open dialog by unexpected error.");
  }
  filters.sort((lhs, rhs) => {
    return defaultPath.endsWith("." + lhs.extensions[0])
      ? -1
      : defaultPath.endsWith("." + rhs.extensions[0])
      ? 1
      : 0;
  });
  getAppLogger().debug("show save-record dialog");
  const result = dialog.showSaveDialogSync(win, {
    defaultPath: defaultPath,
    properties: ["createDirectory", "showOverwriteConfirmation"],
    filters,
    buttonLabel,
  });
  getAppLogger().debug(`save-record dialog result: ${result}`);
  return result || "";
}

ipcMain.handle(
  Background.SHOW_SAVE_RECORD_DIALOG,
  async (event, defaultPath: string): Promise<string> => {
    validateIPCSender(event.senderFrame);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("failed to open dialog by unexpected error.");
    }
    const appSetting = loadAppSetting();
    const filters = [
      { name: "KIF (Shift_JIS)", extensions: ["kif"] },
      { name: "KIF (UTF-8)", extensions: ["kifu"] },
      { name: "KI2 (Shift_JIS)", extensions: ["ki2"] },
      { name: "KI2 (UTF-8)", extensions: ["ki2u"] },
      { name: "CSA", extensions: ["csa"] },
      { name: "JSON Kifu Format", extensions: ["jkf"] },
    ];
    const result = showSaveDialog(
      path.resolve(path.dirname(appSetting.lastRecordFilePath), defaultPath),
      filters,
    );
    if (result) {
      onUpdateAppSetting({ lastRecordFilePath: result });
    }
    return result;
  },
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
  },
);

ipcMain.handle(Background.SHOW_SELECT_FILE_DIALOG, async (event): Promise<string> => {
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
  onUpdateAppSetting({
    lastOtherFilePath: results[0],
  });
  return results[0];
});

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
      defaultPath,
      properties: ["createDirectory", "openDirectory"],
    });
    getAppLogger().debug(`select-directory dialog result: ${results}`);
    return results && results.length === 1 ? results[0] : "";
  },
);

ipcMain.handle(
  Background.SHOW_SELECT_IMAGE_DIALOG,
  async (event, defaultURL?: string): Promise<string> => {
    validateIPCSender(event.senderFrame);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("failed to open dialog by unexpected error.");
    }
    getAppLogger().debug("show select-image dialog");
    const results = dialog.showOpenDialogSync(win, {
      defaultPath: defaultURL && fileURLToPath(defaultURL, getAppPath("pictures")),
      properties: ["openFile"],
      filters: [{ name: t.imageFile, extensions: ["png", "jpg", "jpeg"] }],
    });
    getAppLogger().debug(`select-image dialog result: ${results}`);
    return results && results.length === 1 ? url.pathToFileURL(results[0]).toString() : "";
  },
);

ipcMain.handle(
  Background.SHOW_SAVE_MERGED_RECORD_DIALOG,
  async (event, defaultPath: string): Promise<string> => {
    validateIPCSender(event.senderFrame);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("failed to open dialog by unexpected error.");
    }
    const filters = [{ name: "SFEN", extensions: ["sfen"] }];
    return showSaveDialog(path.resolve(defaultPath), filters, "OK");
  },
);

ipcMain.handle(
  Background.GET_PIECE_IMAGE_BASE_URL,
  async (event, fileURL: string): Promise<string> => {
    validateIPCSender(event.senderFrame);
    return getCroppedPieceImageBaseURL(fileURL);
  },
);

ipcMain.handle(Background.CROP_PIECE_IMAGE, async (event, srcURL: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  await cropPieceImage(srcURL);
});

ipcMain.handle(Background.EXPORT_CAPTURE_AS_PNG, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  await exportCapturePNG(new Rect(json));
});

ipcMain.handle(Background.EXPORT_CAPTURE_AS_JPEG, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  await exportCaptureJPEG(new Rect(json));
});

ipcMain.handle(Background.CONVERT_RECORD_FILES, (event, json: string): string => {
  validateIPCSender(event.senderFrame);
  const setting = JSON.parse(json) as BatchConversionSetting;
  return JSON.stringify(convertRecordFiles(setting));
});

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

ipcMain.handle(Background.LOAD_BATCH_CONVERSION_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load batch conversion setting");
  return JSON.stringify(loadBatchConversionSetting());
});

ipcMain.handle(Background.SAVE_BATCH_CONVERSION_SETTING, (event, json: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save batch conversion setting");
  saveBatchConversionSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_RESEARCH_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load research setting");
  return JSON.stringify(loadResearchSetting());
});

ipcMain.handle(Background.SAVE_RESEARCH_SETTING, (event, json: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save research setting");
  saveResearchSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_ANALYSIS_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load analysis setting");
  return JSON.stringify(loadAnalysisSetting());
});

ipcMain.handle(Background.SAVE_ANALYSIS_SETTING, (event, json: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save analysis setting");
  saveAnalysisSetting(JSON.parse(json));
});

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

ipcMain.handle(Background.SAVE_CSA_GAME_SETTING_HISTORY, (event, json: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save CSA game setting history");
  saveCSAGameSettingHistory(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_MATE_SEARCH_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load mate search setting");
  return JSON.stringify(loadMateSearchSetting());
});

ipcMain.handle(Background.SAVE_MATE_SEARCH_SETTING, (event, json: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save mate search setting");
  saveMateSearchSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_RECORD_FILE_HISTORY, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  return JSON.stringify(await getHistory());
});

ipcMain.on(Background.ADD_RECORD_FILE_HISTORY, (event, path: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("add record file history: %s", path);
  addHistory(path);
});

ipcMain.handle(Background.CLEAR_RECORD_FILE_HISTORY, async (event): Promise<void> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("clear record file history");
  clearHistory();
});

ipcMain.handle(Background.SAVE_RECORD_FILE_BACKUP, async (event, kif: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save record file backup");
  await saveBackup(kif);
});

ipcMain.handle(Background.LOAD_RECORD_FILE_BACKUP, async (event, name: string): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load record file backup: %s", name);
  return await loadBackup(name);
});

ipcMain.handle(Background.LOAD_USI_ENGINE_SETTING, (event): string => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load USI engine setting");
  return loadUSIEngineSetting().json;
});

ipcMain.handle(Background.SAVE_USI_ENGINE_SETTING, (event, json: string): void => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save USI engine setting");
  saveUSIEngineSetting(new USIEngineSettings(json));
});

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
  const enginePath = getRelativePath(results[0]);
  onUpdateAppSetting({
    lastUSIEngineFilePath: enginePath,
  });
  return enginePath;
});

ipcMain.handle(
  Background.GET_USI_ENGINE_INFO,
  async (event, path: string, timeoutSeconds: number): Promise<string> => {
    validateIPCSender(event.senderFrame);
    return JSON.stringify(await usiGetUSIEngineInfo(path, timeoutSeconds));
  },
);

ipcMain.handle(
  Background.SEND_USI_SET_OPTION,
  async (event, path: string, name: string, timeoutSeconds: number) => {
    validateIPCSender(event.senderFrame);
    await usiSendSetOptionCommand(path, name, timeoutSeconds);
  },
);

ipcMain.handle(Background.LAUNCH_USI, async (event, json: string, timeoutSeconds: number) => {
  validateIPCSender(event.senderFrame);
  const setting = JSON.parse(json) as USIEngineSetting;
  return await usiSetupPlayer(setting, timeoutSeconds);
});

ipcMain.handle(Background.USI_READY, async (event, sessionID: number) => {
  validateIPCSender(event.senderFrame);
  return await usiReady(sessionID);
});

ipcMain.handle(
  Background.USI_GO,
  (
    event,
    sessionID: number,
    usi: string,
    json: string,
    blackTimeMs: number,
    whiteTimeMs: number,
  ) => {
    validateIPCSender(event.senderFrame);
    const timeLimit = JSON.parse(json);
    usiGo(sessionID, usi, timeLimit, blackTimeMs, whiteTimeMs);
  },
);

ipcMain.handle(
  Background.USI_GO_PONDER,
  (
    event,
    sessionID: number,
    usi: string,
    json: string,
    blackTimeMs: number,
    whiteTimeMs: number,
  ) => {
    validateIPCSender(event.senderFrame);
    const timeLimit = JSON.parse(json);
    usiGoPonder(sessionID, usi, timeLimit, blackTimeMs, whiteTimeMs);
  },
);

ipcMain.handle(Background.USI_GO_PONDER_HIT, (event, sessionID: number) => {
  validateIPCSender(event.senderFrame);
  usiPonderHit(sessionID);
});

ipcMain.handle(Background.USI_GO_INFINITE, (event, sessionID: number, usi: string) => {
  validateIPCSender(event.senderFrame);
  usiGoInfinite(sessionID, usi);
});

ipcMain.handle(Background.USI_GO_MATE, (event, sessionID: number, usi: string) => {
  validateIPCSender(event.senderFrame);
  usiGoMate(sessionID, usi);
});

ipcMain.handle(Background.USI_STOP, (event, sessionID: number) => {
  validateIPCSender(event.senderFrame);
  usiStop(sessionID);
});

ipcMain.handle(Background.USI_GAMEOVER, (event, sessionID: number, result: GameResult) => {
  validateIPCSender(event.senderFrame);
  usiGameover(sessionID, result);
});

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

ipcMain.handle(Background.CSA_AGREE, (event, sessionID: number, gameID: string): void => {
  validateIPCSender(event.senderFrame);
  csaAgree(sessionID, gameID);
});

ipcMain.handle(
  Background.CSA_MOVE,
  (event, sessionID: number, move: string, score?: number, pv?: string): void => {
    validateIPCSender(event.senderFrame);
    csaDoMove(sessionID, move, score, pv);
  },
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

ipcMain.handle(Background.OPEN_LOG_FILE, (event, logType: LogType) => {
  validateIPCSender(event.senderFrame);
  openLogFile(logType);
});

ipcMain.on(Background.LOG, (event, level: LogLevel, message: string) => {
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

ipcMain.on(Background.ON_CLOSABLE, (event) => {
  validateIPCSender(event.senderFrame);
  closable = true;
  mainWindow.close();
});

export function onClose(): void {
  mainWindow.webContents.send(Renderer.CLOSE);
}

export function sendError(e: Error): void {
  mainWindow.webContents.send(Renderer.SEND_ERROR, e);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function onMenuEvent(event: MenuEvent, ...args: any[]): void {
  mainWindow.webContents.send(Renderer.MENU_EVENT, event, ...args);
}

export function onUpdateAppSetting(setting: AppSettingUpdate): void {
  mainWindow.webContents.send(Renderer.UPDATE_APP_SETTING, JSON.stringify(setting));
}

export function openRecord(path: string): void {
  if (isValidRecordFilePath(path)) {
    mainWindow.webContents.send(Renderer.OPEN_RECORD, path);
  }
}

export function onUSIBestMove(
  sessionID: number,
  usi: string,
  usiMove: string,
  ponder?: string,
): void {
  mainWindow.webContents.send(Renderer.USI_BEST_MOVE, sessionID, usi, usiMove, ponder);
}

export function onUSICheckmate(sessionID: number, usi: string, usiMoves: string[]): void {
  mainWindow.webContents.send(Renderer.USI_CHECKMATE, sessionID, usi, usiMoves);
}

export function onUSICheckmateNotImplemented(sessionID: number): void {
  mainWindow.webContents.send(Renderer.USI_CHECKMATE_NOT_IMPLEMENTED, sessionID);
}

export function onUSICheckmateTimeout(sessionID: number, usi: string): void {
  mainWindow.webContents.send(Renderer.USI_CHECKMATE_TIMEOUT, sessionID, usi);
}

export function onUSINoMate(sessionID: number, usi: string): void {
  mainWindow.webContents.send(Renderer.USI_NO_MATE, sessionID, usi);
}

export function onUSIInfo(sessionID: number, usi: string, info: USIInfoCommand): void {
  mainWindow.webContents.send(Renderer.USI_INFO, sessionID, usi, JSON.stringify(info));
}

export function onUSIPonderInfo(sessionID: number, usi: string, info: USIInfoCommand): void {
  mainWindow.webContents.send(Renderer.USI_PONDER_INFO, sessionID, usi, JSON.stringify(info));
}

export function onCSAGameSummary(sessionID: number, gameSummary: CSAGameSummary): void {
  mainWindow.webContents.send(Renderer.CSA_GAME_SUMMARY, sessionID, JSON.stringify(gameSummary));
}

export function onCSAReject(sessionID: number): void {
  mainWindow.webContents.send(Renderer.CSA_REJECT, sessionID);
}

export function onCSAStart(sessionID: number, playerStates: CSAPlayerStates): void {
  mainWindow.webContents.send(Renderer.CSA_START, sessionID, JSON.stringify(playerStates));
}

export function onCSAMove(sessionID: number, move: string, playerStates: CSAPlayerStates): void {
  mainWindow.webContents.send(Renderer.CSA_MOVE, sessionID, move, JSON.stringify(playerStates));
}

export function onCSAGameResult(
  sessionID: number,
  specialMove: CSASpecialMove,
  gameResult: CSAGameResult,
): void {
  mainWindow.webContents.send(Renderer.CSA_GAME_RESULT, sessionID, specialMove, gameResult);
}

export function onCSAClose(sessionID: number): void {
  mainWindow.webContents.send(Renderer.CSA_CLOSE, sessionID);
}
