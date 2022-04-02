import { Module } from "vuex";
import { State } from ".";
import { Mutation } from "./mutation";

export type BussyState = {
  count: number;
};

export const bussyState: Module<BussyState, State> = {
  state: {
    count: 0,
  },
  getters: {
    isBussy(state): boolean {
      return state.count !== 0;
    },
  },
  mutations: {
    [Mutation.RETAIN_BUSSY_STATE](state) {
      state.count += 1;
    },
    [Mutation.RELEASE_BUSSY_STATE](state) {
      state.count -= 1;
    },
  },
};
