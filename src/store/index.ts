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
import { InjectionKey, watch } from "vue";
import {
  CommitOptions,
  createStore,
  DispatchOptions,
  useStore as baseUseStore,
} from "vuex";
import iconv from "iconv-lite";
import { GameSetting } from "@/settings/game";
import {
  AppSetting,
  AppSettingUpdate,
  ClockSoundTarget,
  defaultAppSetting,
} from "@/settings/app";
import {
  AudioEventHandler,
  beepShort,
  beepUnlimited,
  playPieceBeat,
} from "@/audio";
import { InfoCommand, USIInfoSender } from "@/usi/info";
import { RecordEntryCustomData } from "./record";
import { GameState } from "./game";
import { defaultRecordFileName } from "@/helpers/path";
import { ResearchSetting } from "@/settings/research";
import { Mutation } from "./mutation";
import { Action } from "./action";
import { BussyState, bussyState } from "./bussy";
import { USIState, usiState } from "./usi";
import { Mode } from "./mode";
import { messageState, MessageState } from "./message";
import { errorState, ErrorState } from "./error";
import * as uri from "@/uri";

export { Mutation } from "./mutation";
export { Action } from "./action";

export type State = {
  appSetting: AppSetting;
  recordFilePath?: string;
  record: Record;
  mode: Mode;
  usiSessionID: number;
  game: GameState;
  beep5sHandler?: AudioEventHandler;
};

interface Store {
  readonly state: State & {
    readonly usi: USIState;
    readonly message: MessageState;
    readonly error: ErrorState;
    readonly bussy: BussyState;
  };
  readonly getters: {
    readonly isMovableByUser: boolean;
    readonly hasMessage: boolean;
    readonly message: string;
    readonly hasError: boolean;
    readonly isBussy: boolean;
  };
  dispatch(
    type: Action,
    payload?: unknown,
    options?: DispatchOptions
  ): Promise<unknown>;
  commit(type: Mutation, payload?: unknown, options?: CommitOptions): void;
}

export const key: InjectionKey<Store> = Symbol();

export function useStore(): Store {
  return baseUseStore(key);
}

