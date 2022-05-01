import { ImmutablePosition, Move } from "@/shogi";
import { InfoCommand, USIInfoSender } from "@/usi/info";

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

  update(position: ImmutablePosition, update: InfoCommand): void {
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

export class USIStore {
  private _sessionID?: number;
  private _blackPlayer?: USIPlayerMonitor;
  private _blackPosition?: string;
  private _whitePlayer?: USIPlayerMonitor;
  private _whitePosition?: string;
  private _researcher?: USIPlayerMonitor;
  private _researchPosition?: string;

  get blackPlayer(): USIPlayerMonitor | undefined {
    return this._blackPlayer;
  }

  get whitePlayer(): USIPlayerMonitor | undefined {
    return this._whitePlayer;
  }

  get researcher(): USIPlayerMonitor | undefined {
    return this._researcher;
  }

  update(
    sessionID: number,
    position: ImmutablePosition,
    sender: USIInfoSender,
    name: string,
    info: InfoCommand
  ): void {
    if (this._sessionID != sessionID) {
      this._blackPlayer = undefined;
      this._whitePlayer = undefined;
      this._researcher = undefined;
      this._sessionID = sessionID;
    }
    switch (sender) {
      case USIInfoSender.BLACK_PLAYER:
        if (!this._blackPlayer || this._blackPosition !== position.sfen) {
          this._blackPlayer = new USIPlayerMonitor(name);
          this._blackPosition = position.sfen;
        }
        this._blackPlayer.update(position, info);
        break;
      case USIInfoSender.WHITE_PLAYER:
        if (!this._whitePlayer || this._whitePosition !== position.sfen) {
          this._whitePlayer = new USIPlayerMonitor(name);
          this._whitePosition = position.sfen;
        }
        this._whitePlayer.update(position, info);
        break;
      case USIInfoSender.RESEARCHER:
        if (!this._researcher || this._researchPosition !== position.sfen) {
          this._researcher = new USIPlayerMonitor(name);
          this._researchPosition = position.sfen;
        }
        this._researcher.update(position, info);
        break;
    }
  }
}
