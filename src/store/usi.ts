import { ImmutablePosition, Move } from "@/shogi";
import { InfoCommand as USIInfoCommand, USIInfoSender } from "@/usi/info";
import { Module } from "vuex";
import { State } from ".";
import { Mutation } from "./mutation";

export type USIIteration = {
  depth?: number;
  selectiveDepth?: number;
  timeMs?: number;
  score?: number;
  scoreMate?: number;
  lowerBound?: boolean;
  upperBound?: boolean;
  multiPV?: number;
  pv?: string[];
  text?: string;
};

function formatPV(position: ImmutablePosition, pv: string[]): string {
  const p = position.clone();
  let prev: Move | undefined;
  let result = "";
  for (const sfen of pv) {
    const move = p.createMoveBySFEN(sfen);
    if (!move) {
      break;
    }
    p.doMove(move, {
      ignoreValidation: true,
    });
    result += move.getDisplayText(prev);
    prev = move;
  }
  return result;
}

export class USIPlayerMonitor {
  public nodes?: number;
  public nps?: number;
  public iterates: USIIteration[];
  public hashfull?: number;
  public currentMove?: string;
  public currentMoveText?: string;

  constructor(public name: string) {
    this.iterates = [];
  }

  update(position: ImmutablePosition, update: USIInfoCommand): void {
    const iterate: USIIteration = {};
    if (update.depth !== undefined) {
      iterate.depth = update.depth;
    }
    if (update.seldepth !== undefined) {
      iterate.selectiveDepth = update.seldepth;
    }
    if (update.timeMs !== undefined) {
      iterate.timeMs = update.timeMs;
    }
    if (update.nodes !== undefined) {
      this.nodes = update.nodes;
    }
    if (update.pv) {
      iterate.pv = update.pv;
      iterate.text = formatPV(position, update.pv);
    }
    if (update.multipv !== undefined) {
      iterate.multiPV = update.multipv;
    }
    if (update.scoreCP !== undefined) {
      iterate.score = update.scoreCP;
    }
    if (update.scoreMate !== undefined) {
      iterate.scoreMate = update.scoreMate;
    }
    if (update.lowerbound !== undefined) {
      iterate.lowerBound = update.lowerbound;
    }
    if (update.upperbound !== undefined) {
      iterate.upperBound = update.upperbound;
    }
    if (update.currmove !== undefined) {
      this.currentMove = update.currmove;
      const move = position.createMoveBySFEN(update.currmove);
      if (move) {
        this.currentMoveText = move.getDisplayText();
      }
    }
    if (update.hashfullPerMill !== undefined) {
      this.hashfull = update.hashfullPerMill / 1000;
    }
    if (update.nps !== undefined) {
      this.nps = update.nps;
    }
    if (update.string) {
      iterate.text = update.string;
    }
    if (Object.keys(iterate).length !== 0) {
      this.iterates.unshift(iterate);
    }
  }
}

export type USIState = {
  sessionID?: number;
  blackPlayer?: USIPlayerMonitor;
  blackPosition?: string;
  whitePlayer?: USIPlayerMonitor;
  whitePosition?: string;
  researcher?: USIPlayerMonitor;
  researchPosition?: string;
};

export const usiState: Module<USIState, State> = {
  mutations: {
    [Mutation.UPDATE_USI_INFO](
      state,
      payload: {
        sessionID: number;
        position: ImmutablePosition;
        sender: USIInfoSender;
        name: string;
        info: USIInfoCommand;
      }
    ) {
      if (state.sessionID != payload.sessionID) {
        state.blackPlayer = undefined;
        state.whitePlayer = undefined;
        state.researcher = undefined;
        state.sessionID = payload.sessionID;
      }

      switch (payload.sender) {
        case USIInfoSender.BLACK_PLAYER:
          if (
            !state.blackPlayer ||
            state.blackPosition !== payload.position.sfen
          ) {
            state.blackPlayer = new USIPlayerMonitor(payload.name);
            state.blackPosition = payload.position.sfen;
          }
          state.blackPlayer.update(payload.position, payload.info);
          break;
        case USIInfoSender.WHITE_PLAYER:
          if (
            !state.whitePlayer ||
            state.whitePosition !== payload.position.sfen
          ) {
            state.whitePlayer = new USIPlayerMonitor(payload.name);
            state.whitePosition = payload.position.sfen;
          }
          state.whitePlayer.update(payload.position, payload.info);
          break;
        case USIInfoSender.RESEARCHER:
          if (
            !state.researcher ||
            state.researchPosition !== payload.position.sfen
          ) {
            state.researcher = new USIPlayerMonitor(payload.name);
            state.researchPosition = payload.position.sfen;
          }
          state.researcher.update(payload.position, payload.info);
          break;
      }
    },
  },
};
