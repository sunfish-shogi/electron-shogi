import { Module } from "vuex";
import { State } from ".";
import { Mutation } from "./mutation";

export type ErrorState = {
  queue: Error[];
};

export const errorState: Module<ErrorState, State> = {
  state: {
    queue: [],
  },
  getters: {
    hasError(state): boolean {
      return state.queue.length !== 0;
    },
  },
  mutations: {
    [Mutation.PUSH_ERROR](state, e) {
      if (e instanceof Error) {
        state.queue.push(e);
      } else {
        state.queue.push(new Error(e));
      }
    },
    [Mutation.CLEAR_ERRORS](state) {
      state.queue = [];
    },
  },
};
