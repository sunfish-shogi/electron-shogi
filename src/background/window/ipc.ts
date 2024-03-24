import { BrowserWindow, dialog, FileFilter, ipcMain, shell, WebContents } from "electron";
import { Background, Renderer } from "@/common/ipc/channel";
import path from "node:path";
import { promises as fs } from "node:fs";
import url from "node:url";
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
import { setupMenu, updateAppState } from "@/background/window/menu";
import { MenuEvent } from "@/common/control/menu";
import { USIInfoCommand } from "@/common/game/usi";
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
  collectSessionStates as collectUSISessionStates,
  getCommandHistory as getUSICommandHistory,
  invokeCommand as invokeUSICommand,
} from "@/background/usi";
import { GameResult } from "@/common/game/result";
import { LogLevel, LogType } from "@/common/log";
import { getAppLogger, openLogFile } from "@/background/log";
import {
  login as csaLogin,
  logout as csaLogout,
  agree as csaAgree,
  doMove as csaDoMove,
  resign as csaResign,
  win as csaWin,
  stop as csaStop,
  collectSessionStates as collectCSASessionStates,
  getCommandHistory as getCSACommandHistory,
  invokeCommand as invokeCSACommand,
} from "@/background/csa";
import { CSAGameResult, CSAGameSummary, CSAPlayerStates, CSASpecialMove } from "@/common/game/csa";
import { CSAServerSetting } from "@/common/settings/csa";
import { isEncryptionAvailable } from "@/background/helpers/encrypt";
import { validateIPCSender } from "./security";
import { t } from "@/common/i18n";
import { Rect } from "@/common/assets/geometry";
import { exportCaptureJPEG, exportCapturePNG } from "@/background/image/capture";
import { cropPieceImage } from "@/background/image/cropper";
import { getRelativeEnginePath, resolveEnginePath } from "@/background/usi/path";
import { fileURLToPath } from "@/background/helpers/url";
import { AppSettingUpdate } from "@/common/settings/app";
import { convertRecordFiles } from "@/background/file/conversion";
import { BatchConversionSetting } from "@/common/settings/conversion";
import {
  addHistory,
  clearHistory,
  getHistory,
  loadBackup,
  saveBackup,
} from "@/background/file/history";
import { getAppPath } from "@/background/proc/env";
import { fetchInitialRecordFileRequest } from "@/background/proc/args";
import { isSupportedRecordFilePath } from "@/background/file/extensions";
import { readStatus as readVersionStatus } from "@/background/version/check";
import { sendTestNotification } from "./debug";
import { SessionStates } from "@/common/advanced/monitor";
import { createCommandWindow } from "./prompt";
import { PromptTarget } from "@/common/advanced/prompt";
import { Command, CommandType } from "@/common/advanced/command";

const isWindows = process.platform === "win32";

let mainWindow: BrowserWindow; // TODO: refactoring
let appState = AppState.NORMAL;
let closable = false;

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

ipcMain.handle(Background.FETCH_INITIAL_RECORD_FILE_REQUEST, (event) => {
  validateIPCSender(event.senderFrame);
  return JSON.stringify(fetchInitialRecordFileRequest());
});

ipcMain.on(Background.UPDATE_APP_STATE, (event, state: AppState, bussy: boolean) => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug(`change app state: AppState=${state} BussyState=${bussy}`);
  appState = state;
  updateAppState(state, bussy);
});

ipcMain.on(Background.OPEN_EXPLORER, async (event, targetPath: string) => {
  validateIPCSender(event.senderFrame);
  try {
    const fullPath = resolveEnginePath(targetPath);
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      shell.openPath(fullPath);
    } else {
      shell.openPath(path.dirname(fullPath));
    }
  } catch {
    sendError(new Error(t.failedToOpenDirectory(targetPath)));
  }
});

ipcMain.on(Background.OPEN_WEB_BROWSER, (event, url: string) => {
  validateIPCSender(event.senderFrame);
  shell.openExternal(url);
});

ipcMain.handle(Background.SHOW_OPEN_RECORD_DIALOG, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  const appSetting = await loadAppSetting();
  getAppLogger().debug(`show open-record dialog`);
  const ret = await showOpenDialog(["openFile"], appSetting.lastRecordFilePath, [
    {
      name: t.recordFile,
      extensions: ["kif", "kifu", "ki2", "ki2u", "csa", "jkf"],
    },
  ]);
  if (ret) {
    updateAppSetting({ lastRecordFilePath: ret });
  }
  return ret;
});

