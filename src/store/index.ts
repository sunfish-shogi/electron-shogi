import {
  endGame,
  endResearch,
  openRecord,
  saveAppSetting,
  saveGameSetting,
  saveRecord,
  saveResearchSetting,
  showOpenRecordDialog,
  showSaveRecordDialog,
  startGame,
  startResearch,
  stopUSI,
  updateUSIPosition,
} from "@/ipc/renderer";
import {
  Color,
  InitialPositionType,
  Move,
  Position,
  PositionChange,
  Record,
  RecordMetadataKey,
  reverseColor,
  SpecialMove,
  specialMoveToDisplayString,
} from "@/shogi";
import { exportKakinoki, importKakinoki } from "@/shogi";
import { Mode, State } from "@/store/state";
import { InjectionKey } from "vue";
import { createStore, Store, useStore as baseUseStore } from "vuex";
import iconv from "iconv-lite";
import { defaultGameSetting, GameSetting, PlayerType } from "@/settings/game";
import {
  AppSettingUpdate,
  ClockSoundTarget,
  defaultAppSetting,
} from "@/settings/app";
import { beepShort, beepUnlimited, playPieceBeat } from "@/audio";
import { InfoCommand, USIInfoSender } from "@/usi/info";
import { BussyState } from "./bussy";
import { RecordEntryCustomData } from "./record";
import { USIMonitor } from "./usi";
import { GameState } from "./game";
import { defaultRecordFileName } from "@/helpers/path";
import { defaultResearchSetting, ResearchSetting } from "@/settings/research";

export const key: InjectionKey<Store<State>> = Symbol();

export function useStore(): Store<State> {
  return baseUseStore(key);
}

export enum Mutation {
  UPDATE_APP_SETTING = "updateAppSetting",
  SHOW_PASTE_DIALOG = "showPasteDialog",
  CLOSE_PASTE_DIALOG = "closePasteDialog",
  SHOW_GAME_DIALOG = "showGameDialog",
  SHOW_RESEARCH_DIALOG = "showResearchDialog",
  UPDATE_USI_POSITION = "updateUSIPosition",
  NEW_RECORD = "newRecord",
  DO_MOVE = "move",
  EDIT_POSITION = "editPosition",
  CHANGE_TURN = "changeTurn",
  INITIALIZE_POSITION = "initializePosition",
  UPDATE_RECORD_COMMENT = "updateRecordComment",
  RECEIVE_USI_INFO = "receiveUsiInfo",
  SETUP_GAME = "setupGame",
  CLEAR_GAME_TIMER = "clearGameTimer",
  FLIP_BOARD = "flipBoard",
  OPEN_APP_SETTING_DIALOG = "openAppSettingDialog",
  OPEN_USI_ENGINE_MANAGEMENT_DIALOG = "openUSIEngineManagementDialog",
  CLOSE_DIALOG = "closeDialog",
  RETAIN_BUSSY_STATE = "retainBussyState",
  RELEASE_BUSSY_STATE = "releaseBussyState",
  PUSH_MESSAGE = "pushMessage",
  SHIFT_MESSAGE = "shiftMessage",
  PUSH_ERROR = "pushError",
  CLEAR_ERRORS = "clearErrors",
}

export enum Action {
  UPDATE_AND_SAVE_APP_SETTING = "updateAndSaveAppSetting",
  UPDATE_AND_SAVE_APP_SETTING_ON_BACKGROUND = "updateAndSaveAppSettingOnBackground",
  OPEN_RECORD = "openRecord",
  SAVE_RECORD = "saveRecord",
  COPY_RECORD = "copyRecord",
  PASTE_RECORD = "pasteRecord",
  CHANGE_MOVE_NUMBER = "changeMoveNumber",
  CHANGE_BRANCH = "changeBranch",
  REMOVE_RECORD_AFTER = "removeRecordAfter",
  START_POSITION_EDITING = "startPositionEditing",
  END_POSITION_EDITING = "endPositionEditing",
  START_RESEARCH = "startResearch",
  STOP_RESEARCH = "stopResearch",
  START_GAME = "startGame",
  STOP_GAME = "stopGame",
  RESIGN_BY_USER = "resign",
  DO_MOVE_BY_USER = "doMoveByUser",
  DO_MOVE_BY_USI_ENGINE = "doMoveByUSIEngine",
  RESET_GAME_TIMER = "resetGameTimer",
  BEEP_UNLIMITED = "beepUnlimited",
  BEEP_SHORT = "beepShort",
}

