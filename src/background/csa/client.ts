import {
  Color,
  SpecialMoveType,
  importCSA,
  isKnownSpecialMove,
  reverseColor,
} from "electron-shogi-core";
import {
  emptyCSAGameSummary,
  CSAGameSummary,
  CSAPlayerStates,
  emptyCSAPlayerStates,
  CSAGameResult,
  CSASpecialMove,
} from "@/common/game/csa";
import { CSAProtocolVersion, CSAServerSetting } from "@/common/settings/csa";
import { Socket } from "./socket";
import { Logger } from "log4js";
import { t } from "@/common/i18n";
import { Command } from "@/common/advanced/command";
import { PromptHistory, addCommand } from "@/common/advanced/prompt";
import { CommandType } from "@/common/advanced/command";

type GameSummaryCallback = (gameSummary: CSAGameSummary) => void;
type RejectCallback = () => void;
type StartCallback = (playerStates: CSAPlayerStates) => void;
type MoveCallback = (move: string, playerStates: CSAPlayerStates) => void;
type GameResultCallback = (move: CSASpecialMove, result: CSAGameResult) => void;
type CloseCallback = () => void;
type ErrorCallback = (e: Error) => void;
type CommandCallback = (command: Command) => void;

export enum State {
  IDLE = "idle",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  WAITING_GAME_SUMMARY = "waitingGameSummary",
  GAME_SUMMARY = "gameSummary",
  GAME_TIME = "gameTime",
  GAME_POSITION = "gamePosition",
  READY = "ready",
  WAITING_START = "waitingStart",
  WAITING_REJECT = "waitingReject",
  PLAYING = "playing",
  WAITING_LOGOUT = "waitingLogout",
  WAITING_CLOSE = "waitingClose",
  CLOSED = "closed",
}

const maxCommandHistoryLength = 100;

export class Client {
  private _state: State = State.IDLE;
  private gameSummaryCallback?: GameSummaryCallback;
  private rejectCallback?: RejectCallback;
  private startCallback?: StartCallback;
  private moveCallback?: MoveCallback;
  private gameResultCallback?: GameResultCallback;
  private closeCallback?: CloseCallback;
  private errorCallback?: ErrorCallback;
  private commandCallback?: CommandCallback;
  private socket?: Socket;
  private gameSummary = emptyCSAGameSummary();
  private playerStates: CSAPlayerStates = emptyCSAPlayerStates();
  private specialMove = CSASpecialMove.UNKNOWN;
  private _lastReceived?: Command;
  private _lastSent?: Command;
  private _commandHistory: PromptHistory = {
    discarded: 0,
    commands: [],
  };
  private _createdMs: number = Date.now();
  private _loggedInMs?: number;

  constructor(
    private sessionID: number,
    private _setting: CSAServerSetting,
    private logger: Logger,
  ) {}

  get setting(): CSAServerSetting {
    return this._setting;
  }

  get state(): State {
    return this._state;
  }

  get lastReceived(): Command | undefined {
    return this._lastReceived;
  }

  get lastSent(): Command | undefined {
    return this._lastSent;
  }

  get commandHistory(): PromptHistory {
    return this._commandHistory;
  }

  get createdMs(): number {
    return this._createdMs;
  }

  get loggedInMs(): number | undefined {
    return this._loggedInMs;
  }

  on(event: "gameSummary", callback: GameSummaryCallback): this;
  on(event: "reject", callback: RejectCallback): this;
  on(event: "start", callback: StartCallback): this;
  on(event: "move", callback: MoveCallback): this;
  on(event: "gameResult", callback: GameResultCallback): this;
  on(event: "close", callback: CloseCallback): this;
  on(event: "error", callback: ErrorCallback): this;
  on(event: "command", callback: CommandCallback): this;
  on(event: string, callback: unknown): this {
    switch (event) {
      case "gameSummary":
        this.gameSummaryCallback = callback as GameSummaryCallback;
        break;
      case "reject":
        this.rejectCallback = callback as RejectCallback;
        break;
      case "start":
        this.startCallback = callback as StartCallback;
        break;
      case "move":
        this.moveCallback = callback as MoveCallback;
        break;
      case "gameResult":
        this.gameResultCallback = callback as GameResultCallback;
        break;
      case "close":
        this.closeCallback = callback as CloseCallback;
        break;
      case "error":
        this.errorCallback = callback as ErrorCallback;
        break;
      case "command":
        this.commandCallback = callback as CommandCallback;
        break;
    }
    return this;
  }

  login(): void {
    this.logger.info(
      "sid=%d: connecting to %s:%d",
      this.sessionID,
      this.setting.host,
      this.setting.port,
    );
    this._state = State.CONNECTING;
    this.socket = new Socket(this.setting.host, this.setting.port, {
      onConnect: this.onConnect.bind(this),
      onError: this.onConnectionError.bind(this),
      onFIN: this.onFIN.bind(this),
      onClose: this.onClose.bind(this),
      onRead: this.onRead.bind(this),
    });
  }

