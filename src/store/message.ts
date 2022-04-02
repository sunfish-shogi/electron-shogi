import { Module } from "vuex";
import { State } from ".";
import { Mutation } from "./mutation";

export type MessageState = {
  queue: string[];
};

export const messageState: Module<MessageState, State> = {
  state: {
    queue: [],
  },
  getters: {
    hasMessage(state): boolean {
      return state.queue.length !== 0;
    },
    message(state): string {
      return state.queue[0];
    },
  },
  mutations: {
    [Mutation.PUSH_MESSAGE](state, message: string) {
      state.queue.push(message);
    },
    [Mutation.SHIFT_MESSAGE](state) {
      state.queue.shift();
    },
  },
};
