import path from "path";
import { app, shell } from "electron";
import log4js from "log4js";
import { loadAppSetting } from "@/ipc/background/settings";

const rootDir = app.getPath("logs");

export function openLogsDirectory(): void {
  shell.openPath(rootDir);
}

const datetime = new Date()
  .toLocaleTimeString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  .replaceAll(" ", "_")
  .replaceAll("/", "")
  .replaceAll(":", "");

const appLogPath = path.join(rootDir, `app-${datetime}.log`);
const usiLogPath = path.join(rootDir, `usi-${datetime}.log`);

let config: log4js.Log4js;

function getLogger(category: string): log4js.Logger {
  if (!config) {
    const appSetting = loadAppSetting();
    config = log4js.configure({
      appenders: {
        stdout: { type: "stdout" },
        app: { type: "file", filename: appLogPath },
        usi: { type: "file", filename: usiLogPath },
      },
      categories: {
        default: { appenders: ["stdout"], level: "info" },
        app: {
          appenders: appSetting.enableAppLog ? ["app"] : ["stdout"],
          level: "info",
        },
        usi: {
          appenders: appSetting.enableUSILog ? ["usi"] : ["stdout"],
          level: "info",
        },
      },
    });
  }
  return config.getLogger(category);
}

export function getAppLogger(): log4js.Logger {
  return getLogger("app");
}

export function getUSILogger(): log4js.Logger {
  return getLogger("usi");
}

export function shutdownLoggers(): void {
  config.shutdown((e) => {
    console.error("failed to shutdown logger:", e);
  });
}