export const store = createStore<State>({
  state: {
    appSetting: defaultAppSetting(),
    record: new Record(),
    mode: Mode.NORMAL,
    usiSessionID: 0,
    game: new GameState(),
  },
  modules: {
    usi: usiState,
    message: messageState,
    error: errorState,
    bussy: bussyState,
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
              ? state.game.setting.black.uri
              : state.game.setting.white.uri) === uri.ES_HUMAN
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
    [Mutation.FLIP_BOARD](state) {
      state.appSetting.boardFlipping = !state.appSetting.boardFlipping;
      saveAppSetting(state.appSetting);
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
    [Mutation.NEW_RECORD](state) {
      if (state.mode != Mode.NORMAL) {
        return;
      }
      state.record.clear(new Position());
      state.recordFilePath = undefined;
    },
    [Mutation.UPDATE_RECORD_COMMENT](state, comment: string) {
      state.record.current.comment = comment;
    },
    [Mutation.CHANGE_TURN](state) {
      if (state.mode != Mode.POSITION_EDITING) {
        return;
      }
      const position = state.record.position.clone();
      position.setColor(reverseColor(position.color));
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
    [Mutation.EDIT_POSITION](state, change: PositionChange) {
      if (state.mode === Mode.POSITION_EDITING) {
        const position = state.record.position.clone();
        position.edit(change);
        state.record.clear(position);
      }
    },
    [Mutation.CHANGE_MOVE_NUMBER](state, number: number) {
      if (state.mode !== Mode.NORMAL && state.mode !== Mode.RESEARCH) {
        return;
      }
      state.record.goto(number);
    },
    [Mutation.CHANGE_BRANCH](state, index: number) {
      if (state.mode !== Mode.NORMAL && state.mode !== Mode.RESEARCH) {
        return;
      }
      if (state.record.current.branchIndex === index) {
        return;
      }
      state.record.switchBranchByIndex(index);
    },
    [Mutation.REMOVE_RECORD_AFTER](state) {
      if (state.mode !== Mode.NORMAL && state.mode !== Mode.RESEARCH) {
        return;
      }
      state.record.removeAfter();
    },
    [Mutation.DO_MOVE](state, move: Move) {
      state.record.append(move, {
        ignoreValidation: true,
      });
      state.record.current.setElapsedMs(state.game.elapsedMs);
      playPieceBeat(state.appSetting.pieceVolume);
    },
    [Mutation.CLEAR_GAME_TIMER](state) {
      state.game.clearTimer();
      if (state.beep5sHandler) {
        state.beep5sHandler.stop();
        state.beep5sHandler = undefined;
      }
    },
  },
  actions: {
    async [Action.UPDATE_APP_SETTING](
      { commit, state },
      update: AppSettingUpdate
    ) {
      await saveAppSetting({
        ...state.appSetting,
        ...update,
      });
      commit(Mutation.UPDATE_APP_SETTING, update);
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
            returnCode: state.appSetting.returnCode,
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
        returnCode: state.appSetting.returnCode,
      });
      navigator.clipboard.writeText(str);
    },
    [Action.PASTE_RECORD]({ state, commit }, data: string) {
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
    [Action.UPDATE_USI_INFO](
      { state, commit },
      payload: {
        sessionID: number;
        usi: string;
        sender: USIInfoSender;
        name: string;
        info: InfoCommand;
      }
    ) {
      if (
        state.usiSessionID !== payload.sessionID ||
        state.record.usi != payload.usi
      ) {
        return;
      }
      commit(Mutation.UPDATE_USI_INFO, {
        sessionID: payload.sessionID,
        position: state.record.position,
        sender: payload.sender,
        name: payload.name,
        info: payload.info,
      });
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
        state.mode = Mode.RESEARCH;
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
    async [Action.START_GAME]({ commit, state }, setting: GameSetting) {
      if (state.mode !== Mode.GAME_DIALOG) {
        return false;
      }
      commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        await saveGameSetting(setting);
        if (setting.startPosition) {
          const position = new Position();
          position.reset(setting.startPosition);
          state.record.clear(position);
          state.recordFilePath = undefined;
        }
        state.usiSessionID += 1;
        await startGame(setting, state.usiSessionID);
        state.game.setup(setting);
        state.mode = Mode.GAME;
        state.record.metadata.setStandardMetadata(
          RecordMetadataKey.BLACK_NAME,
          setting.black.name
        );
        state.record.metadata.setStandardMetadata(
          RecordMetadataKey.WHITE_NAME,
          setting.white.name
        );
        if (setting.humanIsFront) {
          let flip = state.appSetting.boardFlipping;
          if (
            setting.black.uri === uri.ES_HUMAN &&
            setting.white.uri !== uri.ES_HUMAN
          ) {
            flip = false;
          } else if (
            setting.black.uri !== uri.ES_HUMAN &&
            setting.white.uri === uri.ES_HUMAN
          ) {
            flip = true;
          }
          if (flip !== state.appSetting.boardFlipping) {
            commit(Mutation.FLIP_BOARD);
          }
        }
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
        state.record.current.setElapsedMs(state.game.elapsedMs);
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
    [Action.DO_MOVE_BY_USER]({ commit, state, getters }, move: Move) {
      if (!getters.isMovableByUser) {
        return false;
      }
      if (state.mode === Mode.GAME) {
        state.game.increment(state.record.position.color);
      }
      commit(Mutation.DO_MOVE, move);
      return true;
    },
    [Action.DO_MOVE_BY_USI_ENGINE](
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
      state.game.increment(state.record.position.color);
      commit(Mutation.DO_MOVE, move);
      return true;
    },
    [Action.RESET_GAME_TIMER]({ dispatch, getters, state }) {
      const color = state.record.position.color;
      state.game.startTimer(color, {
        timeout: () => {
          if (
            getters.isMovableByUser ||
            state.game.setting.enableEngineTimeout
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

watch(
  [() => store.state.mode, () => store.state.record.position],
  () => {
    store.commit(Mutation.CLEAR_GAME_TIMER);
    if (store.state.mode === Mode.GAME) {
      store.dispatch(Action.RESET_GAME_TIMER);
    }
    if (store.state.mode === Mode.GAME || store.state.mode === Mode.RESEARCH) {
      updateUSIPosition(
        store.state.record.usi,
        store.state.game.setting,
        store.state.game.blackTimeMs,
        store.state.game.whiteTimeMs
      );
    }
  },
  { deep: true }
);
