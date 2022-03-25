import { ImmutablePosition, Move } from "@/shogi";
import { InfoCommand as USIInfoCommand, USIInfoSender } from "@/usi/info";

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
    p.doMove(move);
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

  constructor() {
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

export class USIMonitor {
  sessionID?: number;
  blackPlayer?: USIPlayerMonitor;
  blackPosition?: string;
  whitePlayer?: USIPlayerMonitor;
  whitePosition?: string;
  researcher?: USIPlayerMonitor;
  researchPosition?: string;

  update(
    sessionID: number,
    position: ImmutablePosition,
    sender: USIInfoSender,
    update: USIInfoCommand
  ): void {
    if (this.sessionID != sessionID) {
      this.blackPlayer = undefined;
      this.whitePlayer = undefined;
      this.researcher = undefined;
      this.sessionID = sessionID;
    }

    switch (sender) {
      case USIInfoSender.BLACK_PLAYER:
        if (!this.blackPlayer || this.blackPosition !== position.sfen) {
          this.blackPlayer = new USIPlayerMonitor();
          this.blackPosition = position.sfen;
        }
        this.blackPlayer.update(position, update);
        break;
      case USIInfoSender.WHITE_PLAYER:
        if (!this.whitePlayer || this.whitePosition !== position.sfen) {
          this.whitePlayer = new USIPlayerMonitor();
          this.whitePosition = position.sfen;
        }
        this.whitePlayer.update(position, update);
        break;
      case USIInfoSender.RESEARCHER:
        if (!this.researcher || this.researchPosition !== position.sfen) {
          this.researcher = new USIPlayerMonitor();
          this.researchPosition = position.sfen;
        }
        this.researcher.update(position, update);
        break;
    }
  }
}