  logout(): void {
    switch (this.setting.protocolVersion) {
      case CSAProtocolVersion.V121_FLOODGATE:
        // Floodgate では LOGOUT コマンドを使用しない。
        if (this.socket) {
          this.logger.info("sid=%d: disconnect", this.sessionID);
          this.socket.end();
          this._state = State.WAITING_CLOSE;
        }
        break;
      default:
        if (
          this.state === State.WAITING_GAME_SUMMARY ||
          this.state === State.GAME_SUMMARY ||
          this.state === State.GAME_TIME ||
          this.state === State.GAME_POSITION ||
          this.state === State.READY
        ) {
          this.send("LOGOUT");
          this._state = State.WAITING_LOGOUT;
        }
        break;
    }
  }

  agree(gameID: string): void {
    if (this.state !== State.READY) {
      return;
    }
    if (gameID !== this.gameSummary.id) {
      return;
    }
    this._state = State.WAITING_START;
    this.send(`AGREE ${this.gameSummary.id}`);
  }

  reject(gameID: string): void {
    if (this.state !== State.READY) {
      return;
    }
    if (gameID !== this.gameSummary.id) {
      return;
    }
    this._state = State.WAITING_REJECT;
    this.send(`REJECT ${this.gameSummary.id}`);
  }

  doMove(move: string, score?: number, pv?: string): void {
    if (this.state !== State.PLAYING) {
      return;
    }
    let command = move;
    if (score !== undefined) {
      command += `,'* ${Math.round(score)}`;
      if (pv !== undefined) {
        command += ` ${pv}`;
      }
    }
    this.send(command);
  }

  resign(): void {
    if (this.state !== State.PLAYING) {
      return;
    }
    this.send("%TORYO");
  }

  win(): void {
    if (this.state !== State.PLAYING) {
      return;
    }
    this.send("%KACHI");
  }

  stop(): void {
    if (this.state !== State.PLAYING) {
      return;
    }
    this.send("%CHUDAN");
  }

  private send(command: string): void {
    if (!this.socket) {
      this.logger.info(
        "sid=%d: failed to send command caused by invalid socket: %s",
        this.sessionID,
        command,
      );
      return;
    }
    this.socket.write(command);
    this._lastSent = {
      type: CommandType.SEND,
      command: this.hideSecureValues(command),
      timeMs: Date.now(),
    };
    addCommand(this._commandHistory, this._lastSent, maxCommandHistoryLength);
    if (this.commandCallback) {
      this.commandCallback(this._lastSent);
    }
    this.logger.info("sid=%d: > %s", this.sessionID, this.hideSecureValues(command));
  }

  private hideSecureValues(command: string): string {
    return command.replaceAll(this.setting.password, "*****");
  }

  private onConnect(): void {
    this.logger.info("sid=%d: connected", this.sessionID);
    this._state = State.CONNECTED;
    this.send(`LOGIN ${this.setting.id} ${this.setting.password}`);
  }

  private onConnectionError(e: Error): void {
    if (this.state === State.CLOSED) {
      return;
    }
    this.onError(e);
    this._state = State.CLOSED;
    if (this.closeCallback) {
      this.closeCallback();
    }
    const command = {
      type: CommandType.SYSTEM,
      command: "connection error",
      timeMs: Date.now(),
    };
    addCommand(this._commandHistory, command, maxCommandHistoryLength);
    if (this.commandCallback) {
      this.commandCallback(command);
    }
  }

  private onError(e: Error): void {
    this.logger.info("sid=%d: error: %s %s", this.sessionID, e.name, e.message);
    if (this.errorCallback) {
      this.errorCallback(e);
    }
  }

  private onFIN(): void {
    this.logger.info("sid=%d: FIN packet received", this.sessionID);
  }

  private onClose(hadError: boolean): void {
    if (this.state === State.CLOSED) {
      return;
    }
    switch (this.state) {
      case State.WAITING_GAME_SUMMARY:
      case State.WAITING_LOGOUT:
      case State.WAITING_CLOSE:
        if (!hadError) {
          this.logger.info("sid=%d: socket closed", this.sessionID);
        } else {
          this.onError(new Error(t.errorOccuredWhileDisconnectingFromCSAServer));
        }
        break;
      case State.CONNECTING:
        this.onError(new Error(t.failedToConnectToCSAServer));
        break;
      default:
        this.onError(new Error(t.disconnectedFromCSAServer));
        break;
    }
    this._state = State.CLOSED;
    if (this.closeCallback) {
      this.closeCallback();
    }
    const command = {
      type: CommandType.SYSTEM,
      command: hadError ? "closed (error)" : "closed",
      timeMs: Date.now(),
    };
    addCommand(this._commandHistory, command, maxCommandHistoryLength);
    if (this.commandCallback) {
      this.commandCallback(command);
    }
  }

