import { USIInfoCommand, USIInfoSender } from "@/ipc/usi";
import { ImmutablePosition, Move, Position } from "@/shogi";

export type USIIteration = {
  position: string;
  depth?: number;
  selectiveDepth?: number;
  timeMs?: number;
  nodes?: number;
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
  for (const usiMove of pv) {
    const move = p.createMoveByUSI(usiMove);
    if (!move) {
      break;
    }
    p.doMove(move, {
      ignoreValidation: true,
    });
    result += move.getDisplayText({ prev });
    prev = move;
  }
  return result;
}

export class USIPlayerMonitor {
  public nodes?: number;
  public nps?: number;
  public iterates: USIIteration[] = [];
  public hashfull?: number;
  public currentMove?: string;
  public currentMoveText?: string;
  public ponderMove?: string;

  constructor(
    public sessionID: number,
    public name: string,
    public sfen: string
  ) {}

  get latestIteration(): USIIteration[] {
    const result: USIIteration[] = [];
    const multiPVSet = new Set();
    const moveSet = new Set();
    for (const iterate of this.iterates) {
      const move = iterate.pv ? iterate.pv[0] : undefined;
      if (!multiPVSet.has(iterate.multiPV) && !moveSet.has(move)) {
        result.push(iterate);
        multiPVSet.add(iterate.multiPV);
        moveSet.add(move);
      }
    }
    return result.sort((a, b) => {
      return (a.multiPV || 1) - (b.multiPV || 1);
    });
  }

  update(sfen: string, update: USIInfoCommand, ponderMove?: Move): void {
    const position = Position.newBySFEN(sfen);
    const iterate: USIIteration = {
      position: sfen,
    };
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
      iterate.text = position ? formatPV(position, update.pv) : "";
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
      const move = position && position.createMoveByUSI(update.currmove);
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
      // USI プロトコルにおいて nodes は読み筋と関係なく定期的に送る事ができるとされている。
      // ただ、多くのエンジンが読み筋と一緒に送ってくるため読み筋等がある場合にはそちらにも記録する。
      if (update.nodes !== undefined) {
        iterate.nodes = update.nodes;
      }
      this.iterates.unshift(iterate);
    }
    this.ponderMove = ponderMove?.getDisplayText();
  }
}

type USIUpdate = {
  sessionID: number;
  sfen: string;
  sender: USIInfoSender;
  name: string;
  info: USIInfoCommand;
  ponderMove?: Move;
};

export class USIMonitor {
  private _blackPlayer?: USIPlayerMonitor;
  private _whitePlayer?: USIPlayerMonitor;
  private _researcher?: USIPlayerMonitor;
  private updateQueue: USIUpdate[] = [];
  private timeoutHandle?: number;

  get blackPlayer(): USIPlayerMonitor | undefined {
    return this._blackPlayer;
  }

  get whitePlayer(): USIPlayerMonitor | undefined {
    return this._whitePlayer;
  }

  get researcher(): USIPlayerMonitor | undefined {
    return this._researcher;
  }

  clear(): void {
    this._blackPlayer = undefined;
    this._whitePlayer = undefined;
    this._researcher = undefined;
    this.updateQueue = [];
  }

  update(
    sessionID: number,
    position: ImmutablePosition,
    sender: USIInfoSender,
    name: string,
    info: USIInfoCommand,
    ponderMove?: Move
  ): void {
    this.updateQueue.push({
      sessionID,
      sfen: position.sfen,
      sender,
      name,
      info,
      ponderMove,
    });
    // 高頻度でコマンドが送られてくると描画が追いつかないので、一定時間ごとに反映する。
    if (!this.timeoutHandle) {
      this.timeoutHandle = window.setTimeout(() => {
        this.dequeue();
      }, 500);
    }
  }

  private dequeue() {
    for (const update of this.updateQueue) {
      this._update(update);
    }
    this.updateQueue = [];
    this.timeoutHandle = undefined;
  }

  private _update(update: USIUpdate) {
    switch (update.sender) {
      case USIInfoSender.BLACK_PLAYER:
        if (
          !this._blackPlayer ||
          this._blackPlayer.sessionID !== update.sessionID ||
          this._blackPlayer.sfen !== update.sfen
        ) {
          this._blackPlayer = new USIPlayerMonitor(
            update.sessionID,
            update.name,
            update.sfen
          );
        }
        this._blackPlayer.update(update.sfen, update.info, update.ponderMove);
        this._researcher = undefined;
        break;
      case USIInfoSender.WHITE_PLAYER:
        if (
          !this._whitePlayer ||
          this._whitePlayer.sessionID !== update.sessionID ||
          this._whitePlayer.sfen !== update.sfen
        ) {
          this._whitePlayer = new USIPlayerMonitor(
            update.sessionID,
            update.name,
            update.sfen
          );
        }
        this._whitePlayer.update(update.sfen, update.info, update.ponderMove);
        this._researcher = undefined;
        break;
      case USIInfoSender.RESEARCHER:
        if (
          !this._researcher ||
          this._researcher.sessionID !== update.sessionID ||
          this._researcher.sfen !== update.sfen
        ) {
          this._researcher = new USIPlayerMonitor(
            update.sessionID,
            update.name,
            update.sfen
          );
        }
        this._researcher.update(update.sfen, update.info);
        this._blackPlayer = undefined;
        this._whitePlayer = undefined;
        break;
    }
  }
}
