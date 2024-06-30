import path from "node:path";
import { app, BrowserWindow } from "electron";
import {
  getAppState,
  isClosable,
  onClose,
  openRecord,
  sendError,
  setupIPC,
} from "@/background/window/ipc";
import { loadWindowSetting, saveWindowSetting } from "@/background/settings";
import { buildWindowSetting } from "@/common/settings/window";
import { getAppLogger } from "@/background/log";
import { AppState } from "@/common/control/state";
import { getPreloadPath, isDevelopment, isPreview, isTest } from "@/background/proc/env";
import { checkUpdates } from "@/background/version/check";
import { setupMenu } from "@/background/window/menu";
import { t } from "@/common/i18n";
import { ghioDomain } from "@/common/links/github";

export function createWindow() {
  let setting = loadWindowSetting();

  getAppLogger().info("create BrowserWindow");

  // Create the browser window.
  const win = new BrowserWindow({
    width: setting.width,
    height: setting.height,
    fullscreen: setting.fullscreen,
    webPreferences: {
      preload: path.join(__dirname, getPreloadPath()),
      // on development, disable webSecurity to allow mix of "file://" and "http://localhost:5173"
      webSecurity: !isDevelopment(),
      // 対局や棋譜解析の用途では処理の遅延が致命的なのでスロットリングを無効にする。
      backgroundThrottling: false,
    },
  });
  win.setBackgroundColor("#888");
  if (setting.maximized) {
    win.maximize();
  }
  win.on("resized", () => {
    setting = buildWindowSetting(setting, win);
  });
  win.on("close", (event) => {
    if (getAppState() === AppState.CSA_GAME) {
      event.preventDefault();
      sendError(new Error(t.youCanNotCloseAppWhileCSAOnlineGame));
      return;
    }
    if (!isClosable()) {
      event.preventDefault();
      onClose();
      return;
    }
    setting = buildWindowSetting(setting, win);
    saveWindowSetting(setting);
  });

  setupIPC(win);
  setupMenu(win);

  if (isDevelopment() || isTest()) {
    // Development
    getAppLogger().info("load dev server URL");
    win
      .loadURL("http://localhost:5173")
      .then(() => {
        if (!process.env.IS_TEST) {
          win.webContents.openDevTools();
        }
      })
      .catch((e) => {
        getAppLogger().error(`failed to load dev server URL: ${e}`);
        throw e;
      });
  } else if (isPreview()) {
    // Preview
    getAppLogger().info("load app URL");
    win.loadFile(path.join(__dirname, "../../../index.html")).catch((e) => {
      getAppLogger().error(`failed to load app URL: ${e}`);
      throw e;
    });
  } else {
    // Production
    getAppLogger().info("load app URL");
    win.loadFile(path.join(__dirname, "../index.html")).catch((e) => {
      getAppLogger().error(`failed to load app URL: ${e}`);
      throw e;
    });
  }

  win.once("ready-to-show", () => {
    // レンダラー側の準備ができたら uncaughtException はレンダラーへ送る。
    process.on("uncaughtException", (e, origin) => {
      // ホストの解決ができない場合に uncaughtException が発生する。
      // github.io へのアクセスは更新確認以外に無いので、ここでエラー文言を付け加える。
      if (e instanceof Error && e.message === `getaddrinfo ENOTFOUND ${ghioDomain}`) {
        sendError(new Error(`${t.failedToCheckUpdates}: ${e}`));
        return;
      }
      sendError(new Error(`${origin} ${e}`));
    });
    win.show();

    // macOS では起動後に Finder からファイルを開こうとすると既に存在するプロセスに対して open-file イベントが発生する。
    app.on("open-file", (event, path) => {
      getAppLogger().info("on open-file: %s", path);
      event.preventDefault();
      if (win.isMinimized()) {
        win.restore();
      }
      win.focus();
      openRecord(path);
    });

    checkUpdates().catch((e) => {
      sendError(new Error(`${t.failedToCheckUpdates}: ${e}`));
    });
  });
}
