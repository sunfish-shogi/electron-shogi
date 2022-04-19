import { Module } from "vuex";
import { State } from ".";
import { Action } from "./action";
import { Mode } from "./mode";

type Confirmation = {
  message: string;
  onOk: () => void;
  onCancel?: () => void;
};

export type ConfirmationState = {
  confirmation?: Confirmation;
  lastMode?: Mode;
};

export const confirmationState: Module<ConfirmationState, State> = {
  state: {},
  actions: {
    [Action.SHOW_CONFIRMATION](
      { state, rootState },
      confirmation: Confirmation
    ) {
      state.confirmation = confirmation;
      state.lastMode = rootState.mode;
      rootState.mode = Mode.TEMPORARY;
    },
    [Action.CONFIRMATION_OK]({ state, rootState }) {
      const onOk = state.confirmation?.onOk;
      state.confirmation = undefined;
      if (state.lastMode) {
        rootState.mode = state.lastMode;
        state.lastMode = undefined;
      }
      if (onOk) {
        onOk();
      }
    },
    [Action.CONFIRMATION_CANCEL]({ state, rootState }) {
      const onCancel = state.confirmation?.onCancel;
      state.confirmation = undefined;
      if (state.lastMode) {
        rootState.mode = state.lastMode;
        state.lastMode = undefined;
      }
      if (onCancel) {
        onCancel();
      }
    },
  },
};
