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
import { loadWindowSettings, saveWindowSettings } from "@/background/settings";
import { buildWindowSettings } from "@/common/settings/window";
import { getAppLogger } from "@/background/log";
import { AppState } from "@/common/control/state";
import { getPreloadPath, isDevelopment, isPreview, isTest } from "@/background/proc/env";
import { checkUpdates } from "@/background/version/check";
import { setupMenu } from "@/background/window/menu";
import { t } from "@/common/i18n";
import { ghioDomain } from "@/common/links/github";

export function createWindow() {
  let settings = loadWindowSettings();

  getAppLogger().info("create BrowserWindow");

  // Create the browser window.
  const win = new BrowserWindow({
    width: settings.width,
    height: settings.height,
    fullscreen: settings.fullscreen,
    webPreferences: {
      preload: path.join(__dirname, getPreloadPath()),
      // on development, disable webSecurity to allow mix of "file://" and "http://localhost:5173"
      webSecurity: !isDevelopment(),
      // 対局や棋譜解析の用途では処理の遅延が致命的なのでスロットリングを無効にする。
      backgroundThrottling: false,
    },
  });
  win.setBackgroundColor("#888");
  if (settings.maximized) {
    win.maximize();
  }
  win.on("resized", () => {
    settings = buildWindowSettings(settings, win);
  });
  win.on("close", (event) => {
    getAppLogger().info("BrowserWindow close");
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
    settings = buildWindowSettings(settings, win);
    saveWindowSettings(settings);
  });

  win.webContents.on("did-finish-load", () => {
    getAppLogger().info("BrowserWindow did-finish-load");
  });
  win.webContents.on(
    "did-frame-finish-load",
    (event, isMainFrame, frameProcessId, frameRoutingId) => {
      getAppLogger().info(
        `BrowserWindow did-frame-finish-load: ${frameProcessId} ${frameRoutingId}`,
      );
    },
  );
  win.webContents.on("did-fail-load", (event, errorCode, errorDescription, validatedURL) => {
    getAppLogger().error(
      `BrowserWindow did-fail-load: ${errorCode} ${errorDescription} ${validatedURL}`,
    );
  });
  win.webContents.on("did-fail-provisional-load", (event, errorCode, errorDescription) => {
    getAppLogger().error(
      `BrowserWindow did-fail-provisional-load: ${errorCode} ${errorDescription}`,
    );
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
    getAppLogger().info("load app URL (Preview)");
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
    getAppLogger().info("BrowserWindow ready-to-show");

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

    getAppLogger().info("BrowserWindow show");
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

    getAppLogger().info("check updates");
    checkUpdates().catch((e) => {
      getAppLogger().error(`${t.failedToCheckUpdates}: ${e}`);
    });
  });
}
