"use strict";

import path from "path";
import { app, protocol, BrowserWindow, session } from "electron";
import { getAppState, sendError, setup } from "@/background/ipc";
import { loadWindowSetting, saveWindowSetting } from "@/background/settings";
import { buildWindowSetting } from "@/common/settings/window";
import { getAppLogger, shutdownLoggers } from "@/background/log";
import { quitAll as usiQuitAll } from "@/background/usi";
import { AppState } from "@/common/control/state";
import { validateHTTPRequest } from "./security";
import {
  isDevelopment,
  isPreview,
  isProduction,
  isTest,
} from "@/background/environment";

getAppLogger().info("start main process");
getAppLogger().info("process argv: %s", process.argv.join(" "));

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

function createWindow() {
  let setting = loadWindowSetting();

  getAppLogger().info("create BrowserWindow");

  const preloadPath = isProduction()
    ? "./preload.js"
    : "../../packed/preload.js";

  // Create the browser window.
  const win = new BrowserWindow({
    width: setting.width,
    height: setting.height,
    fullscreen: setting.fullscreen,
    webPreferences: {
      preload: path.join(__dirname, preloadPath),
    },
  });
  if (setting.maximized) {
    win.maximize();
  }
  win.on("resized", () => {
    setting = buildWindowSetting(setting, win);
  });
  win.on("close", (event) => {
    if (getAppState() === AppState.CSA_GAME) {
      event.preventDefault();
      sendError(new Error("CSAプロトコル使用中はアプリを終了できません。"));
      return;
    }
    setting = buildWindowSetting(setting, win);
    saveWindowSetting(setting);
  });

  setup(win);

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
    win.loadFile(path.join(__dirname, "../../index.html")).catch((e) => {
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
}

app.enableSandbox();

app.on("will-quit", () => {
  getAppLogger().info("on will-quit");
  usiQuitAll();
  // プロセスを終了する前にログファイルの出力を完了する。
  shutdownLoggers();
});

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  getAppLogger().info("on window-all-closed");
  app.quit();
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("web-contents-created", (_, contents) => {
  contents.on("will-navigate", (event) => {
    event.preventDefault();
  });
  contents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });
});

async function installElectronDevtools() {
  const installer = await import("electron-devtools-installer");
  await installer.default(installer.VUEJS3_DEVTOOLS);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  if (isDevelopment()) {
    getAppLogger().info("install Vue3 Dev Tools");
    // Install Vue Devtools
    installElectronDevtools().catch((e) => {
      getAppLogger().error(`Vue Devtools failed to install: ${e}`);
      throw e;
    });
  }
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    validateHTTPRequest(details.method, details.url);
    callback({});
  });
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment() || isTest()) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        getAppLogger().info("on graceful-exit message");
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      getAppLogger().info("on SIGTERM");
      app.quit();
    });
  }
}
