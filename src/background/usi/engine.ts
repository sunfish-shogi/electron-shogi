import {
  getUSIEngineOptionCurrentValue,
  USIEngineOption,
  USIEngineOptions,
  USIEngineOptionType,
  USIHash,
  USIPonder,
} from "@/common/settings/usi";
import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import path from "path";
import { createInterface as readline, Interface as Readline } from "readline";
import { USIInfoCommand } from "@/common/usi";
import { getUSILogger } from "@/background/log";

export type EngineProcessOption = {
  timeout?: number;
  engineOptions?: USIEngineOption[];
};

export type TimeState = {
  btime: number;
  wtime: number;
  byoyomi: number;
  binc: number;
  winc: number;
};

export enum GameResult {
  WIN = "win",
  LOSE = "lose",
  DRAW = "draw",
}

function parseScoreMate(arg: string): number {
  switch (arg) {
    case "+":
    case "+0":
    case "0":
      return +1;
    case "-":
    case "-0":
      return -1;
    default:
      return Number(arg);
  }
}

function parseInfoCommand(args: string): USIInfoCommand {
  const result: USIInfoCommand = {};
  const s = args.split(" ");
  for (let i = 0; i < args.length; i += 1) {
    switch (s[i]) {
      case "depth":
        result.depth = Number(s[i + 1]);
        i += 1;
        break;
      case "seldepth":
        result.seldepth = Number(s[i + 1]);
        i += 1;
        break;
      case "time":
        result.timeMs = Number(s[i + 1]);
        i += 1;
        break;
      case "nodes":
        result.nodes = Number(s[i + 1]);
        i += 1;
        break;
      case "pv":
        result.pv = s.slice(i + 1);
        i = s.length;
        break;
      case "multipv":
        result.multipv = Number(s[i + 1]);
        i += 1;
        break;
      case "score":
        switch (s[i + 1]) {
          case "cp":
            result.scoreCP = Number(s[i + 2]);
            i += 2;
            break;
          case "mate":
            result.scoreMate = parseScoreMate(s[i + 2]);
            i += 2;
            break;
        }
        break;
      case "lowerbound":
        result.lowerbound = true;
        break;
      case "upperbound":
        result.upperbound = true;
        break;
      case "currmove":
        result.currmove = s[i + 1];
        i += 1;
        break;
      case "hashfull":
        result.hashfullPerMill = Number(s[i + 1]);
        i += 1;
        break;
      case "nps":
        result.nps = Number(s[i + 1]);
        i += 1;
        break;
      case "string":
        result.string = s.slice(i + 1).join(" ");
        i = s.length;
        break;
    }
  }
  return result;
}

type ErrorCallback = (e: Error) => void;
type TimeoutCallback = () => void;
type USIOKCallback = () => void;
type ReadyCallback = () => void;
type BestmoveCallback = (
  position: string,
  move: string,
  ponder?: string
) => void;
type CheckmateCallback = (position: string, moves: string[]) => void;
type CheckmateNotImplementedCallback = () => void;
type CheckmateTimeoutCallback = (position: string) => void;
type NoMateCallback = (position: string) => void;
type InfoCallback = (position: string, info: USIInfoCommand) => void;

type ReservedGoCommand = {
  position: string;
  timeState?: TimeState;
  ponder?: boolean;
  mate?: boolean;
};

function buildTimeOptions(timeState?: TimeState): string {
  if (!timeState) {
    return "infinite";
  }
  return (
    `btime ${timeState.btime} wtime ${timeState.wtime} ` +
    (timeState.binc !== 0 || timeState.winc !== 0
      ? `binc ${timeState.binc} winc ${timeState.winc}`
      : `byoyomi ${timeState.byoyomi}`)
  );
}

enum State {
  WaitingForUSIOK = "waitingForUSIOK",
  NotReady = "notReady",
  WaitingForReadyOK = "waitingForReadyOK",
  Ready = "ready",
  WaitingForBestMove = "waitingForBestMove",
  Ponder = "ponder",
  WaitingForPonderBestMove = "waitingForPonderBestMove",
  WaitingForCheckmate = "waitingForCheckmate",
  WillQuit = "willQuit",
}

const DefaultTimeout = 10 * 1e3;

const USIHashOptionOrder = 1;
const USIPonderOptionOrder = 2;
const UserDefinedOptionOrderStart = 100;

