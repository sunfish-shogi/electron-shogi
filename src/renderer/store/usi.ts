import { USIInfoCommand } from "@/common/usi";
import { ImmutablePosition, Move, Position } from "@/common/shogi";

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
  public sfen = "";
  public nodes?: number;
  public nps?: number;
  public iterates: USIIteration[] = [];
  public hashfull?: number;
  public currentMove?: string;
  public currentMoveText?: string;
  public ponderMove?: string;

  constructor(public sessionID: number, public name: string) {}

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
    if (this.sfen !== sfen) {
      this.sfen = sfen;
      this.nodes = undefined;
      this.nps = undefined;
      this.iterates = [];
      this.hashfull = undefined;
      this.currentMove = undefined;
      this.currentMoveText = undefined;
      this.ponderMove = undefined;
    }
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
  name: string;
  info: USIInfoCommand;
  ponderMove?: Move;
};

export class USIMonitor {
  private _sessions: USIPlayerMonitor[] = [];
  private updateQueue: USIUpdate[] = [];
  private timeoutHandle?: number;

  get sessions(): USIPlayerMonitor[] {
    return this._sessions;
  }

  clear(): void {
    this._sessions = [];
    this.updateQueue = [];
    if (this.timeoutHandle) {
      window.clearTimeout(this.timeoutHandle);
      this.timeoutHandle = undefined;
    }
  }

  update(
    sessionID: number,
    position: ImmutablePosition,
    name: string,
    info: USIInfoCommand,
    ponderMove?: Move
  ): void {
    this.updateQueue.push({
      sessionID,
      sfen: position.sfen,
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
    let monitor = this._sessions.find(
      (session) => session.sessionID === update.sessionID
    );
    if (!monitor) {
      monitor = this.addSession(update.sessionID, update.name);
    }
    monitor.update(update.sfen, update.info, update.ponderMove);
  }

  private addSession(sessionID: number, name: string): USIPlayerMonitor {
    const monitor = new USIPlayerMonitor(sessionID, name);
    this.sessions.push(monitor);
    this.sessions.sort((a, b) => {
      return a.sessionID - b.sessionID;
    });
    return monitor;
  }
}
