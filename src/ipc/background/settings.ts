import fs from "fs";
import { app, shell } from "electron";
import path from "path";
import { USIEngineSettings } from "@/settings/usi";
import { AppSetting, defaultAppSetting } from "@/settings/app";
import { defaultWindowSetting, WindowSetting } from "@/settings/window";
import { defaultGameSetting, GameSetting } from "@/settings/game";
import { defaultResearchSetting, ResearchSetting } from "@/settings/research";
import { AnalysisSetting, defaultAnalysisSetting } from "@/settings/analysis";

export function openSettingsDirectory(): void {
  shell.openPath(app.getPath("userData"));
}

const windowSettingPath = path.join(app.getPath("userData"), "window.json");

export function saveWindowSetting(setting: WindowSetting): void {
  try {
    fs.writeFileSync(
      windowSettingPath,
      JSON.stringify(setting, undefined, 2),
      "utf8"
    );
  } catch (e) {
    console.warn("failed to write window setting:", e);
  }
}

export function loadWindowSetting(): WindowSetting {
  try {
    return {
      ...defaultWindowSetting(),
      ...JSON.parse(fs.readFileSync(windowSettingPath, "utf8")),
    };
  } catch (e) {
    console.warn("failed to read window setting:", e);
    return defaultWindowSetting();
  }
}

const usiEngineSettingPath = path.join(
  app.getPath("userData"),
  "usi_engine.json"
);

export function saveUSIEngineSetting(setting: USIEngineSettings): void {
  fs.writeFileSync(usiEngineSettingPath, setting.jsonWithIndent, "utf8");
}

export function loadUSIEngineSetting(): USIEngineSettings {
  if (!fs.existsSync(usiEngineSettingPath)) {
    return new USIEngineSettings();
  }
  return new USIEngineSettings(fs.readFileSync(usiEngineSettingPath, "utf8"));
}

const appSettingPath = path.join(app.getPath("userData"), "app_setting.json");

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

const gameSettingPath = path.join(app.getPath("userData"), "game_setting.json");

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

const researchSettingPath = path.join(
  app.getPath("userData"),
  "research_setting.json"
);

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

const analysisSettingPath = path.join(
  app.getPath("userData"),
  "analysis_setting.json"
);

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