export class EngineProcess {
  private handle: ChildProcessWithoutNullStreams | null = null;
  private _name = "NO NAME";
  private _author = "";
  private _engineOptions = {} as USIEngineOptions;
  private state = State.WaitingForUSIOK;
  private currentPosition = "";
  private reservedGoCommand?: ReservedGoCommand;
  private readline: Readline | null = null;
  private timeout?: NodeJS.Timeout;
  timeoutCallback?: TimeoutCallback;
  errorCallback?: ErrorCallback;
  usiOkCallback?: USIOKCallback;
  readyCallback?: ReadyCallback;
  bestMoveCallback?: BestmoveCallback;
  checkmateCallback?: CheckmateCallback;
  checkmateNotImplementedCallback?: CheckmateNotImplementedCallback;
  checkmateTimeoutCallback?: CheckmateTimeoutCallback;
  noMateCallback?: NoMateCallback;
  infoCallback?: InfoCallback;
  ponderInfoCallback?: InfoCallback;

  constructor(
    private _path: string,
    private sessionID: number,
    private option: EngineProcessOption
  ) {}

  get path(): string {
    return this._path;
  }

  get name(): string {
    return this._name;
  }

  get author(): string {
    return this._author;
  }

  get engineOptions(): USIEngineOptions {
    return this._engineOptions;
  }

  on(event: "timeout", callback: TimeoutCallback): this;
  on(event: "error", callback: ErrorCallback): this;
  on(event: "usiok", callback: USIOKCallback): this;
  on(event: "ready", callback: ReadyCallback): this;
  on(event: "bestmove", callback: BestmoveCallback): this;
  on(event: "checkmate", callback: CheckmateCallback): this;
  on(
    event: "checkmateNotImplemented",
    callback: CheckmateNotImplementedCallback
  ): this;
  on(event: "checkmateTimeout", callback: CheckmateTimeoutCallback): this;
  on(event: "noMate", callback: NoMateCallback): this;
  on(event: "info", callback: InfoCallback): this;
  on(event: "ponderInfo", callback: InfoCallback): this;
  on(
    event: string,
    callback:
      | TimeoutCallback
      | ErrorCallback
      | USIOKCallback
      | ReadyCallback
      | BestmoveCallback
      | CheckmateCallback
      | CheckmateNotImplementedCallback
      | CheckmateTimeoutCallback
      | NoMateCallback
      | InfoCallback
  ): this {
    switch (event) {
      case "timeout":
        this.timeoutCallback = callback as TimeoutCallback;
        break;
      case "error":
        this.errorCallback = callback as ErrorCallback;
        break;
      case "usiok":
        this.usiOkCallback = callback as USIOKCallback;
        break;
      case "ready":
        this.readyCallback = callback as ReadyCallback;
        break;
      case "bestmove":
        this.bestMoveCallback = callback as BestmoveCallback;
        break;
      case "checkmate":
        this.checkmateCallback = callback as CheckmateCallback;
        break;
      case "checkmateNotImplemented":
        this.checkmateNotImplementedCallback =
          callback as CheckmateNotImplementedCallback;
        break;
      case "checkmateTimeout":
        this.checkmateTimeoutCallback = callback as CheckmateTimeoutCallback;
        break;
      case "noMate":
        this.noMateCallback = callback as NoMateCallback;
        break;
      case "info":
        this.infoCallback = callback as InfoCallback;
        break;
      case "ponderInfo":
        this.ponderInfoCallback = callback as InfoCallback;
        break;
    }
    return this;
  }

  launch(): void {
    getUSILogger().info("sid=%d: launch: %s", this.sessionID, this.path);
    this.timeout = setTimeout(() => {
      if (this.timeoutCallback) {
        this.timeoutCallback();
      }
      this.quit();
    }, this.option.timeout || DefaultTimeout);
    this.handle = spawn(this.path, {
      cwd: path.dirname(this.path),
    });
    this.handle.on("error", (e) => {
      if (this.errorCallback) {
        this.errorCallback(e);
      }
      this.quit();
    });
    this.readline = readline(this.handle.stdout);
    this.readline.on("line", this.onReceive.bind(this));
    this.send("usi");
  }

  quit(): void {
    if (this.state === State.WillQuit) {
      return;
    }
    this.state = State.WillQuit;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    getUSILogger().info("sid=%d: quit USI engine", this.sessionID);
    if (!this.handle) {
      return;
    }
    const t = setTimeout(() => {
      if (!this.handle) {
        return;
      }
      this.handle.kill();
      this.handle = null;
    }, 5 * 1e3);
    this.handle.on("close", () => {
      clearTimeout(t);
      this.handle = null;
    });
    this.send("quit");
    if (this.readline) {
      this.readline.close();
    }
  }

