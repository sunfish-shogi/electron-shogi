import {
  getUSIEngineOptionCurrentValue,
  USIEngineOption,
  USIEngineOptions,
  USIEngineOptionType,
  USIHash,
  USIPonder,
} from "@/common/settings/usi";
import { Logger } from "log4js";
import { SCORE_MATE_INFINITE, USIInfoCommand } from "@/common/usi";
import { ChildProcess } from "./process";

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
      return +SCORE_MATE_INFINITE;
    case "-":
    case "-0":
      return -SCORE_MATE_INFINITE;
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
type BestmoveCallback = (position: string, move: string, ponder?: string) => void;
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
const DefaultQuitTimeout = 5 * 1e3;

const USIHashOptionOrder = 1;
const USIPonderOptionOrder = 2;
const UserDefinedOptionOrderStart = 100;

export class EngineProcess {
  private process: ChildProcess | null = null;
  private _name = "NO NAME";
  private _author = "";
  private _engineOptions = {} as USIEngineOptions;
  private state = State.WaitingForUSIOK;
  private currentPosition = "";
  private invalidBestMoveCount = 0;
  private reservedGoCommand?: ReservedGoCommand;
  private launchTimeout?: NodeJS.Timeout;
  private quitTimeout?: NodeJS.Timeout;
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
    private logger: Logger,
    private option: EngineProcessOption,
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
  on(event: "checkmateNotImplemented", callback: CheckmateNotImplementedCallback): this;
  on(event: "checkmateTimeout", callback: CheckmateTimeoutCallback): this;
  on(event: "noMate", callback: NoMateCallback): this;
  on(event: "info", callback: InfoCallback): this;
  on(event: "ponderInfo", callback: InfoCallback): this;
  on(event: string, callback: unknown): this {
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
        this.checkmateNotImplementedCallback = callback as CheckmateNotImplementedCallback;
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
    this.logger.info("sid=%d: launch: %s", this.sessionID, this.path);
    this.setLaunchTimeout();
    this.process = new ChildProcess(this.path);
    this.process.on("error", this.onError.bind(this));
    this.process.on("close", this.onClose.bind(this));
    this.process.on("receive", this.onReceive.bind(this));
    this.send("usi");
  }

  quit(): void {
    if (this.state === State.WillQuit) {
      return;
    }
    this.state = State.WillQuit;
    this.clearLaunchTimeout();
    this.logger.info("sid=%d: quit USI engine", this.sessionID);
    if (!this.process) {
      return;
    }
    this.setQuitTimeout();
    this.send("quit");
  }

  setOption(name: string, value?: string | number): void {
    if (value !== undefined) {
      this.send(`setoption name ${name} value ${value}`);
    } else {
      this.send(`setoption name ${name}`);
    }
  }

  ready(): Error | undefined {
    // ゲームを終了するには通常 gameover が送られるが、通信対局の異常時には gameover が呼ばれない場合がある。
    // ゲームを正常終了せずに ready 関数を呼ぶことを許容し、ここで必要に応じて gameover を送信する。
    if (this.state === State.WaitingForReadyOK) {
      // 既に isready を送っているので readyok を待つ。
      return;
    } else if (
      this.state === State.Ready ||
      this.state === State.WaitingForBestMove ||
      this.state === State.Ponder ||
      this.state === State.WaitingForPonderBestMove ||
      this.state === State.WaitingForCheckmate
    ) {
      // CSA サーバーから REJECT された場合や通信エラーの場合に勝ち負けは必ずしも判断できないので DRAW として扱う。
      this.gameover(GameResult.DRAW);
    }

    if (this.state !== State.NotReady) {
      this.logger.warn("sid=%d: ready: unexpected state: %s", this.sessionID, this.state);
      return new Error("unexpected state");
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
      this.logger.warn("sid=%d: ponderHit: unexpected state: %s", this.sessionID, this.state);
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
      this.logger.warn("sid=%d: stop: unexpected state: %s", this.sessionID, this.state);
      return;
    }
    if (this.process?.lastSended === "stop") {
      // stop コマンドは連続して送信しない。
      return;
    }
    this.send("stop");
    if (this.state === State.Ponder) {
      this.state = State.WaitingForPonderBestMove;
    }
  }