ipcMain.handle(Background.OPEN_RECORD, async (event, path: string): Promise<Uint8Array> => {
  validateIPCSender(event.senderFrame);
  if (!isSupportedRecordFilePath(path)) {
    throw new Error(t.fileExtensionNotSupported);
  }
  getAppLogger().debug(`open record: ${path}`);
  return fs.readFile(path);
});

async function showOpenDialog(
  properties: ("openFile" | "createDirectory" | "openDirectory" | "noResolveAliases")[],
  defaultPath?: string,
  filters?: FileFilter[],
  buttonLabel?: string,
): Promise<string> {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    throw new Error("Failed to open dialog by unexpected error.");
  }
  const ret = await dialog.showOpenDialog(win, {
    defaultPath,
    properties,
    filters,
    buttonLabel,
  });
  getAppLogger().debug(`open dialog result: ${JSON.stringify(ret)}`);
  if (ret.canceled || ret.filePaths.length !== 1) {
    return "";
  }
  return ret.filePaths[0];
}

// NOTE: This function mutates filters.
async function showSaveDialog(
  defaultPath: string,
  filters: FileFilter[],
  buttonLabel?: string,
): Promise<string> {
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
  getAppLogger().debug("show save dialog");
  const ret = await dialog.showSaveDialog(win, {
    defaultPath: defaultPath,
    properties: ["createDirectory", "showOverwriteConfirmation"],
    filters,
    buttonLabel,
  });
  getAppLogger().debug(`save dialog result: ${JSON.stringify(ret)}`);
  return (!ret.canceled && ret.filePath) || "";
}

ipcMain.handle(
  Background.SHOW_SAVE_RECORD_DIALOG,
  async (event, defaultPath: string): Promise<string> => {
    validateIPCSender(event.senderFrame);
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw new Error("failed to open dialog by unexpected error.");
    }
    const appSetting = await loadAppSetting();
    const filters = [
      { name: "KIF (Shift_JIS)", extensions: ["kif"] },
      { name: "KIF (UTF-8)", extensions: ["kifu"] },
      { name: "KI2 (Shift_JIS)", extensions: ["ki2"] },
      { name: "KI2 (UTF-8)", extensions: ["ki2u"] },
      { name: "CSA", extensions: ["csa"] },
      { name: "JSON Kifu Format", extensions: ["jkf"] },
    ];
    const result = await showSaveDialog(
      path.resolve(path.dirname(appSetting.lastRecordFilePath), defaultPath),
      filters,
    );
    if (result) {
      updateAppSetting({ lastRecordFilePath: result });
    }
    return result;
  },
);

ipcMain.handle(
  Background.SAVE_RECORD,
  async (event, filePath: string, data: Uint8Array): Promise<void> => {
    validateIPCSender(event.senderFrame);
    if (!isSupportedRecordFilePath(filePath)) {
      throw new Error(t.fileExtensionNotSupported);
    }
    getAppLogger().debug(`save record: ${filePath} (${data.length} bytes)`);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, data);
  },
);

ipcMain.handle(Background.SHOW_SELECT_FILE_DIALOG, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    throw new Error("failed to open dialog by unexpected error.");
  }
  const appSetting = await loadAppSetting();
  getAppLogger().debug("show select-file dialog");
  const ret = await showOpenDialog(["openFile"], appSetting.lastOtherFilePath);
  if (ret) {
    updateAppSetting({ lastOtherFilePath: ret });
  }
  return ret;
});

ipcMain.handle(
  Background.SHOW_SELECT_DIRECTORY_DIALOG,
  async (event, defaultPath?: string): Promise<string> => {
    validateIPCSender(event.senderFrame);
    getAppLogger().debug("show select-directory dialog");
    const ret = await showOpenDialog(["createDirectory", "openDirectory"], defaultPath);
    return ret;
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
    const ret = await showOpenDialog(
      ["openFile"],
      defaultURL && fileURLToPath(defaultURL, getAppPath("pictures")),
      [{ name: t.imageFile, extensions: ["png", "jpg", "jpeg"] }],
    );
    return ret !== "" ? url.pathToFileURL(ret).toString() : "";
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
    return await showSaveDialog(path.resolve(defaultPath), filters, "OK");
  },
);

