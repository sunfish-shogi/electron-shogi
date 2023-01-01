import path from "path";
import { app, shell } from "electron";
import log4js from "log4js";
import { loadAppSetting } from "@/background/settings";
import { getDateTimeString } from "@/common/helpers/datetime";
import { isTest } from "./environment";

const rootDir = !isTest() ? app.getPath("logs") : "";

export function openLogsDirectory(): void {
  shell.openPath(rootDir);
}

const datetime = getDateTimeString()
  .replaceAll(" ", "_")
  .replaceAll("/", "")
  .replaceAll(":", "");

const appLogPath = path.join(rootDir, `app-${datetime}.log`);
const usiLogPath = path.join(rootDir, `usi-${datetime}.log`);
const csaLogPath = path.join(rootDir, `csa-${datetime}.log`);

const defaultAppenders = !isTest() ? ["stdout"] : [];
let config: log4js.Log4js;

function getLogger(category: string): log4js.Logger {
  if (!config) {
    const appSetting = loadAppSetting();
    config = log4js.configure({
      appenders: {
        stdout: { type: "stdout" },
        app: { type: "file", filename: appLogPath },
        usi: { type: "file", filename: usiLogPath },
        csa: { type: "file", filename: csaLogPath },
      },
      categories: {
        default: { appenders: defaultAppenders, level: "info" },
        app: {
          appenders: appSetting.enableAppLog ? ["app"] : defaultAppenders,
          level: "info",
        },
        usi: {
          appenders: appSetting.enableUSILog ? ["usi"] : defaultAppenders,
          level: "info",
        },
        csa: {
          appenders: appSetting.enableCSALog ? ["csa"] : defaultAppenders,
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

export function getCSALogger(): log4js.Logger {
  return getLogger("csa");
}

export function shutdownLoggers(): void {
  config.shutdown((e) => {
    console.error("failed to shutdown logger:", e);
  });
}