export const store = createStore<State>({
  state: {
    record: new Record(),
    mode: Mode.NORMAL,
    bussyState: new BussyState(),
    usiSessionID: 0,
    researchSetting: defaultResearchSetting(),
    gameSetting: defaultGameSetting(),
    gameState: new GameState(),
    usiMonitor: new USIMonitor(),
    appSetting: defaultAppSetting(),
    messages: [],
    errors: [],
  },
  getters: {
    isMovableByUser(state): boolean {
      switch (state.mode) {
        case Mode.NORMAL:
        case Mode.RESEARCH:
          return true;
        case Mode.GAME:
          return (
            (state.record.position.color === Color.BLACK
              ? state.gameSetting.black.type
              : state.gameSetting.white.type) === PlayerType.HUMAN
          );
      }
      return false;
    },
  },
  mutations: {
    [Mutation.UPDATE_APP_SETTING](state, update: AppSettingUpdate) {
      state.appSetting = {
        ...state.appSetting,
        ...update,
      };
    },
    [Mutation.SHOW_PASTE_DIALOG](state) {
      if (state.mode === Mode.NORMAL) {
        state.mode = Mode.PASTE_DIALOG;
      }
    },
    [Mutation.CLOSE_PASTE_DIALOG](state) {
      if (state.mode === Mode.PASTE_DIALOG) {
        state.mode = Mode.NORMAL;
      }
    },
    [Mutation.SHOW_GAME_DIALOG](state) {
      if (state.mode === Mode.NORMAL) {
        state.mode = Mode.GAME_DIALOG;
      }
    },
    [Mutation.SHOW_RESEARCH_DIALOG](state) {
      if (state.mode === Mode.NORMAL) {
        state.mode = Mode.RESEARCH_DIALOG;
      }
    },
    [Mutation.UPDATE_USI_POSITION](state) {
      updateUSIPosition(
        state.record.usi,
        state.gameSetting,
        state.gameState.blackTimeMs,
        state.gameState.whiteTimeMs
      );
    },
    [Mutation.NEW_RECORD](state) {
      if (state.mode != Mode.NORMAL) {
        return;
      }
      state.record.clear(new Position());
      state.recordFilePath = undefined;
    },
    [Mutation.CHANGE_TURN](state) {
      if (state.mode != Mode.POSITION_EDITING) {
        return;
      }
      const position = state.record.position.clone();
      position.setTurn(reverseColor(position.color));
      state.record.clear(position);
    },
    [Mutation.INITIALIZE_POSITION](
      state,
      initialPositionType: InitialPositionType
    ) {
      if (state.mode != Mode.POSITION_EDITING) {
        return;
      }
      const position = new Position();
      position.reset(initialPositionType);
      state.record.clear(position);
    },
    [Mutation.DO_MOVE](state, move: Move) {
      state.record.append(move);
      state.record.current.setElapsedMs(state.gameState.elapsedMs);
      playPieceBeat(state.appSetting.pieceVolume);
    },
    [Mutation.EDIT_POSITION](state, change: PositionChange) {
      if (store.state.mode === Mode.POSITION_EDITING) {
        const position = state.record.position.clone();
        position.edit(change);
        state.record.clear(position);
      }
    },
    [Mutation.UPDATE_RECORD_COMMENT](state, comment: string) {
      state.record.current.comment = comment;
    },
    [Mutation.RECEIVE_USI_INFO](
      state,
      payload: {
        sessionID: number;
        usi: string;
        sender: USIInfoSender;
        info: InfoCommand;
      }
    ) {
      if (
        state.usiSessionID !== payload.sessionID ||
        state.record.usi != payload.usi
      ) {
        return;
      }
      state.usiMonitor.update(
        payload.sessionID,
        state.record.position,
        payload.sender,
        payload.info
      );
      const entryData = new RecordEntryCustomData(
        state.record.current.customData
      );
      entryData.updateUSIInfo(
        state.record.position.color,
        payload.sender,
        payload.info
      );
      state.record.current.customData = entryData.stringify();
    },
    [Mutation.SETUP_GAME](state, gameSetting: GameSetting) {
      state.gameSetting = gameSetting;
      state.gameState.setup(gameSetting);
      state.mode = Mode.GAME;
      if (gameSetting.startPosition) {
        state.record.metadata.setStandardMetadata(
          RecordMetadataKey.BLACK_NAME,
          gameSetting.black.name
        );
        state.record.metadata.setStandardMetadata(
          RecordMetadataKey.WHITE_NAME,
          gameSetting.white.name
        );
      }
    },
    [Mutation.CLEAR_GAME_TIMER](state) {
      state.gameState.clearTimer();
      if (state.beep5sHandler) {
        state.beep5sHandler.stop();
        state.beep5sHandler = undefined;
      }
    },
    [Mutation.FLIP_BOARD](state) {
      state.appSetting.boardFlipping = !state.appSetting.boardFlipping;
      saveAppSetting(state.appSetting);
    },
    [Mutation.OPEN_APP_SETTING_DIALOG](state) {
      if (state.mode === Mode.NORMAL) {
        state.mode = Mode.APP_SETTING_DIALOG;
      }
    },
    [Mutation.OPEN_USI_ENGINE_MANAGEMENT_DIALOG](state) {
      if (state.mode === Mode.NORMAL) {
        state.mode = Mode.USI_ENGINE_SETTING_DIALOG;
      }
    },
    [Mutation.CLOSE_DIALOG](state) {
      if (
        state.mode === Mode.USI_ENGINE_SETTING_DIALOG ||
        state.mode === Mode.APP_SETTING_DIALOG ||
        state.mode === Mode.GAME_DIALOG ||
        state.mode === Mode.RESEARCH_DIALOG
      ) {
        state.mode = Mode.NORMAL;
      }
    },
    [Mutation.RETAIN_BUSSY_STATE](state) {
      state.bussyState.retain();
    },
    [Mutation.RELEASE_BUSSY_STATE](state) {
      state.bussyState.release();
    },
    [Mutation.PUSH_MESSAGE](state, message: string) {
      state.messages.push(message);
    },
    [Mutation.SHIFT_MESSAGE](state) {
      state.messages.shift();
    },
    [Mutation.PUSH_ERROR](state, e) {
      if (e instanceof Error) {
        state.errors.push(e);
      } else {
        state.errors.push(new Error(e));
      }
    },
    [Mutation.CLEAR_ERRORS](state) {
      state.errors = [];
    },
  },
  actions: {
    async [Action.UPDATE_AND_SAVE_APP_SETTING](
      { commit, state },
      update: AppSettingUpdate
    ) {
      commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        await saveAppSetting({
          ...state.appSetting,
          ...update,
        });
        commit(Mutation.UPDATE_APP_SETTING, update);
        return true;
      } catch {
        store.commit(Mutation.PUSH_ERROR);
        return false;
      } finally {
        commit(Mutation.RELEASE_BUSSY_STATE);
      }
    },
    async [Action.UPDATE_AND_SAVE_APP_SETTING_ON_BACKGROUND](
      { commit, state },
      update: AppSettingUpdate
    ) {
      commit(Mutation.UPDATE_APP_SETTING, update);
      await saveAppSetting(state.appSetting);
    },
    async [Action.OPEN_RECORD]({ commit, state }, path) {
      if (state.mode !== Mode.NORMAL) {
        return false;
      }
      commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        if (!path) {
          path = await showOpenRecordDialog();
          if (!path) {
            return false;
          }
        }
        const data = await openRecord(path);
        if (path.match(/\.kif$/) || path.match(/\.kifu$/)) {
          const str = path.match(/\.kif$/)
            ? iconv.decode(data, "Shift_JIS")
            : data.toString();
          const recordOrError = importKakinoki(str);
          if (recordOrError instanceof Record) {
            state.recordFilePath = path;
            state.record = recordOrError;
          } else {
            commit(Mutation.PUSH_ERROR, recordOrError);
          }
          return true;
        } else {
          commit(Mutation.PUSH_ERROR, "不明なファイル形式: " + path);
          return false;
        }
      } catch (e) {
        commit(Mutation.PUSH_ERROR, "棋譜の読み込み中にエラーが出ました: " + e);
        return false;
      } finally {
        commit(Mutation.RELEASE_BUSSY_STATE);
      }
    },
    async [Action.SAVE_RECORD](
      { commit, state },
      options: {
        overwrite: boolean;
      }
    ) {
      if (state.mode !== Mode.NORMAL) {
        return false;
      }
      commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        let path = state.recordFilePath;
        if (!options?.overwrite || !path) {
          const defaultPath = defaultRecordFileName(state.record);
          path = await showSaveRecordDialog(defaultPath);
          if (!path) {
            return false;
          }
        }
        if (path.match(/\.kif$/) || path.match(/\.kifu$/)) {
          const str = exportKakinoki(state.record, {
            returnCode: "\r\n", // FIXME: OS の標準改行コードを検出する。
          });
          const data = path.match(/\.kif$/)
            ? iconv.encode(str, "Shift_JIS")
            : Buffer.from(str);
          await saveRecord(path, data);
          state.recordFilePath = path;
          return true;
        } else {
          commit(Mutation.PUSH_ERROR, "不明なファイル形式: " + path);
          return false;
        }
      } catch (e) {
        commit(Mutation.PUSH_ERROR, "棋譜の保存中にエラーが出ました: " + e);
        return false;
      } finally {
        commit(Mutation.RELEASE_BUSSY_STATE);
      }
    },
    [Action.COPY_RECORD]({ state }) {
      const str = exportKakinoki(state.record, {
        returnCode: "\r\n", // FIXME: OS の標準改行コードを検出する。
      });
      navigator.clipboard.writeText(str);
    },
    async [Action.PASTE_RECORD]({ state, commit }, data: string) {
      if (state.mode !== Mode.NORMAL) {
        return;
      }
      const recordOrError = importKakinoki(data);
      if (recordOrError instanceof Record) {
        state.recordFilePath = undefined;
        state.record = recordOrError;
      } else {
        commit(Mutation.PUSH_ERROR, recordOrError);
      }
    },
    [Action.CHANGE_MOVE_NUMBER]({ state, commit }, number: number) {
      if (state.mode !== Mode.NORMAL && state.mode !== Mode.RESEARCH) {
        return;
      }
      state.record.goto(number);
      commit(Mutation.UPDATE_USI_POSITION);
    },
    [Action.CHANGE_BRANCH]({ state, commit }, index: number) {
      if (state.mode !== Mode.NORMAL && state.mode !== Mode.RESEARCH) {
        return;
      }
      if (state.record.current.branchIndex === index) {
        return;
      }
      state.record.switchBranchByIndex(index);
      commit(Mutation.UPDATE_USI_POSITION);
    },
    async [Action.REMOVE_RECORD_AFTER]({ state, commit }) {
      if (state.mode !== Mode.NORMAL && state.mode !== Mode.RESEARCH) {
        return;
      }
      state.record.removeAfter();
      commit(Mutation.UPDATE_USI_POSITION);
    },
    [Action.START_POSITION_EDITING]({ state }) {
      if (state.mode === Mode.NORMAL) {
        state.mode = Mode.POSITION_EDITING;
        state.record.clear(state.record.position);
        state.recordFilePath = undefined;
      }
    },
    [Action.END_POSITION_EDITING]({ state }) {
      // FIXME: 局面整合性チェック
      if (state.mode === Mode.POSITION_EDITING) {
        state.mode = Mode.NORMAL;
      }
    },
    async [Action.START_RESEARCH](
      { commit, state },
      researchSetting: ResearchSetting
    ) {
      if (state.mode !== Mode.RESEARCH_DIALOG) {
        return false;
      }
      commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        await saveResearchSetting(researchSetting);
        state.usiSessionID += 1;
        await startResearch(researchSetting, state.usiSessionID);
        state.researchSetting = researchSetting;
        state.mode = Mode.RESEARCH;
        commit(Mutation.UPDATE_USI_POSITION);
        return true;
      } catch (e) {
        commit(Mutation.PUSH_ERROR, "検討の初期化中にエラーが出ました: " + e);
        return false;
      } finally {
        commit(Mutation.RELEASE_BUSSY_STATE);
      }
    },
    async [Action.STOP_RESEARCH]({ commit, state }) {
      if (state.mode !== Mode.RESEARCH) {
        return false;
      }
      commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        await endResearch();
        state.mode = Mode.NORMAL;
        return true;
      } catch (e) {
        commit(Mutation.PUSH_ERROR, "検討の終了中にエラーが出ました: " + e);
        return false;
      } finally {
        commit(Mutation.RELEASE_BUSSY_STATE);
      }
    },
    async [Action.START_GAME](
      { commit, dispatch, state },
      gameSetting: GameSetting
    ) {
      if (state.mode !== Mode.GAME_DIALOG) {
        return false;
      }
      commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        await saveGameSetting(gameSetting);
        if (gameSetting.startPosition) {
          const position = new Position();
          position.reset(gameSetting.startPosition);
          state.record.clear(position);
          state.recordFilePath = undefined;
        }
        state.usiSessionID += 1;
        await startGame(gameSetting, state.usiSessionID);
        commit(Mutation.SETUP_GAME, gameSetting);
        await dispatch(Action.RESET_GAME_TIMER);
        commit(Mutation.UPDATE_USI_POSITION);
        return true;
      } catch (e) {
        commit(Mutation.PUSH_ERROR, "対局の初期化中にエラーが出ました: " + e);
        return false;
      } finally {
        commit(Mutation.RELEASE_BUSSY_STATE);
      }
    },
    async [Action.STOP_GAME]({ commit, state }, specialMove?: SpecialMove) {
      if (state.mode !== Mode.GAME) {
        return false;
      }
      if (specialMove) {
        commit(
          Mutation.PUSH_MESSAGE,
          `対局終了（${specialMoveToDisplayString(specialMove)})`
        );
      }
      commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        await endGame(state.record.usi, specialMove);
        state.record.append(specialMove || SpecialMove.INTERRUPT);
        state.record.current.setElapsedMs(state.gameState.elapsedMs);
        commit(Mutation.CLEAR_GAME_TIMER);
        state.mode = Mode.NORMAL;
        return true;
      } catch (e) {
        commit(Mutation.PUSH_ERROR, "対局の終了中にエラーが出ました: " + e);
        return false;
      } finally {
        commit(Mutation.RELEASE_BUSSY_STATE);
      }
    },
    [Action.RESIGN_BY_USER]({ state, getters, dispatch }) {
      if (state.mode !== Mode.GAME) {
        return false;
      }
      if (!getters.isMovableByUser) {
        return;
      }
      return dispatch(Action.STOP_GAME, SpecialMove.RESIGN);
    },
    async [Action.DO_MOVE_BY_USER](
      { commit, dispatch, state, getters },
      move: Move
    ) {
      if (!getters.isMovableByUser) {
        return false;
      }
      if (state.mode === Mode.GAME) {
        state.gameState.increment(state.record.position.color);
      }
      commit(Mutation.DO_MOVE, move);
      if (state.mode === Mode.GAME) {
        dispatch(Action.RESET_GAME_TIMER);
      }
      commit(Mutation.UPDATE_USI_POSITION);
      return true;
    },
    async [Action.DO_MOVE_BY_USI_ENGINE](
      { commit, dispatch, state },
      payload: {
        sessionID: number;
        usi: string;
        color: Color;
        sfen: string;
      }
    ) {
      if (state.mode !== Mode.GAME) {
        return false;
      }
      if (state.usiSessionID !== payload.sessionID) {
        return false;
      }
      if (state.record.usi !== payload.usi) {
        return false;
      }
      if (payload.color !== state.record.position.color) {
        commit(
          Mutation.PUSH_ERROR,
          "手番ではないエンジンから指し手を受信しました:" + payload.sfen
        );
        dispatch(Action.STOP_GAME, SpecialMove.FOUL_LOSE);
        return false;
      }
      if (payload.sfen === "resign") {
        dispatch(Action.STOP_GAME, SpecialMove.RESIGN);
        return true;
      }
      if (payload.sfen === "win") {
        // TODO: 勝ち宣言が正当かどうかをチェックする。
        dispatch(Action.STOP_GAME, SpecialMove.ENTERING_OF_KING);
        return true;
      }
      const move = state.record.position.createMoveBySFEN(payload.sfen);
      if (!move || !state.record.position.isValidMove(move)) {
        commit(
          Mutation.PUSH_ERROR,
          "エンジンから不明な指し手を受信しました:" + payload.sfen
        );
        dispatch(Action.STOP_GAME, SpecialMove.FOUL_LOSE);
        return false;
      }
      state.gameState.increment(state.record.position.color);
      commit(Mutation.DO_MOVE, move);
      dispatch(Action.RESET_GAME_TIMER);
      commit(Mutation.UPDATE_USI_POSITION);
      return true;
    },
    [Action.RESET_GAME_TIMER]({ commit, dispatch, getters, state }) {
      commit(Mutation.CLEAR_GAME_TIMER);
      const color = state.record.position.color;
      state.gameState.startTimer(color, {
        timeout: () => {
          if (
            getters.isMovableByUser ||
            state.gameSetting.enableEngineTimeout
          ) {
            dispatch(Action.STOP_GAME, SpecialMove.TIMEOUT);
          } else {
            stopUSI(color);
          }
        },
        onBeepShort: () => {
          dispatch(Action.BEEP_SHORT);
        },
        onBeepUnlimited: () => {
          dispatch(Action.BEEP_UNLIMITED);
        },
      });
    },
    [Action.BEEP_UNLIMITED]({ state, getters }) {
      if (
        state.appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER &&
        !getters.isMovableByUser
      ) {
        return;
      }
      if (state.beep5sHandler) {
        return;
      }
      state.beep5sHandler = beepUnlimited({
        frequency: state.appSetting.clockPitch,
        volume: state.appSetting.clockVolume,
      });
    },
    [Action.BEEP_SHORT]({ state, getters }) {
      if (
        state.appSetting.clockSoundTarget === ClockSoundTarget.ONLY_USER &&
        !getters.isMovableByUser
      ) {
        return;
      }
      if (state.beep5sHandler) {
        return;
      }
      beepShort({
        frequency: state.appSetting.clockPitch,
        volume: state.appSetting.clockVolume,
      });
    },
  },
});