ipcMain.handle(
  Background.CROP_PIECE_IMAGE,
  async (event, srcURL: string, deleteMargin: boolean): Promise<string> => {
    validateIPCSender(event.senderFrame);
    return await cropPieceImage(srcURL, { deleteMargin });
  },
);

ipcMain.handle(Background.EXPORT_CAPTURE_AS_PNG, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  await exportCapturePNG(new Rect(json));
});

ipcMain.handle(Background.EXPORT_CAPTURE_AS_JPEG, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  await exportCaptureJPEG(new Rect(json));
});

ipcMain.handle(Background.CONVERT_RECORD_FILES, async (event, json: string): Promise<string> => {
  validateIPCSender(event.senderFrame);
  const setting = JSON.parse(json) as BatchConversionSetting;
  return JSON.stringify(await convertRecordFiles(setting));
});

ipcMain.handle(Background.LOAD_APP_SETTING, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load app setting");
  return JSON.stringify(await loadAppSetting());
});

ipcMain.handle(Background.SAVE_APP_SETTING, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save app setting");
  await saveAppSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_BATCH_CONVERSION_SETTING, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load batch conversion setting");
  return JSON.stringify(await loadBatchConversionSetting());
});

ipcMain.handle(
  Background.SAVE_BATCH_CONVERSION_SETTING,
  async (event, json: string): Promise<void> => {
    validateIPCSender(event.senderFrame);
    getAppLogger().debug("save batch conversion setting");
    await saveBatchConversionSetting(JSON.parse(json));
  },
);

ipcMain.handle(Background.LOAD_RESEARCH_SETTING, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load research setting");
  return JSON.stringify(await loadResearchSetting());
});

ipcMain.handle(Background.SAVE_RESEARCH_SETTING, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save research setting");
  await saveResearchSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_ANALYSIS_SETTING, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load analysis setting");
  return JSON.stringify(await loadAnalysisSetting());
});

ipcMain.handle(Background.SAVE_ANALYSIS_SETTING, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save analysis setting");
  await saveAnalysisSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_GAME_SETTING, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load game setting");
  return JSON.stringify(await loadGameSetting());
});

ipcMain.handle(Background.SAVE_GAME_SETTING, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save game setting");
  await saveGameSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_CSA_GAME_SETTING_HISTORY, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load CSA game setting history");
  return JSON.stringify(await loadCSAGameSettingHistory());
});

ipcMain.handle(
  Background.SAVE_CSA_GAME_SETTING_HISTORY,
  async (event, json: string): Promise<void> => {
    validateIPCSender(event.senderFrame);
    getAppLogger().debug("save CSA game setting history");
    await saveCSAGameSettingHistory(JSON.parse(json));
  },
);

ipcMain.handle(Background.LOAD_MATE_SEARCH_SETTING, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load mate search setting");
  return JSON.stringify(await loadMateSearchSetting());
});

ipcMain.handle(Background.SAVE_MATE_SEARCH_SETTING, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save mate search setting");
  await saveMateSearchSetting(JSON.parse(json));
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

ipcMain.handle(Background.LOAD_USI_ENGINE_SETTING, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("load USI engine setting");
  return (await loadUSIEngineSetting()).json;
});

ipcMain.handle(Background.SAVE_USI_ENGINE_SETTING, async (event, json: string): Promise<void> => {
  validateIPCSender(event.senderFrame);
  getAppLogger().debug("save USI engine setting");
  await saveUSIEngineSetting(new USIEngineSettings(json));
});