  setOption(name: string, value?: string | number): void {
    if (value !== undefined) {
      this.send(`setoption name ${name} value ${value}`);
    } else {
      this.send(`setoption name ${name}`);
    }
  }

  ready(): void {
    if (this.state !== State.NotReady) {
      getUSILogger().warn(
        "sid=%d: ready: unexpected state: %s",
        this.sessionID,
        this.state
      );
      return;
    }
    this.send("isready");
    this.state = State.WaitingForReadyOK;
  }

  go(position: string, timeState?: TimeState): void {
    this.reservedGoCommand = {
      position,
      timeState,
    };
    switch (this.state) {
      case State.Ready:
        this.sendReservedGoCommands();
        break;
      case State.WaitingForBestMove:
      case State.Ponder:
      case State.WaitingForCheckmate:
        this.stop();
        break;
    }
  }

  goPonder(position: string, timeState?: TimeState): void {
    this.reservedGoCommand = {
      position,
      timeState,
      ponder: true,
    };
    switch (this.state) {
      case State.Ready:
        this.sendReservedGoCommands();
        break;
      case State.WaitingForBestMove:
      case State.Ponder:
      case State.WaitingForCheckmate:
        this.stop();
        break;
    }
  }

  goMate(position: string): void {
    this.reservedGoCommand = {
      position,
      mate: true,
    };
    switch (this.state) {
      case State.Ready:
        this.sendReservedGoCommands();
        break;
      case State.WaitingForBestMove:
      case State.Ponder:
      case State.WaitingForCheckmate:
        this.stop();
        break;
    }
  }

  ponderHit(): void {
    if (this.state !== State.Ponder) {
      getUSILogger().warn(
        "sid=%d: ponderHit: unexpected state: %s",
        this.sessionID,
        this.state
      );
      return;
    }
    this.send("ponderhit");
    this.state = State.WaitingForBestMove;
  }

  stop(): void {
    if (
      this.state !== State.WaitingForBestMove &&
      this.state !== State.Ponder &&
      this.state !== State.WaitingForCheckmate
    ) {
      getUSILogger().warn(
        "sid=%d: stop: unexpected state: %s",
        this.sessionID,
        this.state
      );
      return;
    }
    this.send("stop");
    if (this.state === State.Ponder) {
      this.state = State.WaitingForPonderBestMove;
    }
  }

  gameover(gameResult: GameResult): void {
    if (
      this.state === State.WaitingForUSIOK ||
      this.state === State.NotReady ||
      this.state === State.WaitingForReadyOK
    ) {
      getUSILogger().warn(
        "sid=%d: gameover: unexpected state: %s",
        this.sessionID,
        this.state
      );
      return;
    }
    this.send("gameover " + gameResult);
    this.state = State.NotReady;
  }

  private sendReservedGoCommands(): void {
    if (!this.reservedGoCommand) {
      return;
    }
    this.send(this.reservedGoCommand.position);
    this.send(
      "go " +
        (this.reservedGoCommand.ponder ? "ponder " : "") +
        (this.reservedGoCommand.mate ? "mate " : "") +
        buildTimeOptions(this.reservedGoCommand.timeState)
    );
    this.currentPosition = this.reservedGoCommand.position;
    this.state = this.reservedGoCommand.ponder
      ? State.Ponder
      : this.reservedGoCommand.mate
      ? State.WaitingForCheckmate
      : State.WaitingForBestMove;
    this.reservedGoCommand = undefined;
  }

  private send(command: string): void {
    if (!this.handle) {
      return;
    }
    this.handle.stdin.write(`${command}\n`);
    getUSILogger().info("sid=%d: > %s", this.sessionID, command);
  }

  private onReceive(command: string): void {
    getUSILogger().info("sid=%d: < %s", this.sessionID, command);
    if (this.state === State.WillQuit) {
      return;
    }
    if (command.startsWith("id name ")) {
      this.onIDName(command.substring(8));
    } else if (command.startsWith("id author ")) {
      this.onIDAuthor(command.substring(10));
    } else if (command.startsWith("option ")) {
      this.onOption(command.substring(7));
    } else if (command === "usiok") {
      this.onUSIOk();
    } else if (command === "readyok") {
      this.onReadyOk();
    } else if (command.startsWith("bestmove ")) {
      this.onBestMove(command.substring(9));
    } else if (command.startsWith("checkmate ")) {
      this.onCheckmate(command.substring(10));
    } else if (command.startsWith("info ")) {
      this.onInfo(command.substring(5));
    }
  }

  private onIDName(name: string): void {
    this._name = name;
  }

  private onIDAuthor(author: string): void {
    this._author = author;
  }