  gameover(gameResult: GameResult): void {
    switch (this.state) {
      case State.WaitingForUSIOK:
      case State.NotReady:
      case State.WaitingForReadyOK:
      case State.WillQuit:
        this.logger.warn("sid=%d: gameover: unexpected state: %s", this.sessionID, this.state);
        return;
      case State.WaitingForBestMove:
      case State.Ponder:
        // ゲームを終了するので思考を中断する。
        this.stop();
        // bestmove を待たずにゲームを終了するので、次に来た bestmove を無視する。
        this.invalidBestMoveCount++;
        break;
      case State.WaitingForPonderBestMove:
        // bestmove を待たずにゲームを終了するので、次に来た bestmove を無視する。
        this.invalidBestMoveCount++;
        break;
      case State.WaitingForCheckmate:
        // ゲームを終了するので思考を中断する。
        this.stop();
        break;
      case State.Ready:
        // do nothing
        break;
    }
    this.send("gameover " + gameResult);
    this.state = State.NotReady;
    this.reservedGoCommand = undefined;
  }

  private setLaunchTimeout(): void {
    this.launchTimeout = setTimeout(() => {
      if (this.timeoutCallback) {
        this.timeoutCallback();
      }
      this.quit();
    }, this.option.timeout || DefaultTimeout);
  }

  private clearLaunchTimeout(): void {
    if (this.launchTimeout) {
      clearTimeout(this.launchTimeout);
      this.launchTimeout = undefined;
    }
  }

  private setQuitTimeout(): void {
    this.quitTimeout = setTimeout(() => {
      if (!this.process) {
        return;
      }
      this.process.kill();
      this.process = null;
    }, DefaultQuitTimeout);
  }

  private clearQuitTimeout(): void {
    if (this.quitTimeout) {
      clearTimeout(this.quitTimeout);
      this.quitTimeout = undefined;
    }
  }

  private onError(e: Error): void {
    if (this.errorCallback) {
      this.errorCallback(e);
    }
    this.quit();
  }

  private onClose(code: number | null, signal: NodeJS.Signals | null): void {
    this.logger.info(
      "sid=%d: engine process closed: close=%s signal=%s",
      this.sessionID,
      code,
      signal,
    );
    if (this.state !== State.WillQuit && this.errorCallback) {
      this.errorCallback(new Error("closed unexpectedly"));
    }
    this.clearLaunchTimeout();
    this.clearQuitTimeout();
    this.process = null;
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
        buildTimeOptions(this.reservedGoCommand.timeState),
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
    if (!this.process) {
      return;
    }
    this.process.send(command);
    this.logger.info("sid=%d: > %s", this.sessionID, command);
  }

  private onReceive(command: string): void {
    this.logger.info("sid=%d: < %s", this.sessionID, command);
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
      this.logger.error("sid=%d: invalid option command", this.sessionID);
      return;
    }
    const option: USIEngineOption = {
      name: args[1],
      type: args[3] as USIEngineOptionType,
      order: UserDefinedOptionOrderStart + Object.keys(this._engineOptions).length,
      vars: [],
    };
    for (let i = 4; i + 1 < args.length; i = i + 1) {
      switch (args[i]) {
        case "default":
          option.default = option.type === "spin" ? Number(args[i + 1]) : args[i + 1];
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
      this.logger.warn("sid=%d: onUSIOk: unexpected state: %s", this.sessionID, this.state);
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
    this.clearLaunchTimeout();
    this.state = State.NotReady;
    if (this.usiOkCallback) {
      this.usiOkCallback();
    }
  }

  private onReadyOk(): void {
    if (this.state !== State.WaitingForReadyOK) {
      this.logger.warn("sid=%d: onReadyOk: unexpected state: %s", this.sessionID, this.state);
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
    if (this.invalidBestMoveCount > 0) {
      // 前回の終局までに受け取れなかった bestmove を無視する。
      this.invalidBestMoveCount--;
      this.logger.warn("sid=%d: onBestMove: ignore bestmove: %s", this.sessionID, args);
      return;
    }
    if (this.state !== State.WaitingForBestMove && this.state !== State.WaitingForPonderBestMove) {
      this.logger.warn("sid=%d: onBestMove: unexpected state: %s", this.sessionID, this.state);
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
      this.logger.warn("sid=%d: onCheckmate: unexpected state: %s", this.sessionID, this.state);
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
