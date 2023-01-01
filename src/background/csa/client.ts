import { Color } from "@/common/shogi";
import {
  emptyCSAGameSummary,
  CSAGameSummary,
  CSAPlayerStates,
  emptyCSAPlayerStates,
  CSAGameResult,
  CSASpecialMove,
} from "@/common/csa";
import { CSAProtocolVersion, CSAServerSetting } from "@/common/settings/csa";
import { Socket } from "./socket";
import { Logger } from "log4js";

type GameSummaryCallback = (gameSummary: CSAGameSummary) => void;
type RejectCallback = () => void;
type StartCallback = (playerStates: CSAPlayerStates) => void;
type MoveCallback = (move: string, playerStates: CSAPlayerStates) => void;
type GameResultCallback = (move: CSASpecialMove, result: CSAGameResult) => void;
type CloseCallback = () => void;
type ErrorCallback = (e: Error) => void;

enum State {
  IDLE,
  CONNECTING,
  CONNECTED,
  WAITING_GAME_SUMMARY,
  GAME_SUMMARY,
  GAME_TIME,
  GAME_POSITION,
  READY,
  WAITING_START,
  WAITING_REJECT,
  PLAYING,
  WAITING_LOGOUT,
  WAITING_CLOSE,
  CLOSED,
}

export class Client {
  private state: State = State.IDLE;
  private gameSummaryCallback?: GameSummaryCallback;
  private rejectCallback?: RejectCallback;
  private startCallback?: StartCallback;
  private moveCallback?: MoveCallback;
  private gameResultCallback?: GameResultCallback;
  private closeCallback?: CloseCallback;
  private errorCallback?: ErrorCallback;
  private socket?: Socket;
  private gameSummary = emptyCSAGameSummary();
  private playerStates: CSAPlayerStates = emptyCSAPlayerStates();
  private specialMove = CSASpecialMove.UNKNOWN;

  constructor(
    private sessionID: number,
    private setting: CSAServerSetting,
    private logger: Logger
  ) {}

  on(event: "gameSummary", callback: GameSummaryCallback): void;
  on(event: "reject", callback: RejectCallback): void;
  on(event: "start", callback: StartCallback): void;
  on(event: "move", callback: MoveCallback): void;
  on(event: "gameResult", callback: GameResultCallback): void;
  on(event: "close", callback: CloseCallback): void;
  on(event: "error", callback: ErrorCallback): void;
  on(event: string, callback: unknown): void {
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
    }
  }

  login(): void {
    this.logger.info(
      "sid=%d: connecting to %s:%d",
      this.sessionID,
      this.setting.host,
      this.setting.port
    );
    this.state = State.CONNECTING;
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
          this.state = State.WAITING_CLOSE;
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
          this.state = State.WAITING_LOGOUT;
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
    this.state = State.WAITING_START;
    this.send(`AGREE ${this.gameSummary.id}`);
  }

  reject(gameID: string): void {
    if (this.state !== State.READY) {
      return;
    }
    if (gameID !== this.gameSummary.id) {
      return;
    }
    this.state = State.WAITING_REJECT;
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
        command
      );
      return;
    }
    this.logger.info(
      "sid=%d: > %s",
      this.sessionID,
      this.hideSecureValues(command)
    );
    this.socket.write(command);
  }

  private hideSecureValues(command: string): string {
    return command.replaceAll(this.setting.password, "*****");
  }

  private onConnect(): void {
    this.logger.info("sid=%d: connected", this.sessionID);
    this.state = State.CONNECTED;
    this.send(`LOGIN ${this.setting.id} ${this.setting.password}`);
  }

  private onConnectionError(e: Error): void {
    if (this.state === State.CLOSED) {
      return;
    }
    this.onError(e);
    this.state = State.CLOSED;
    if (this.closeCallback) {
      this.closeCallback();
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
          this.onError(
            new Error("CSAサーバーからの切断中にエラーが発生しました。")
          );
        }
        break;
      case State.CONNECTING:
        this.onError(new Error("CSAサーバーへ接続できませんでした。"));
        break;
      default:
        this.onError(new Error("CSAサーバーへの接続が切れました。"));
        break;
    }
    this.state = State.CLOSED;
    if (this.closeCallback) {
      this.closeCallback();
    }
  }

  private onRead(command: string): void {
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
    this.logger.info("sid=%d: login ok", this.sessionID);
    this.state = State.WAITING_GAME_SUMMARY;
  }

  private onLoginIncorrect(): void {
    this.onError(new Error("CSAサーバーへのログインが拒否されました。"));
    if (!this.socket) {
      return;
    }
    this.socket.end();
  }

  private onLogout(): void {
    this.logger.info("sid=%d: logout", this.sessionID);
    this.state = State.WAITING_CLOSE;
  }

  private onBeginGameSummary(): void {
    this.state = State.GAME_SUMMARY;
    this.gameSummary = emptyCSAGameSummary();
  }

  private onGameSummary(command: string): void {
    if (command === "END Game_Summary") {
      this.state = State.READY;
      if (this.gameSummaryCallback) {
        this.gameSummaryCallback(this.gameSummary);
      }
      return;
    }
    if (command === "BEGIN Time") {
      this.state = State.GAME_TIME;
      return;
    }
    if (command === "BEGIN Position") {
      this.state = State.GAME_POSITION;
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
      this.state = State.GAME_SUMMARY;
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
      this.state = State.GAME_SUMMARY;
      return;
    }
    this.gameSummary.position += command + "\n";
  }

  private onReject(): void {
    this.state = State.WAITING_GAME_SUMMARY;
    if (this.rejectCallback) {
      this.rejectCallback();
    }
  }

  private onStart(): void {
    this.state = State.PLAYING;
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
      const time =
        this.playerStates[color].time - elapsed + this.gameSummary.increment;
      this.playerStates[color].time = Math.max(time, 0);
    } else {
      this.logger.info("sid=%d: invalid move format", this.sessionID);
    }
    if (this.moveCallback) {
      this.moveCallback(command, this.playerStates);
    }
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
    this.state = State.WAITING_GAME_SUMMARY;
    if (this.gameResultCallback) {
      this.gameResultCallback(this.specialMove, gameResult);
    }
  }
}