ipcMain.handle(Background.SHOW_SELECT_USI_ENGINE_DIALOG, async (event): Promise<string> => {
  validateIPCSender(event.senderFrame);
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    throw new Error("failed to open dialog by unexpected error.");
  }
  const appSetting = await loadAppSetting();
  getAppLogger().debug("show select-USI-engine dialog");
  const ret = await showOpenDialog(
    ["openFile", "noResolveAliases"],
    appSetting.lastUSIEngineFilePath,
    isWindows ? [{ name: t.executableFile, extensions: ["exe", "cmd", "bat"] }] : undefined,
  );
  if (ret === "") {
    return "";
  }
  const enginePath = getRelativeEnginePath(ret);
  updateAppSetting({
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
  (event, sessionID: number, usi: string, timeStatesJSON: string) => {
    validateIPCSender(event.senderFrame);
    usiGo(sessionID, usi, JSON.parse(timeStatesJSON));
  },
);

ipcMain.handle(
  Background.USI_GO_PONDER,
  (event, sessionID: number, usi: string, timeStatesJSON: string) => {
    validateIPCSender(event.senderFrame);
    usiGoPonder(sessionID, usi, JSON.parse(timeStatesJSON));
  },
);

ipcMain.handle(Background.USI_GO_PONDER_HIT, (event, sessionID: number, timeStatesJSON: string) => {
  validateIPCSender(event.senderFrame);
  usiPonderHit(sessionID, JSON.parse(timeStatesJSON));
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

ipcMain.handle(Background.COLLECT_SESSION_STATES, (event): string => {
  validateIPCSender(event.senderFrame);
  const sessionStates: SessionStates = {
    usiSessions: collectUSISessionStates(),
    csaSessions: collectCSASessionStates(),
  };
  return JSON.stringify(sessionStates);
});

const promptMap: { [key: string]: WebContents[] } = {};

function getPromptSessionKey(target: PromptTarget, sessionID: number): string {
  return `${target}:${sessionID}`;
}

function getPrompts(target: PromptTarget, sessionID: number): WebContents[] {
  const key = getPromptSessionKey(target, sessionID);
  return promptMap[key] || [];
}

function addPrompt(target: PromptTarget, sessionID: number, contents: WebContents): void {
  const key = getPromptSessionKey(target, sessionID);
  let entries = promptMap[key];
  if (!entries) {
    entries = [];
  }
  entries.push(contents);
  promptMap[key] = entries;
}

export function removePrompt(target: PromptTarget, sessionID: number, webContentsID: number): void {
  const key = getPromptSessionKey(target, sessionID);
  const entries = promptMap[key];
  if (!entries) {
    return;
  }
  const index = entries.findIndex((entry) => entry.id === webContentsID);
  if (index === -1) {
    return;
  }
  if (entries.length === 1) {
    delete promptMap[key];
  } else {
    entries.splice(index, 1);
    promptMap[key] = entries;
  }
}

ipcMain.handle(
  Background.SETUP_PROMPT,
  (event, target: PromptTarget, sessionID: number): string => {
    validateIPCSender(event.senderFrame);
    addPrompt(target, sessionID, event.sender);
    switch (target) {
      case PromptTarget.USI:
        return JSON.stringify(getUSICommandHistory(sessionID));
      case PromptTarget.CSA:
        return JSON.stringify(getCSACommandHistory(sessionID));
    }
  },
);

export function sendPromptCommand(target: PromptTarget, sessionID: number, command: Command): void {
  const prompts = getPrompts(target, sessionID);
  prompts.forEach((prompt) => {
    prompt.send(Renderer.PROMPT_COMMAND, JSON.stringify(command));
  });
}

ipcMain.on(
  Background.INVOKE_PROMPT_COMMAND,
  (event, target: PromptTarget, sessionID: number, type: CommandType, command: string) => {
    validateIPCSender(event.senderFrame);
    switch (target) {
      case PromptTarget.USI:
        invokeUSICommand(sessionID, type, command);
        break;
      case PromptTarget.CSA:
        invokeCSACommand(sessionID, type, command);
        break;
    }
  },
);

ipcMain.on(
  Background.OPEN_PROMPT,
  (event, target: PromptTarget, sessionID: number, name: string) => {
    validateIPCSender(event.senderFrame);
    createCommandWindow(mainWindow, target, sessionID, name);
  },
);

ipcMain.handle(Background.IS_ENCRYPTION_AVAILABLE, (event): boolean => {
  validateIPCSender(event.senderFrame);
  return isEncryptionAvailable();
});

ipcMain.handle(Background.GET_VERSION_STATUS, async (event) => {
  validateIPCSender(event.senderFrame);
  return JSON.stringify(await readVersionStatus());
});

ipcMain.on(Background.SEND_TEST_NOTIFICATION, (event) => {
  validateIPCSender(event.senderFrame);
  sendTestNotification();
});

ipcMain.on(Background.OPEN_LOG_FILE, (event, logType: LogType) => {
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

export function updateAppSetting(setting: AppSettingUpdate): void {
  mainWindow.webContents.send(Renderer.UPDATE_APP_SETTING, JSON.stringify(setting));
}

export function openRecord(path: string): void {
  if (isSupportedRecordFilePath(path)) {
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