  private onRead(command: string): void {
    this._lastReceived = {
      type: CommandType.RECEIVE,
      command,
      timeMs: Date.now(),
    };
    addCommand(this._commandHistory, this._lastReceived, maxCommandHistoryLength);
    if (this.commandCallback) {
      this.commandCallback(this._lastReceived);
    }
    this.logger.info("sid=%d: < %s", this.sessionID, command);
    if (this.state === State.GAME_SUMMARY) {
      this.onGameSummary(command);
    } else if (this.state === State.GAME_TIME) {
      this.onGameTime(command);
    } else if (this.state === State.GAME_POSITION) {
      this.onGamePosition(command);
    } else if (this.state === State.PLAYING) {
      this.onMove(command);
    } else if (command.match(/^LOGIN:.* OK$/)) {
      this.onLoginOK();
    } else if (command === "LOGIN:incorrect") {
      this.onLoginIncorrect();
    } else if (command === "LOGOUT:completed") {
      this.onLogout();
    } else if (command === "BEGIN Game_Summary") {
      this.onBeginGameSummary();
    } else if (command.startsWith("REJECT:")) {
      this.onReject();
    } else if (command.startsWith("START:")) {
      this.onStart();
    } else {
      this.logger.info("sid=%d: unknown command received", this.sessionID);
    }
  }

  private onLoginOK(): void {
    this._loggedInMs = Date.now();
    this.logger.info("sid=%d: login ok", this.sessionID);
    this._state = State.WAITING_GAME_SUMMARY;
  }

  private onLoginIncorrect(): void {
    this.onError(new Error(t.csaServerLoginDenied));
    if (!this.socket) {
      return;
    }
    this.socket.end();
  }

  private onLogout(): void {
    this.logger.info("sid=%d: logout", this.sessionID);
    this._state = State.WAITING_CLOSE;
  }

  private onBeginGameSummary(): void {
    this._state = State.GAME_SUMMARY;
    this.gameSummary = emptyCSAGameSummary();
  }

  private onEndGameSummary(): void {
    // 初回分の Increment を与える。
    this.playerStates.black.time += this.gameSummary.increment;
    this.playerStates.white.time += this.gameSummary.increment;

    // 途中から再開する場合に、前回消費した時間を計算する。
    const record = importCSA(this.gameSummary.position);
    if (record instanceof Error) {
      this.onError(new Error("invalid game position received from CSA server"));
      this.logout();
      return;
    }
    for (const entry of record.moves) {
      if (isKnownSpecialMove(entry.move) && entry.move.type === SpecialMoveType.START) {
        continue;
      }
      const color = reverseColor(entry.nextColor);
      this.updateTime(color, entry.elapsedMs);
    }

    this._state = State.READY;
    if (this.gameSummaryCallback) {
      this.gameSummaryCallback(this.gameSummary);
    }
  }

  private onGameSummary(command: string): void {
    if (command === "END Game_Summary") {
      this.onEndGameSummary();
      return;
    }
    if (command === "BEGIN Time") {
      this._state = State.GAME_TIME;
      return;
    }
    if (command === "BEGIN Position") {
      this._state = State.GAME_POSITION;
      return;
    }
    const [key, value] = command.split(":", 2);
    switch (key) {
      case "Protocol_Version":
        // TODO: サポートしないバージョンならエラーにする。
        break;
      case "Protocol_Mode":
        // TODO: サポートしないモードならエラーにする。
        break;
      case "Format":
        // TODO: 知らないフォーマットならエラーにする。
        break;
      case "Declaration":
        // TODO: v1.2 では Jishogi 1.1 のみ許可されている。
        break;
      case "Rematch_On_Draw":
        // TODO: YES は v1.2 で使用できないのでエラーにする。
        break;
      case "Max_Moves":
        // TODO: USI 経由でエンジンに伝える方法がなさそう。
        break;
      case "Game_ID":
        this.gameSummary.id = value;
        break;
      case "Name+":
        this.gameSummary.blackPlayerName = value;
        break;
      case "Name-":
        this.gameSummary.whitePlayerName = value;
        break;
      case "Your_Turn":
        this.gameSummary.myColor = value === "+" ? Color.BLACK : Color.WHITE;
        break;
      case "To_Move":
        this.gameSummary.toMove = value === "+" ? Color.BLACK : Color.WHITE;
        break;
      default:
        this.logger.info("sid=%d: unknown command received", this.sessionID);
        break;
    }
  }

