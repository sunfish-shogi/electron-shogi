import { Color } from "@/shogi";
import { USIEngineSetting, USIEngineSettings } from "@/settings/usi";
import { watch } from "vue";
import { GameSetting } from "@/settings/game";
import { AppSetting } from "@/settings/app";
import { MenuEvent } from "@/menu/event";
import { SpecialMove, InitialPositionType } from "@/shogi";
import { USIInfoSender } from "@/usi/info";
import { webAPI } from "./web";
import { ResearchSetting } from "@/settings/research";
import { Mode } from "@/store/mode";
import { useStore } from "@/store";

export interface API {
  getRecordPathFromProcArg(): Promise<string>;
  updateMenuState(mode: Mode, bussy: boolean): void;
  showOpenRecordDialog(): Promise<string>;
  openRecord(path: string): Promise<Buffer>;
  showSaveRecordDialog(defaultPath: string): Promise<string>;
  saveRecord(path: string, data: Buffer): Promise<void>;
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
  startResearch(json: string, sessionID: number): Promise<void>;
  endResearch(): Promise<void>;
  startGame(json: string, sessionID: number): Promise<void>;
  endGame(usi: string, specialMove?: SpecialMove): Promise<void>;
  updateUSIPosition(
    usi: string,
    gameSetting: string,
    blackTimeMs: number,
    whiteTimeMs: number
  ): Promise<void>;
  stopUSI(color: Color): Promise<void>;
  sendUSISetOption(path: string, name: string): Promise<void>;
  onSendError(callback: (e: Error) => void): void;
  onMenuEvent(callback: (event: MenuEvent) => void): void;
  onUSIBestMove(
    callback: (
      sessionID: number,
      usi: string,
      color: Color,
      sfen: string
    ) => void
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

export async function openRecord(path: string): Promise<Buffer> {
  return await getAPI().openRecord(path);
}

export async function showSaveRecordDialog(
  defaultPath: string
): Promise<string> {
  return await getAPI().showSaveRecordDialog(defaultPath);
}

export async function saveRecord(path: string, data: Buffer): Promise<void> {
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

export async function startResearch(
  researchSetting: ResearchSetting,
  sessionID: number
): Promise<void> {
  await getAPI().startResearch(JSON.stringify(researchSetting), sessionID);
}

export async function endResearch(): Promise<void> {
  await getAPI().endResearch();
}

export async function startGame(
  gameSetting: GameSetting,
  sessionID: number
): Promise<void> {
  await getAPI().startGame(JSON.stringify(gameSetting), sessionID);
}

export async function endGame(
  usi: string,
  specialMove?: SpecialMove
): Promise<void> {
  await getAPI().endGame(usi, specialMove);
}

export async function updateUSIPosition(
  usi: string,
  gameSetting: GameSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): Promise<void> {
  await getAPI().updateUSIPosition(
    usi,
    JSON.stringify(gameSetting),
    blackTimeMs,
    whiteTimeMs
  );
}

export async function stopUSI(color: Color): Promise<void> {
  await getAPI().stopUSI(color);
}

export async function sendUSISetOption(
  path: string,
  name: string
): Promise<void> {
  await getAPI().sendUSISetOption(path, name);
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
        store.copyRecord();
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
      case MenuEvent.START_GAME:
        store.showGameDialog();
        break;
      case MenuEvent.STOP_GAME:
        store.stopGame();
        break;
      case MenuEvent.RESIGN:
        store.resignByUser();
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
  api.onUSIBestMove(
    (sessionID: number, usi: string, color: Color, sfen: string) => {
      store.doMoveByUsiEngine(sessionID, usi, color, sfen);
    }
  );
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
