"use strict";

import path from "path";
import { app, protocol, BrowserWindow } from "electron";
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import setupIpc from "@/ipc/background";
import setupMenu from "@/menu/menu";
import { loadWindowSetting, saveWindowSetting } from "./settings/fs";
import { buildWindowSetting } from "./settings/window";

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  let setting = loadWindowSetting();

  // Create the browser window.
  const win = new BrowserWindow({
    width: setting.width,
    height: setting.height,
    fullscreen: setting.fullscreen,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  if (setting.maximized) {
    win.maximize();
  }
  win.on("resized", () => {
    setting = buildWindowSetting(setting, win);
  });
  win.on("close", () => {
    setting = buildWindowSetting(setting, win);
    saveWindowSetting(setting);
  });

  setupIpc(win);
  setupMenu();

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string);
    if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol("app");
    // Load the index.html when not in development
    win.loadURL("app://./index.html");
  }
}

app.enableSandbox();

// Quit when all windows are closed.
app.on("window-all-closed", () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("web-contents-created", (_, contents) => {
  contents.on("will-navigate", (event) => {
    event.preventDefault();
  });
  contents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS);
    } catch (e: unknown) {
      console.error("Vue Devtools failed to install:", (e as Error).toString());
    }
  }
  createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === "win32") {
    process.on("message", (data) => {
      if (data === "graceful-exit") {
        app.quit();
      }
    });
  } else {
    process.on("SIGTERM", () => {
      app.quit();
    });
  }
}