  private onGameTime(command: string): void {
    if (command === "END Time") {
      this._state = State.GAME_SUMMARY;
      return;
    }
    const [key, value] = command.split(":", 2);
    switch (key) {
      case "Least_Time_Per_Move":
      case "Time_Roundup":
        // do nothing
        break;
      case "Time_Unit":
        if (value.endsWith("msec")) {
          this.gameSummary.timeUnitMs = Number(value.slice(0, -4));
        } else if (value.endsWith("sec")) {
          this.gameSummary.timeUnitMs = Number(value.slice(0, -3)) * 1e3;
        } else if (value.endsWith("min")) {
          this.gameSummary.timeUnitMs = Number(value.slice(0, -3)) * 60 * 1e3;
        }
        break;
      case "Total_Time":
        this.gameSummary.totalTime = Number(value);
        this.playerStates.black.time = this.gameSummary.totalTime;
        this.playerStates.white.time = this.gameSummary.totalTime;
        break;
      case "Byoyomi":
        this.gameSummary.byoyomi = Number(value);
        break;
      case "Delay":
        this.gameSummary.delay = Number(value);
        break;
      case "Increment":
        this.gameSummary.increment = Number(value);
        break;
      default:
        this.logger.info("sid=%d: unknown command received", this.sessionID);
        break;
    }
  }

  private onGamePosition(command: string): void {
    if (command === "END Position") {
      this._state = State.GAME_SUMMARY;
      return;
    }
    this.gameSummary.position += command + "\n";
  }

  private onReject(): void {
    this._state = State.WAITING_GAME_SUMMARY;
    if (this.rejectCallback) {
      this.rejectCallback();
    }
  }

  private onStart(): void {
    this._state = State.PLAYING;
    if (this.startCallback) {
      this.startCallback(this.playerStates);
    }
  }

  private onMove(command: string): void {
    if (command.startsWith("+")) {
      this.onMoveWithColor(command, Color.BLACK);
    } else if (command.startsWith("-")) {
      this.onMoveWithColor(command, Color.WHITE);
    } else if (command.startsWith("#")) {
      this.onEndingCommand(command);
    } else if (command.startsWith("%")) {
      // noop
    } else {
      this.logger.info("sid=%d: unknown move command received", this.sessionID);
    }
  }

  private onMoveWithColor(command: string, color: Color): void {
    const parsed = /^.*,T([0-9]+)$/.exec(command);
    if (parsed) {
      const elapsed = Number(parsed[1]);
      this.updateTime(color, elapsed * 1e3);
    } else {
      this.logger.info("sid=%d: invalid move format", this.sessionID);
    }
    if (this.moveCallback) {
      this.moveCallback(command, this.playerStates);
    }
  }

  private updateTime(color: Color, elapsedMs: number): void {
    const elapsed = elapsedMs / this.gameSummary.timeUnitMs;
    const time = this.playerStates[color].time - elapsed + this.gameSummary.increment;
    this.playerStates[color].time = Math.max(time, 0);
  }

  private onEndingCommand(command: string): void {
    switch (command) {
      // 特殊な指し手
      case "#RESIGN":
        this.specialMove = CSASpecialMove.RESIGN;
        break;
      case "#SENNICHITE":
        this.specialMove = CSASpecialMove.SENNICHITE;
        break;
      case "#OUTE_SENNICHITE":
        this.specialMove = CSASpecialMove.OUTE_SENNICHITE;
        break;
      case "#ILLEGAL_MOVE":
        this.specialMove = CSASpecialMove.ILLEGAL_MOVE;
        break;
      case "#ILLEGAL_ACTION":
        this.specialMove = CSASpecialMove.ILLEGAL_ACTION;
        break;
      case "#TIME_UP":
        this.specialMove = CSASpecialMove.TIME_UP;
        break;
      case "#JISHOGI":
        this.specialMove = CSASpecialMove.JISHOGI;
        break;
      case "#MAX_MOVES":
        this.specialMove = CSASpecialMove.MAX_MOVES;
        break;

      // 対局結果
      case "#WIN":
        this.onGameResult(CSAGameResult.WIN);
        break;
      case "#LOSE":
        this.onGameResult(CSAGameResult.LOSE);
        break;
      case "#DRAW":
        this.onGameResult(CSAGameResult.DRAW);
        break;
      case "#CENSORED":
        this.onGameResult(CSAGameResult.CENSORED);
        break;
      case "#CHUDAN":
        this.onGameResult(CSAGameResult.CHUDAN);
        break;
    }
  }

  private onGameResult(gameResult: CSAGameResult) {
    this._state = State.WAITING_GAME_SUMMARY;
    if (this.gameResultCallback) {
      this.gameResultCallback(this.specialMove, gameResult);
    }
  }

  invoke(type: CommandType, command: string): void {
    switch (type) {
      case CommandType.SEND:
        this.send(command);
        break;
      case CommandType.RECEIVE:
        this.onRead(command);
        break;
    }
  }
}