  private onOption(command: string): void {
    const args = command.split(" ");
    if (args.length < 4 || args[0] !== "name" || args[2] !== "type") {
      getUSILogger().error("sid=%d: invalid option command", this.sessionID);
      return;
    }
    const option: USIEngineOption = {
      name: args[1],
      type: args[3] as USIEngineOptionType,
      order:
        UserDefinedOptionOrderStart + Object.keys(this._engineOptions).length,
      vars: [],
    };
    for (let i = 4; i + 1 < args.length; i = i + 1) {
      switch (args[i]) {
        case "default":
          option.default =
            option.type === "spin" ? Number(args[i + 1]) : args[i + 1];
          break;
        case "min":
          option.min = Number(args[i + 1]);
          break;
        case "max":
          option.max = Number(args[i + 1]);
          break;
        case "var":
          option.vars.push(args[i + 1]);
          break;
      }
    }
    this._engineOptions[option.name] = option;
  }

  private onUSIOk(): void {
    if (this.state !== State.WaitingForUSIOK) {
      getUSILogger().warn(
        "sid=%d: onUSIOk: unexpected state: %s",
        this.sessionID,
        this.state
      );
      return;
    }
    if (!this.engineOptions[USIHash]) {
      this._engineOptions[USIHash] = {
        name: USIHash,
        type: "spin",
        order: USIHashOptionOrder,
        default: 32,
        vars: [],
      };
    }
    if (!this.engineOptions[USIPonder]) {
      this._engineOptions[USIPonder] = {
        name: USIPonder,
        type: "check",
        order: USIPonderOptionOrder,
        default: "true",
        vars: [],
      };
    }
    if (this.option.engineOptions) {
      this.option.engineOptions.forEach((option) => {
        const value = getUSIEngineOptionCurrentValue(option);
        if (value !== undefined) {
          this.setOption(option.name, value);
        }
      });
    }
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    this.state = State.NotReady;
    if (this.usiOkCallback) {
      this.usiOkCallback();
    }
  }

  private onReadyOk(): void {
    if (this.state !== State.WaitingForReadyOK) {
      getUSILogger().warn(
        "sid=%d: onReadyOk: unexpected state: %s",
        this.sessionID,
        this.state
      );
      return;
    }
    this.state = State.Ready;
    if (this.readyCallback) {
      this.readyCallback();
    }
    this.send("usinewgame");
    this.sendReservedGoCommands();
  }

  private onBestMove(args: string): void {
    if (
      this.state !== State.WaitingForBestMove &&
      this.state !== State.WaitingForPonderBestMove
    ) {
      getUSILogger().warn(
        "sid=%d: onBestMove: unexpected state: %s",
        this.sessionID,
        this.state
      );
      return;
    }
    if (this.bestMoveCallback && this.state === State.WaitingForBestMove) {
      const a = args.split(" ");
      const move = a[0];
      const ponder = (a.length >= 3 && a[1] === "ponder" && a[2]) || undefined;
      this.bestMoveCallback(this.currentPosition, move, ponder);
    }
    this.state = State.Ready;
    this.currentPosition = "";
    this.sendReservedGoCommands();
  }

  private onCheckmate(args: string): void {
    if (this.state !== State.WaitingForCheckmate) {
      getUSILogger().warn(
        "sid=%d: onCheckmate: unexpected state: %s",
        this.sessionID,
        this.state
      );
      return;
    }
    this.state = State.Ready;
    if (args.trim() === "notimplemented") {
      if (this.checkmateNotImplementedCallback) {
        this.checkmateNotImplementedCallback();
      }
      return;
    } else if (args.trim() === "timeout") {
      if (this.checkmateTimeoutCallback) {
        this.checkmateTimeoutCallback(this.currentPosition);
      }
      return;
    } else if (args.trim() === "nomate") {
      if (this.noMateCallback) {
        this.noMateCallback(this.currentPosition);
      }
      return;
    }
    if (this.checkmateCallback) {
      this.checkmateCallback(this.currentPosition, args.trim().split(" "));
    }
  }

  private onInfo(args: string): void {
    switch (this.state) {
      case State.WaitingForBestMove:
      case State.WaitingForCheckmate:
        if (this.infoCallback) {
          this.infoCallback(this.currentPosition, parseInfoCommand(args));
        }
        break;
      case State.Ponder:
      case State.WaitingForPonderBestMove:
        if (this.ponderInfoCallback) {
          this.ponderInfoCallback(this.currentPosition, parseInfoCommand(args));
        }
        break;
    }
  }
}
