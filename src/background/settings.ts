import fs from "node:fs";
import { shell } from "electron";
import path from "node:path";
import { USIEngineSettings } from "@/common/settings/usi";
import { AppSetting, defaultAppSetting, normalizeAppSetting } from "@/common/settings/app";
import {
  defaultWindowSetting,
  normalizeWindowSetting,
  WindowSetting,
} from "@/common/settings/window";
import { defaultGameSetting, GameSetting, normalizeGameSetting } from "@/common/settings/game";
import {
  defaultResearchSetting,
  normalizeResearchSetting,
  ResearchSetting,
} from "@/common/settings/research";
import {
  AnalysisSetting,
  defaultAnalysisSetting,
  normalizeAnalysisSetting,
} from "@/common/settings/analysis";
import { getAppLogger } from "@/background/log";
import {
  CSAGameSettingHistory,
  decryptCSAGameSettingHistory,
  defaultCSAGameSettingHistory,
  encryptCSAGameSettingHistory,
  normalizeSecureCSAGameSettingHistory,
} from "@/common/settings/csa";
import { DecryptString, EncryptString, isEncryptionAvailable } from "./encrypt";
import { getAppPath, getPortableExeDir } from "./environment";
import {
  MateSearchSetting,
  defaultMateSearchSetting,
  normalizeMateSearchSetting,
} from "@/common/settings/mate";
import {
  BatchConversionSetting,
  defaultBatchConversionSetting,
  normalizeBatchConversionSetting,
} from "@/common/settings/conversion";
import { exists } from "./helpers/file";

const userDir = getAppPath("userData");
const rootDir = getPortableExeDir() || userDir;
const docDir = path.join(getAppPath("documents"), "ElectronShogi");

export function openSettingsDirectory(): void {
  shell.openPath(rootDir);
}

export async function openAutoSaveDirectory(): Promise<void> {
  const appSetting = await loadAppSetting();
  shell.openPath(appSetting.autoSaveDirectory || docDir);
}

const windowSettingPath = path.join(userDir, "window.json");

export function saveWindowSetting(setting: WindowSetting): void {
  try {
    fs.writeFileSync(windowSettingPath, JSON.stringify(setting, undefined, 2), "utf8");
  } catch (e) {
    getAppLogger().error("failed to write window setting: %s", e);
  }
}

export function loadWindowSetting(): WindowSetting {
  try {
    return normalizeWindowSetting(JSON.parse(fs.readFileSync(windowSettingPath, "utf8")));
  } catch (e) {
    getAppLogger().error("failed to read window setting: %s", e);
    return defaultWindowSetting();
  }
}

const usiEngineSettingPath = path.join(rootDir, "usi_engine.json");

export async function saveUSIEngineSetting(setting: USIEngineSettings): Promise<void> {
  await fs.promises.writeFile(usiEngineSettingPath, setting.jsonWithIndent, "utf8");
}

export async function loadUSIEngineSetting(): Promise<USIEngineSettings> {
  if (!(await exists(usiEngineSettingPath))) {
    return new USIEngineSettings();
  }
  return new USIEngineSettings(await fs.promises.readFile(usiEngineSettingPath, "utf8"));
}

const appSettingPath = path.join(userDir, "app_setting.json");

export async function saveAppSetting(setting: AppSetting): Promise<void> {
  await fs.promises.writeFile(appSettingPath, JSON.stringify(setting, undefined, 2), "utf8");
}

const defaultReturnCode = process.platform === "win32" ? "\r\n" : "\n";

function getDefaultAppSetting(): AppSetting {
  return defaultAppSetting({
    returnCode: defaultReturnCode,
    autoSaveDirectory: docDir,
  });
}

function loadAppSettingFromMemory(json: string): AppSetting {
  return normalizeAppSetting(JSON.parse(json), {
    returnCode: defaultReturnCode,
    autoSaveDirectory: docDir,
  });
}

function loadAppSettingSync(): AppSetting {
  if (!fs.existsSync(appSettingPath)) {
    return getDefaultAppSetting();
  }
  return loadAppSettingFromMemory(fs.readFileSync(appSettingPath, "utf8"));
}

let appSettingCache: AppSetting;

export function loadAppSettingOnce(): AppSetting {
  if (!appSettingCache) {
    appSettingCache = loadAppSettingSync();
  }
  return appSettingCache;
}

