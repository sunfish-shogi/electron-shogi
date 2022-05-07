import { USIEngineSetting, USIEngineSettings } from "@/settings/usi";
import { watch } from "vue";
import { GameSetting } from "@/settings/game";
import { AppSetting } from "@/settings/app";
import { MenuEvent } from "@/ipc/menu";
import { SpecialMove, InitialPositionType } from "@/shogi";
import { USIInfoSender } from "@/store/usi";
import { webAPI } from "./web";
import { ResearchSetting } from "@/settings/research";
import { Mode } from "@/store/mode";
import { useStore } from "@/store";
import { GameResult } from "@/players/player";
import { usiBestMove } from "@/players/usi";
import { humanPlayer } from "@/players/human";

export interface API {
  getRecordPathFromProcArg(): Promise<string>;
  updateMenuState(mode: Mode, bussy: boolean): void;
  showOpenRecordDialog(): Promise<string>;
  openRecord(path: string): Promise<Uint8Array>;
  showSaveRecordDialog(defaultPath: string): Promise<string>;
  saveRecord(path: string, data: Uint8Array): Promise<void>;
  showSelectFileDialog(): Promise<string>;
  loadAppSetting(): Promise<string>;
  saveAppSetting(setting: string): Promise<void>;
  loadResearchSetting(): Promise<string>;
  saveResearchSetting(setting: string): Promise<void>;
  loadGameSetting(): Promise<string>;
  saveGameSetting(setting: string): Promise<void>;
  loadUSIEngineSetting(): Promise<string>;
  saveUSIEngineSetting(setting: string): Promise<void>;
  showSelectUSIEngineDialog(): Promise<string>;
  getUSIEngineInfo(path: string): Promise<string>;
  sendUSISetOption(path: string, name: string): Promise<void>;
  usiLaunch(json: string): Promise<number>;
  usiGo(
    sessionID: number,
    usi: string,
    json: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void>;
  usiGoInfinite(sessionID: number, usi: string): Promise<void>;
  usiStop(sessionID: number): Promise<void>;
  usiGameover(sessionID: number, result: GameResult): Promise<void>;
  usiQuit(sessionID: number): Promise<void>;
  onSendError(callback: (e: Error) => void): void;
  onMenuEvent(callback: (event: MenuEvent) => void): void;
  onUSIBestMove(
    callback: (sessionID: number, usi: string, sfen: string) => void
  ): void;
  onUSIInfo(
    callback: (
      sessionID: number,
      usi: string,
      sender: USIInfoSender,
      name: string,
      json: string
    ) => void
  ): void;
}

interface ExtendedWindow extends Window {
  electronShogiAPI: API;
}

function getWindowObject(): ExtendedWindow {
  return window as unknown as ExtendedWindow;
}

export function isNative(): boolean {
  return !!getWindowObject().electronShogiAPI;
}

function getAPI(): API {
  return getWindowObject().electronShogiAPI || webAPI;
}

export async function getRecordPathFromProcArg(): Promise<string> {
  return await getAPI().getRecordPathFromProcArg();
}

export async function showOpenRecordDialog(): Promise<string> {
  return await getAPI().showOpenRecordDialog();
}

export async function openRecord(path: string): Promise<Uint8Array> {
  return await getAPI().openRecord(path);
}

export async function showSaveRecordDialog(
  defaultPath: string
): Promise<string> {
  return await getAPI().showSaveRecordDialog(defaultPath);
}

export async function saveRecord(
  path: string,
  data: Uint8Array
): Promise<void> {
  await getAPI().saveRecord(path, data);
}

export async function showSelectFileDialog(): Promise<string> {
  return await getAPI().showSelectFileDialog();
}

export async function loadAppSetting(): Promise<AppSetting> {
  return JSON.parse(await getAPI().loadAppSetting());
}

export async function saveAppSetting(setting: AppSetting): Promise<void> {
  await getAPI().saveAppSetting(JSON.stringify(setting));
}

export async function loadResearchSetting(): Promise<ResearchSetting> {
  return JSON.parse(await getAPI().loadResearchSetting());
}

export async function saveResearchSetting(
  setting: ResearchSetting
): Promise<void> {
  await getAPI().saveResearchSetting(JSON.stringify(setting));
}

export async function loadGameSetting(): Promise<GameSetting> {
  return JSON.parse(await getAPI().loadGameSetting());
}

export async function saveGameSetting(setting: GameSetting): Promise<void> {
  await getAPI().saveGameSetting(JSON.stringify(setting));
}

export async function loadUSIEngineSetting(): Promise<USIEngineSettings> {
  return new USIEngineSettings(await getAPI().loadUSIEngineSetting());
}

export async function saveUSIEngineSetting(
  setting: USIEngineSettings
): Promise<void> {
  await getAPI().saveUSIEngineSetting(setting.jsonWithIndent);
}

export async function showSelectUSIEngineDialog(): Promise<string> {
  return await getAPI().showSelectUSIEngineDialog();
}

export async function getUSIEngineInfo(
  path: string
): Promise<USIEngineSetting> {
  return JSON.parse(await getAPI().getUSIEngineInfo(path));
}

export async function sendUSISetOption(
  path: string,
  name: string
): Promise<void> {
  await getAPI().sendUSISetOption(path, name);
}

export async function usiLaunch(setting: USIEngineSetting): Promise<number> {
  return await getAPI().usiLaunch(JSON.stringify(setting));
}

export async function usiGo(
  sessionID: number,
  usi: string,
  gameSetting: GameSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): Promise<void> {
  await getAPI().usiGo(
    sessionID,
    usi,
    JSON.stringify(gameSetting),
    blackTimeMs,
    whiteTimeMs
  );
}

export async function usiGoInfinite(
  sessionID: number,
  usi: string
): Promise<void> {
  await getAPI().usiGoInfinite(sessionID, usi);
}

export async function usiStop(sessionID: number): Promise<void> {
  await getAPI().usiStop(sessionID);
}

export async function usiGameover(
  sessionID: number,
  result: GameResult
): Promise<void> {
  await getAPI().usiGameover(sessionID, result);
}

export async function usiQuit(sessionID: number): Promise<void> {
  await getAPI().usiQuit(sessionID);
}

export function setup(): void {
  const store = useStore();
  const api = getAPI();
  api.onSendError((e: Error) => {
    store.pushError(e);
  });
  api.onMenuEvent((event: MenuEvent) => {
    if (store.isBussy) {
      return;
    }
    switch (event) {
      case MenuEvent.NEW_RECORD:
        store.newRecord();
        break;
      case MenuEvent.OPEN_RECORD:
        store.openRecord();
        break;
      case MenuEvent.SAVE_RECORD:
        store.saveRecord({ overwrite: true });
        break;
      case MenuEvent.SAVE_RECORD_AS:
        store.saveRecord();
        break;
      case MenuEvent.COPY_RECORD:
        store.copyRecordKIF();
        break;
      case MenuEvent.COPY_RECORD_CSA:
        store.copyRecordCSA();
        break;
      case MenuEvent.COPY_RECORD_USI_BEFORE:
        store.copyRecordUSIBefore();
        break;
      case MenuEvent.COPY_RECORD_USI_ALL:
        store.copyRecordUSIAll();
        break;
      case MenuEvent.COPY_BOARD_SFEN:
        store.copyBoardSFEN();
        break;
      case MenuEvent.PASTE_RECORD:
        store.showPasteDialog();
        break;
      case MenuEvent.INSERT_INTERRUPT:
        store.insertSpecialMove(SpecialMove.INTERRUPT);
        break;
      case MenuEvent.INSERT_RESIGN:
        store.insertSpecialMove(SpecialMove.RESIGN);
        break;
      case MenuEvent.INSERT_DRAW:
        store.insertSpecialMove(SpecialMove.DRAW);
        break;
      case MenuEvent.INSERT_REPETITION_DRAW:
        store.insertSpecialMove(SpecialMove.REPETITION_DRAW);
        break;
      case MenuEvent.INSERT_MATE:
        store.insertSpecialMove(SpecialMove.MATE);
        break;
      case MenuEvent.INSERT_TIMEOUT:
        store.insertSpecialMove(SpecialMove.TIMEOUT);
        break;
      case MenuEvent.INSERT_FOUL_WIN:
        store.insertSpecialMove(SpecialMove.FOUL_WIN);
        break;
      case MenuEvent.INSERT_FOUL_LOSE:
        store.insertSpecialMove(SpecialMove.FOUL_LOSE);
        break;
      case MenuEvent.INSERT_ENTERING_OF_KING:
        store.insertSpecialMove(SpecialMove.ENTERING_OF_KING);
        break;
      case MenuEvent.INSERT_WIN_BY_DEFAULT:
        store.insertSpecialMove(SpecialMove.WIN_BY_DEFAULT);
        break;
      case MenuEvent.INSERT_LOSS_BY_DEFAULT:
        store.insertSpecialMove(SpecialMove.LOSS_BY_DEFAULT);
        break;
      case MenuEvent.REMOVE_RECORD_AFTER:
        store.removeRecordAfter();
        break;
      case MenuEvent.START_POSITION_EDITING:
        store.startPositionEditing();
        break;
      case MenuEvent.END_POSITION_EDITING:
        store.endPositionEditing();
        break;
      case MenuEvent.CHANGE_TURN:
        store.changeTurn();
        break;
      case MenuEvent.INIT_POSITION_STANDARD:
        store.initializePosition(InitialPositionType.STANDARD);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_LANCE:
        store.initializePosition(InitialPositionType.HANDICAP_LANCE);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_RIGHT_LANCE:
        store.initializePosition(InitialPositionType.HANDICAP_RIGHT_LANCE);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_BISHOP:
        store.initializePosition(InitialPositionType.HANDICAP_BISHOP);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_ROOK:
        store.initializePosition(InitialPositionType.HANDICAP_ROOK);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_ROOK_LANCE:
        store.initializePosition(InitialPositionType.HANDICAP_ROOK_LANCE);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_2PIECES:
        store.initializePosition(InitialPositionType.HANDICAP_2PIECES);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_4PIECES:
        store.initializePosition(InitialPositionType.HANDICAP_4PIECES);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_6PIECES:
        store.initializePosition(InitialPositionType.HANDICAP_6PIECES);
        break;
      case MenuEvent.INIT_POSITION_HANDICAP_8PIECES:
        store.initializePosition(InitialPositionType.HANDICAP_8PIECES);
        break;
      case MenuEvent.INIT_POSITION_TSUME_SHOGI:
        store.initializePosition(InitialPositionType.TSUME_SHOGI);
        break;
      case MenuEvent.INIT_POSITION_TSUME_SHOGI_2KINGS:
        store.initializePosition(InitialPositionType.TSUME_SHOGI_2KINGS);
        break;
      case MenuEvent.START_GAME:
        store.showGameDialog();
        break;
      case MenuEvent.STOP_GAME:
        store.stopGame();
        break;
      case MenuEvent.RESIGN:
        humanPlayer.resign();
        break;
      case MenuEvent.START_RESEARCH:
        store.showResearchDialog();
        break;
      case MenuEvent.STOP_RESEARCH:
        store.stopResearch();
        break;
      case MenuEvent.FLIP_BOARD:
        store.flipBoard();
        break;
      case MenuEvent.APP_SETTING_DIALOG:
        store.openAppSettingDialog();
        break;
      case MenuEvent.USI_ENGINE_SETTING_DIALOG:
        store.openUsiEngineManagementDialog();
        break;
    }
  });
  api.onUSIBestMove((sessionID: number, usi: string, sfen: string) => {
    usiBestMove(sessionID, usi, sfen);
  });
  api.onUSIInfo(
    (
      sessionID: number,
      usi: string,
      sender: USIInfoSender,
      name: string,
      json: string
    ) => {
      store.updateUSIInfo(sessionID, usi, sender, name, JSON.parse(json));
    }
  );
  watch(
    () => [store.mode, store.isBussy],
    ([mode, bussy]) => {
      api.updateMenuState(mode as Mode, bussy as boolean);
    }
  );
  api.updateMenuState(store.mode, store.isBussy);
}
