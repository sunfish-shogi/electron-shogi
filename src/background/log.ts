import path from "node:path";
import { shell } from "electron";
import log4js from "log4js";
import { loadAppSettingOnce } from "@/background/settings";
import { getDateTimeString } from "@/common/helpers/datetime";
import { getAppPath, isTest } from "./proc/env";
import { AppSetting } from "@/common/settings/app";
import { LogType } from "@/common/log";

const rootDir = getAppPath("logs");

export function openLogsDirectory(): void {
  shell.openPath(rootDir);
}

const datetime = getDateTimeString().replaceAll(" ", "_").replaceAll("/", "").replaceAll(":", "");

const appLogPath = path.join(rootDir, `app-${datetime}.log`);
const usiLogPath = path.join(rootDir, `usi-${datetime}.log`);
const csaLogPath = path.join(rootDir, `csa-${datetime}.log`);

const config: log4js.Configuration = {
  appenders: {
    stdout: { type: "stdout" },
    recording: { type: "recording" },
  },
  categories: {
    default: { appenders: ["stdout"], level: "info" },
  },
};

function getFilePath(type: LogType): string {
  switch (type) {
    case LogType.APP:
      return appLogPath;
    case LogType.USI:
      return usiLogPath;
    case LogType.CSA:
      return csaLogPath;
  }
}

function isLogEnabled(type: LogType, appSetting: AppSetting): boolean {
  switch (type) {
    case LogType.APP:
      return appSetting.enableAppLog;
    case LogType.USI:
      return appSetting.enableUSILog;
    case LogType.CSA:
      return appSetting.enableCSALog;
  }
}

const loggers: { [key: string]: log4js.Logger } = {};

function getLogger(type: LogType): log4js.Logger {
  if (loggers[type]) {
    return loggers[type];
  }
  if (!config.appenders[type]) {
    const appSetting = loadAppSettingOnce();
    config.appenders[type] = { type: "file", filename: getFilePath(type) };
    config.categories[type] = {
      appenders: isLogEnabled(type, appSetting) ? [type] : !isTest() ? ["stdout"] : ["recording"],
      level: appSetting.logLevel,
    };
  }
  const logger = log4js.configure(config).getLogger(type);
  loggers[type] = logger;
  return logger;
}

export function getAppLogger(): log4js.Logger {
  return getLogger(LogType.APP);
}

export function getUSILogger(): log4js.Logger {
  return getLogger(LogType.USI);
}

export function getCSALogger(): log4js.Logger {
  return getLogger(LogType.CSA);
}

export function shutdownLoggers(): void {
  log4js.shutdown((e) => {
    // eslint-disable-next-line no-console
    console.error("failed to shutdown loggers:", e);
  });
}

export function openLogFile(logType: LogType): void {
  shell.openPath(getFilePath(logType));
}
