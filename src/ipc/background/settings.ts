import fs from "fs";
import { app, safeStorage, shell } from "electron";
import path from "path";
import { USIEngineSettings } from "@/settings/usi";
import { AppSetting, defaultAppSetting } from "@/settings/app";
import { defaultWindowSetting, WindowSetting } from "@/settings/window";
import { defaultGameSetting, GameSetting } from "@/settings/game";
import { defaultResearchSetting, ResearchSetting } from "@/settings/research";
import { AnalysisSetting, defaultAnalysisSetting } from "@/settings/analysis";
import { getAppLogger } from "@/ipc/background/log";
import {
  CSAGameSettingHistory,
  decryptCSAGameSettingHistory,
  defaultCSAGameSettingHistory,
  encryptCSAGameSettingHistory,
} from "@/settings/csa";

const rootDir = app.getPath("userData");

export function openSettingsDirectory(): void {
  shell.openPath(rootDir);
}

const windowSettingPath = path.join(rootDir, "window.json");

export function saveWindowSetting(setting: WindowSetting): void {
  try {
    fs.writeFileSync(
      windowSettingPath,
      JSON.stringify(setting, undefined, 2),
      "utf8"
    );
  } catch (e) {
    getAppLogger().error("failed to write window setting: %s", e);
  }
}

export function loadWindowSetting(): WindowSetting {
  try {
    return {
      ...defaultWindowSetting(),
      ...JSON.parse(fs.readFileSync(windowSettingPath, "utf8")),
    };
  } catch (e) {
    getAppLogger().error("failed to read window setting: %s", e);
    return defaultWindowSetting();
  }
}

const usiEngineSettingPath = path.join(rootDir, "usi_engine.json");

export function saveUSIEngineSetting(setting: USIEngineSettings): void {
  fs.writeFileSync(usiEngineSettingPath, setting.jsonWithIndent, "utf8");
}

export function loadUSIEngineSetting(): USIEngineSettings {
  if (!fs.existsSync(usiEngineSettingPath)) {
    return new USIEngineSettings();
  }
  return new USIEngineSettings(fs.readFileSync(usiEngineSettingPath, "utf8"));
}

const appSettingPath = path.join(rootDir, "app_setting.json");

export function saveAppSetting(setting: AppSetting): void {
  fs.writeFileSync(
    appSettingPath,
    JSON.stringify(setting, undefined, 2),
    "utf8"
  );
}

export function loadAppSetting(): AppSetting {
  const defautlReturnCode = process.platform === "win32" ? "\r\n" : "\n";
  if (!fs.existsSync(appSettingPath)) {
    return defaultAppSetting(defautlReturnCode);
  }
  return {
    ...defaultAppSetting(defautlReturnCode),
    ...JSON.parse(fs.readFileSync(appSettingPath, "utf8")),
  };
}

const gameSettingPath = path.join(rootDir, "game_setting.json");

export function saveGameSetting(setting: GameSetting): void {
  fs.writeFileSync(
    gameSettingPath,
    JSON.stringify(setting, undefined, 2),
    "utf8"
  );
}

export function loadGameSetting(): GameSetting {
  if (!fs.existsSync(gameSettingPath)) {
    return defaultGameSetting();
  }
  return {
    ...defaultGameSetting(),
    ...JSON.parse(fs.readFileSync(gameSettingPath, "utf8")),
  };
}

const csaGameSettingHistoryPath = path.join(
  rootDir,
  "csa_game_setting_history.json"
);

export function saveCSAGameSettingHistory(
  setting: CSAGameSettingHistory
): void {
  const encrypted = encryptCSAGameSettingHistory(setting, (plainText) => {
    return safeStorage.encryptString(plainText).toString("base64");
  });
  fs.writeFileSync(
    csaGameSettingHistoryPath,
    JSON.stringify(encrypted, undefined, 2),
    "utf8"
  );
}

export function loadCSAGameSettingHistory(): CSAGameSettingHistory {
  if (!fs.existsSync(csaGameSettingHistoryPath)) {
    return defaultCSAGameSettingHistory();
  }
  const encrypted = JSON.parse(
    fs.readFileSync(csaGameSettingHistoryPath, "utf8")
  );
  const setting = decryptCSAGameSettingHistory(encrypted, (encrypted) => {
    try {
      return safeStorage.decryptString(Buffer.from(encrypted, "base64"));
    } catch (e) {
      getAppLogger().error("failed to decrypt CSA server password: %s", e);
      return "";
    }
  });
  return {
    ...defaultCSAGameSettingHistory(),
    ...setting,
  };
}

const researchSettingPath = path.join(rootDir, "research_setting.json");

export function saveResearchSetting(setting: ResearchSetting): void {
  fs.writeFileSync(
    researchSettingPath,
    JSON.stringify(setting, undefined, 2),
    "utf8"
  );
}

export function loadResearchSetting(): ResearchSetting {
  if (!fs.existsSync(researchSettingPath)) {
    return defaultResearchSetting();
  }
  return {
    ...defaultResearchSetting(),
    ...JSON.parse(fs.readFileSync(researchSettingPath, "utf8")),
  };
}

const analysisSettingPath = path.join(rootDir, "analysis_setting.json");

export function saveAnalysisSetting(setting: AnalysisSetting): void {
  fs.writeFileSync(
    analysisSettingPath,
    JSON.stringify(setting, undefined, 2),
    "utf8"
  );
}

export function loadAnalysisSetting(): AnalysisSetting {
  if (!fs.existsSync(analysisSettingPath)) {
    return defaultAnalysisSetting();
  }
  return {
    ...defaultAnalysisSetting(),
    ...JSON.parse(fs.readFileSync(analysisSettingPath, "utf8")),
  };
}
