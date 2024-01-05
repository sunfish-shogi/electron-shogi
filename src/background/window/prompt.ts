import path from "node:path";
import { BrowserWindow } from "electron";
import { isDevelopment, isPreview, isProduction, isTest } from "@/background/proc/env";
import { PromptTarget } from "@/common/advanced/prompt";
import { getAppLogger } from "@/background/log";
import { removePrompt } from "./ipc";

export function createCommandWindow(
  parent: BrowserWindow,
  target: PromptTarget,
  sessionID: number,
  name: string,
) {
  const preloadPath = isProduction() ? "./preload.js" : "../../../packed/preload.js";

  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, preloadPath),
      // on development, disable webSecurity to allow mix of "file://" and "http://localhost:5173"
      webSecurity: !isDevelopment(),
      // NOTE: 現状、Promptウィンドウではタイマーの実行が抑制されても困るケースが無いので、スロットリングは有効(デフォルト)にしておく。
      //backgroundThrottling: false,
    },
  });
  win.setBackgroundColor("#888");
  win.setParentWindow(parent);
  win.menuBarVisible = false;

  win.on("close", () => {
    removePrompt(target, sessionID, win.webContents.id);
  });

  const query = {
    target,
    session: String(sessionID),
    name,
  };

  if (isDevelopment() || isTest()) {
    // Development
    const params = new URLSearchParams(query);
    getAppLogger().info("load dev server URL (prompt)");
    win
      .loadURL("http://localhost:5173/prompt?" + params.toString())
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
    getAppLogger().info("load app URL (prompt)");
    win.loadFile(path.join(__dirname, "../../../prompt.html"), { query }).catch((e) => {
      getAppLogger().error(`failed to load app URL: ${e}`);
      throw e;
    });
  } else {
    // Production
    getAppLogger().info("load app URL (prompt)");
    win.loadFile(path.join(__dirname, "../prompt.html"), { query }).catch((e) => {
      getAppLogger().error(`failed to load app URL: ${e}`);
      throw e;
    });
  }
}