export async function loadAppSetting(): Promise<AppSetting> {
  if (!(await exists(appSettingPath))) {
    return getDefaultAppSetting();
  }
  return loadAppSettingFromMemory(await fs.promises.readFile(appSettingPath, "utf8"));
}

const batchConversionSettingPath = path.join(rootDir, "batch_conversion_setting.json");

export async function saveBatchConversionSetting(setting: BatchConversionSetting): Promise<void> {
  await fs.promises.writeFile(
    batchConversionSettingPath,
    JSON.stringify(setting, undefined, 2),
    "utf8",
  );
}

export async function loadBatchConversionSetting(): Promise<BatchConversionSetting> {
  if (!(await exists(batchConversionSettingPath))) {
    return defaultBatchConversionSetting();
  }
  return normalizeBatchConversionSetting(
    JSON.parse(await fs.promises.readFile(batchConversionSettingPath, "utf8")),
  );
}

const gameSettingPath = path.join(rootDir, "game_setting.json");

export async function saveGameSetting(setting: GameSetting): Promise<void> {
  await fs.promises.writeFile(gameSettingPath, JSON.stringify(setting, undefined, 2), "utf8");
}

export async function loadGameSetting(): Promise<GameSetting> {
  if (!(await exists(gameSettingPath))) {
    return defaultGameSetting();
  }
  return normalizeGameSetting(JSON.parse(await fs.promises.readFile(gameSettingPath, "utf8")));
}

const csaGameSettingHistoryPath = path.join(rootDir, "csa_game_setting_history.json");

export async function saveCSAGameSettingHistory(setting: CSAGameSettingHistory): Promise<void> {
  const encrypted = encryptCSAGameSettingHistory(
    setting,
    isEncryptionAvailable() ? EncryptString : undefined,
  );
  await fs.promises.writeFile(
    csaGameSettingHistoryPath,
    JSON.stringify(encrypted, undefined, 2),
    "utf8",
  );
}

export async function loadCSAGameSettingHistory(): Promise<CSAGameSettingHistory> {
  if (!(await exists(csaGameSettingHistoryPath))) {
    return defaultCSAGameSettingHistory();
  }
  const encrypted = JSON.parse(await fs.promises.readFile(csaGameSettingHistoryPath, "utf8"));
  return decryptCSAGameSettingHistory(
    normalizeSecureCSAGameSettingHistory(encrypted),
    isEncryptionAvailable() ? DecryptString : undefined,
  );
}

const researchSettingPath = path.join(rootDir, "research_setting.json");

export async function saveResearchSetting(setting: ResearchSetting): Promise<void> {
  await fs.promises.writeFile(researchSettingPath, JSON.stringify(setting, undefined, 2), "utf8");
}

export async function loadResearchSetting(): Promise<ResearchSetting> {
  if (!(await exists(researchSettingPath))) {
    return defaultResearchSetting();
  }
  return normalizeResearchSetting(
    JSON.parse(await fs.promises.readFile(researchSettingPath, "utf8")),
  );
}

const analysisSettingPath = path.join(rootDir, "analysis_setting.json");

export async function saveAnalysisSetting(setting: AnalysisSetting): Promise<void> {
  await fs.promises.writeFile(analysisSettingPath, JSON.stringify(setting, undefined, 2), "utf8");
}

export async function loadAnalysisSetting(): Promise<AnalysisSetting> {
  if (!(await exists(analysisSettingPath))) {
    return defaultAnalysisSetting();
  }
  return normalizeAnalysisSetting(
    JSON.parse(await fs.promises.readFile(analysisSettingPath, "utf8")),
  );
}

const mateSearchSettingPath = path.join(rootDir, "mate_search_setting.json");

export async function saveMateSearchSetting(setting: MateSearchSetting): Promise<void> {
  await fs.promises.writeFile(mateSearchSettingPath, JSON.stringify(setting, undefined, 2), "utf8");
}

export async function loadMateSearchSetting(): Promise<MateSearchSetting> {
  if (!(await exists(mateSearchSettingPath))) {
    return defaultMateSearchSetting();
  }
  return normalizeMateSearchSetting(
    JSON.parse(await fs.promises.readFile(mateSearchSettingPath, "utf8")),
  );
}
