import path from "node:path";
import { BrowserWindow } from "electron";
import { getPreloadPath, isDevelopment, isPreview, isTest } from "@/background/proc/env";
import { getAppLogger } from "@/background/log";

let win: BrowserWindow | null = null;

export function createLayoutManagerWindow(parent: BrowserWindow) {
  if (win) {
    win.focus();
    return;
  }

  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, getPreloadPath()),
      // on development, disable webSecurity to allow mix of "file://" and "http://localhost:5173"
      webSecurity: !isDevelopment(),
      // NOTE: 現状、LayoutManager ウィンドウではタイマーの実行が抑制されても困るケースが無いので、スロットリングは有効(デフォルト)にしておく。
      //backgroundThrottling: false,
    },
  });
  win.setBackgroundColor("#888");
  win.setParentWindow(parent);
  win.menuBarVisible = false;

  win.once("ready-to-show", () => {
    win?.webContents.setZoomLevel(parent.webContents.getZoomLevel());
  });
  win.on("close", () => {
    win = null;
  });

  if (isDevelopment() || isTest()) {
    // Development
    getAppLogger().info("load dev server URL (layout manager)");
    win
      .loadURL("http://localhost:5173/layout-manager")
      .then(() => {
        if (!process.env.IS_TEST && win) {
          win.webContents.openDevTools();
        }
      })
      .catch((e) => {
        getAppLogger().error(`failed to load dev server URL: ${e}`);
        throw e;
      });
  } else if (isPreview()) {
    // Preview
    getAppLogger().info("load app URL (layout manager)");
    win.loadFile(path.join(__dirname, "../../../layout-manager.html")).catch((e) => {
      getAppLogger().error(`failed to load app URL: ${e}`);
      throw e;
    });
  } else {
    // Production
    getAppLogger().info("load app URL (layout manager)");
    win.loadFile(path.join(__dirname, "../layout-manager.html")).catch((e) => {
      getAppLogger().error(`failed to load app URL: ${e}`);
      throw e;
    });
  }
}
