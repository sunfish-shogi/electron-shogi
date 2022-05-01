import { ImmutablePosition, Move } from "@/shogi";

export enum USIInfoSender {
  BLACK_PLAYER = "blackPlayer",
  WHITE_PLAYER = "whitePlayer",
  RESEARCHER = "researcher",
}

export function stringifyUSIInfoSender(sender: USIInfoSender): string {
  switch (sender) {
    case USIInfoSender.BLACK_PLAYER:
      return "先手";
    case USIInfoSender.WHITE_PLAYER:
      return "後手";
    case USIInfoSender.RESEARCHER:
      return "検討";
  }
}

export type InfoCommand = {
  depth?: number;
  seldepth?: number;
  timeMs?: number;
  nodes?: number;
  pv?: string[];
  multipv?: number;
  scoreCP?: number;
  scoreMate?: number;
  lowerbound?: boolean;
  upperbound?: boolean;
  currmove?: string;
  hashfullPerMill?: number;
  nps?: number;
  string?: string;
};

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

  constructor(public sessionID: number, public name: string) {
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

export class USIMonitor {
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
    switch (sender) {
      case USIInfoSender.BLACK_PLAYER:
        if (
          !this._blackPlayer ||
          this._blackPlayer.sessionID !== sessionID ||
          this._blackPosition !== position.sfen
        ) {
          this._blackPlayer = new USIPlayerMonitor(sessionID, name);
          this._blackPosition = position.sfen;
        }
        this._blackPlayer.update(position, info);
        this._researcher = undefined;
        break;
      case USIInfoSender.WHITE_PLAYER:
        if (
          !this._whitePlayer ||
          this._whitePlayer.sessionID !== sessionID ||
          this._whitePosition !== position.sfen
        ) {
          this._whitePlayer = new USIPlayerMonitor(sessionID, name);
          this._whitePosition = position.sfen;
        }
        this._whitePlayer.update(position, info);
        this._researcher = undefined;
        break;
      case USIInfoSender.RESEARCHER:
        if (
          !this._researcher ||
          this._researcher.sessionID !== sessionID ||
          this._researchPosition !== position.sfen
        ) {
          this._researcher = new USIPlayerMonitor(sessionID, name);
          this._researchPosition = position.sfen;
        }
        this._researcher.update(position, info);
        this._blackPlayer = undefined;
        this._whitePlayer = undefined;
        break;
    }
  }
}
