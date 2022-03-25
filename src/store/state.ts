import { AudioEventHandler } from "@/audio";
import { AppSetting } from "@/settings/app";
import { GameSetting } from "@/settings/game";
import { ResearchSetting } from "@/settings/research";
import { Record } from "@/shogi";
import { BussyState } from "./bussy";
import { GameState } from "./game";
import { USIMonitor } from "./usi";

export enum Mode {
  NORMAL = "normal",
  PASTE_DIALOG = "pasteDialog",
  POSITION_EDITING = "positionEditing",
  GAME = "game",
  GAME_DIALOG = "gameDialog",
  RESEARCH = "research",
  RESEARCH_DIALOG = "researchDialog",
  USI_ENGINE_SETTING_DIALOG = "usiEngineSettingDialog",
  APP_SETTING_DIALOG = "appSettingDialog",
}

export type State = {
  recordFilePath?: string;
  record: Record;
  mode: Mode;
  bussyState: BussyState;
  usiSessionID: number;
  researchSetting: ResearchSetting;
  gameSetting: GameSetting;
  gameState: GameState;
  beep5sHandler?: AudioEventHandler;
  usiMonitor: USIMonitor;
  appSetting: AppSetting;
  messages: string[];
  errors: Error[];
};
