import { BrowserWindow, dialog, ipcMain } from "electron";
import { Background, Renderer } from "./channel";
import fs from "fs";
import {
  loadAppSetting,
  loadGameSetting,
  loadResearchSetting,
  loadUSIEngineSetting,
  saveAppSetting,
  saveGameSetting,
  saveResearchSetting,
  saveUSIEngineSetting,
} from "@/settings/fs";
import { USIEngineSettings } from "@/settings/usi";
import {
  getUSIEngineInfo,
  startGame as usiStartGame,
  endGame as usiEndGame,
  updatePosition as updateUSIPosition,
  stop as stopUSI,
  startResearch as usiStartResearch,
  endResearch as usiEndResearch,
  sendSetOptionCommand as usiSendSetOptionCommand,
} from "@/usi";
import { Color } from "@/shogi";
import { updateState as updateMenuState } from "@/menu/menu";
import { MenuEvent } from "@/menu/event";
import { SpecialMove } from "@/shogi/record";
import { InfoCommand, USIInfoSender } from "@/usi/info";
import { Mode } from "@/store/mode";

const isWindows = process.platform === "win32";

let mainWindow: BrowserWindow;

export default function setup(win: BrowserWindow): void {
  mainWindow = win;
}

ipcMain.handle(Background.GET_RECORD_PATH_FROM_PROC_ARG, () => {
  const path = process.argv[process.argv.length - 1];
  if (isValidRecordFilePath(path)) {
    return path;
  }
});

ipcMain.on(Background.UPDATE_MENU_STATE, (_, mode: Mode, bussy: boolean) => {
  updateMenuState(mode, bussy);
});

ipcMain.handle(
  Background.UPDATE_USI_POSITION,
  (
    _,
    usi: string,
    gameSetting: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ) => {
    updateUSIPosition(usi, JSON.parse(gameSetting), blackTimeMs, whiteTimeMs);
  }
);

ipcMain.handle(Background.STOP_USI, (_, color: Color) => {
  stopUSI(color);
});

ipcMain.handle(
  Background.SEND_USI_SET_OPTION,
  async (_, path: string, name: string) => {
    await usiSendSetOptionCommand(path, name);
  }
);

function isValidRecordFilePath(path: string) {
  return path.endsWith(".kif") || path.endsWith(".kifu");
}

ipcMain.handle(
  Background.SHOW_OPEN_RECORD_DIALOG,
  async (): Promise<string> => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw "予期せぬエラーでダイアログを表示せきません。";
    }
    const results = dialog.showOpenDialogSync(win, {
      properties: ["openFile"],
      filters: [{ name: "棋譜ファイル", extensions: ["kif", "kifu"] }],
    });
    return results && results.length === 1 ? results[0] : "";
  }
);

ipcMain.handle(
  Background.OPEN_RECORD,
  async (_, path: string): Promise<Buffer> => {
    if (!isValidRecordFilePath(path)) {
      throw new Error(`取り扱いできないファイル拡張子です`);
    }
    return fs.promises.readFile(path);
  }
);

ipcMain.handle(
  Background.SHOW_SAVE_RECORD_DIALOG,
  async (_, defaultPath: string): Promise<string> => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw "予期せぬエラーでダイアログを表示せきません。";
    }
    const result = dialog.showSaveDialogSync(win, {
      defaultPath: defaultPath,
      properties: ["createDirectory", "showOverwriteConfirmation"],
      filters: [
        { name: "KIF形式 (Shift-JIS)", extensions: ["kif"] },
        { name: "KIF形式 (UTF-8)", extensions: ["kifu"] },
      ],
    });
    return result ? result : "";
  }
);

ipcMain.handle(
  Background.SAVE_RECORD,
  async (_, path: string, data: Buffer): Promise<void> => {
    if (!isValidRecordFilePath(path)) {
      throw new Error(`取り扱いできないファイル拡張子です`);
    }
    fs.promises.writeFile(path, data);
  }
);

ipcMain.handle(
  Background.SHOW_SELECT_FILE_DIALOG,
  async (): Promise<string> => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) {
      throw "予期せぬエラーでダイアログを表示せきません。";
    }
    const results = dialog.showOpenDialogSync(win, {
      properties: ["openFile"],
    });
    return results && results.length === 1 ? results[0] : "";
  }
);

ipcMain.handle(Background.LOAD_APP_SETTING, (): string => {
  return JSON.stringify(loadAppSetting());
});

ipcMain.handle(Background.SAVE_APP_SETTING, (_, json: string): void => {
  saveAppSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_RESEARCH_SETTING, (): string => {
  return JSON.stringify(loadResearchSetting());
});

ipcMain.handle(Background.SAVE_RESEARCH_SETTING, (_, json: string): void => {
  saveResearchSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_GAME_SETTING, (): string => {
  return JSON.stringify(loadGameSetting());
});

ipcMain.handle(Background.SAVE_GAME_SETTING, (_, json: string): void => {
  saveGameSetting(JSON.parse(json));
});

ipcMain.handle(Background.LOAD_USI_ENGINE_SETTING, (): string => {
  return loadUSIEngineSetting().json;
});

ipcMain.handle(Background.SAVE_USI_ENGINE_SETTING, (_, json: string): void => {
  saveUSIEngineSetting(new USIEngineSettings(json));
});

ipcMain.handle(Background.SHOW_SELECT_USI_ENGINE_DIALOG, (): string => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    throw "予期せぬエラーでダイアログを表示せきません。";
  }
  const results = dialog.showOpenDialogSync(win, {
    properties: ["openFile"],
    filters: isWindows
      ? [{ name: "実行可能ファイル", extensions: ["exe"] }]
      : undefined,
  });
  return results && results.length === 1 ? results[0] : "";
});

ipcMain.handle(
  Background.GET_USI_ENGINE_INFO,
  async (_, path: string): Promise<string> => {
    return JSON.stringify(await getUSIEngineInfo(path));
  }
);

ipcMain.handle(
  Background.START_RESEARCH,
  async (_, json: string, sessionID: number) => {
    await usiStartResearch(sessionID, JSON.parse(json));
  }
);

ipcMain.handle(Background.END_RESEARCH, async () => {
  usiEndResearch();
});

ipcMain.handle(
  Background.START_GAME,
  async (_, json: string, sessionID: number) => {
    await usiStartGame(sessionID, JSON.parse(json));
  }
);

ipcMain.handle(
  Background.END_GAME,
  (_, usi: string, specialMove?: SpecialMove) => {
    usiEndGame(usi, specialMove);
  }
);

export function sendError(e: Error): void {
  mainWindow.webContents.send(Renderer.SEND_ERROR, e);
}

export function onMenuEvent(event: MenuEvent): void {
  mainWindow.webContents.send(Renderer.MENU_EVENT, event);
}

export function onUSIBestMove(
  sessionID: number,
  usi: string,
  color: Color,
  sfen: string
): void {
  mainWindow.webContents.send(
    Renderer.USI_BEST_MOVE,
    sessionID,
    usi,
    color,
    sfen
  );
}

export function onUSIInfo(
  sessionID: number,
  usi: string,
  sender: USIInfoSender,
  name: string,
  info: InfoCommand
): void {
  mainWindow.webContents.send(
    Renderer.USI_INFO,
    sessionID,
    usi,
    sender,
    name,
    JSON.stringify(info)
  );
}
