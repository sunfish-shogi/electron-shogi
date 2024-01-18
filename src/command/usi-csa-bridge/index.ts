import { ArgumentsParser } from "@/command/common/arguments";
const argParser = new ArgumentsParser("usi-csa-bridge", "<csa_game_config.json>");
const engineTimeout = argParser.number(
  "engine-timeout",
  "Maximum time[seconds] of USI engine execution.",
  180,
  { min: 1 },
);
const recordDir = argParser.value("record-dir", "Directory to save records.", "records");
const enableAppLogFile = argParser.flag("app-log-file", "Enable application log file.");
const enableUSILogFile = argParser.flag("usi-log-file", "Enable USI log file.");
const enableCSALogFile = argParser.flag("csa-log-file", "Enable CSA log file.");
const enableAllLogFile = argParser.flag("all-log-file", "Enable all log files.");
const disableStdoutLog = argParser.flag(
  "disable-stdout-log",
  "Disable stdout log. Should be used with --XXX-log-file.",
);
argParser.parse();

import { preload } from "@/command/common/preload";
preload({
  appLogFile: enableAppLogFile() || enableAllLogFile(),
  usiLogFile: enableUSILogFile() || enableAllLogFile(),
  csaLogFile: enableCSALogFile() || enableAllLogFile(),
  stdoutLog: !disableStdoutLog(),
});

import fs from "node:fs";
import path from "node:path";
import { CSAGameSetting } from "@/common/settings/csa";
import { Clock } from "@/renderer/store/clock";
import { RecordManager } from "@/renderer/store/record";
import { CSAGameManager, loginRetryIntervalSeconds } from "@/renderer/store/csa";
import { defaultPlayerBuilder } from "@/renderer/players/builder";
import { getAppLogger } from "@/background/log";
import { defaultRecordFileNameTemplate, generateRecordFileName } from "@/renderer/helpers/path";
import { RecordFileFormat } from "@/common/file/record";
import { ordinal } from "@/common/helpers/string";

const configPath = argParser.args[0];
if (!configPath) {
  getAppLogger().error("config path is not specified.");
  process.exit(1);
}
const setting = JSON.parse(fs.readFileSync(configPath, "utf-8")) as CSAGameSetting;

const recordManager = new RecordManager();
const blackClock = new Clock();
const whiteClock = new Clock();
const gameManager = new CSAGameManager(recordManager, blackClock, whiteClock);
const playerBuilder = defaultPlayerBuilder(engineTimeout());

gameManager
  .on("gameNext", onGameNext)
  .on("newGame", onNewGame)
  .on("gameEnd", onGameEnd)
  .on("saveRecord", onSaveRecord)
  .on("loginRetry", onLoginRetry)
  .on("error", onError)
  .login(setting, playerBuilder)
  .catch(onFatalError);

function onGameNext() {
  // eslint-disable-next-line no-console
  console.log("waiting for new game...");
}

function onNewGame(n: number) {
  // eslint-disable-next-line no-console
  console.log(`${ordinal(n)} game started.`);
}

function onGameEnd() {
  // eslint-disable-next-line no-console
  console.log("completed. will exit after some seconds...");
}

function onSaveRecord() {
  const fileName = generateRecordFileName(
    recordManager.record.metadata,
    defaultRecordFileNameTemplate, // TODO: コマンドライン引数で指定可能にする。
    RecordFileFormat.KIF, // TODO: コマンドライン引数で指定可能にする。
  );
  const dir = recordDir();
  const filePath = path.join(dir, fileName);
  fs.promises
    .mkdir(dir, { recursive: true })
    .then(() => {
      const result = recordManager.exportRecordAsBuffer(filePath, { returnCode: "\n" });
      if (result instanceof Error) {
        getAppLogger().error(result);
        return;
      }
      return fs.promises.writeFile(filePath, result.data);
    })
    .then(() => {
      getAppLogger().info("record saved: %s", filePath);
    })
    .catch((e) => {
      getAppLogger().error(e);
    });
}

function onLoginRetry() {
  // eslint-disable-next-line no-console
  console.log(`Retry login after ${loginRetryIntervalSeconds} seconds...`);
}

function onError(e: unknown) {
  getAppLogger().error(e);
}

function onFatalError(e: unknown) {
  getAppLogger().error(e);
  process.exit(1);
}
