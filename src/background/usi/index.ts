import { USIEngineSetting, emptyUSIEngineSetting } from "@/common/settings/usi";
import { EngineProcess, GameResult as USIGameResult, TimeState, State } from "./engine";
import * as uri from "@/common/uri";
import { GameResult } from "@/common/game/result";
import { t } from "@/common/i18n";
import { resolveEnginePath } from "@/background/usi/path";
import { getUSILogger } from "@/background/log";
import { USISessionState } from "@/common/advanced/monitor";
import { CommandHistory, CommandType, Command } from "@/common/advanced/command";
import { USIInfoCommand } from "@/common/game/usi";
import { Color, getNextColorFromUSI } from "electron-shogi-core";
import { TimeStates } from "@/common/game/time";

interface Handlers {
  onUSIBestMove(sessionID: number, usi: string, usiMove: string, ponder?: string): void;
  onUSICheckmate(sessionID: number, usi: string, usiMoves: string[]): void;
  onUSICheckmateNotImplemented(sessionID: number): void;
  onUSICheckmateTimeout(sessionID: number, usi: string): void;
  onUSINoMate(sessionID: number, usi: string): void;
  onUSIInfo(sessionID: number, usi: string, info: USIInfoCommand): void;
  onUSIPonderInfo(sessionID: number, usi: string, info: USIInfoCommand): void;
  sendPromptCommand(sessionID: number, command: Command): void;
}

let h: Handlers;

export function setHandlers(handlers: Handlers): void {
  if (h) {
    throw new Error("handlers already set");
  }
  h = handlers;
}

function newTimeoutError(timeoutSeconds: number): Error {
  return new Error(t.noResponseFromEnginePleaseExtendTimeout(timeoutSeconds));
}

export function getUSIEngineInfo(path: string, timeoutSeconds: number): Promise<USIEngineSetting> {
  const sessionID = issueSessionID();
  return new Promise<USIEngineSetting>((resolve, reject) => {
    const process = new EngineProcess(resolveEnginePath(path), sessionID, getUSILogger(), {
      timeout: timeoutSeconds * 1e3,
    })
      .on("error", reject)
      .on("timeout", () => reject(newTimeoutError(timeoutSeconds)))
      .on("usiok", () => {
        resolve({
          ...emptyUSIEngineSetting(),
          uri: uri.issueEngineURI(),
          name: process.name,
          defaultName: process.name,
          author: process.author,
          path,
          options: process.engineOptions,
        });
        process.quit();
      })
      .on("command", (command) => {
        h.sendPromptCommand(sessionID, command);
      });
    process.launch();
  });
}

export function sendSetOptionCommand(
  path: string,
  name: string,
  timeoutSeconds: number,
): Promise<void> {
  const sessionID = issueSessionID();
  return new Promise((resolve, reject) => {
    const process = new EngineProcess(resolveEnginePath(path), sessionID, getUSILogger(), {
      timeout: timeoutSeconds * 1e3,
    })
      .on("error", reject)
      .on("timeout", () => {
        reject(newTimeoutError(timeoutSeconds));
      })
      .on("usiok", () => {
        process.setOption(name);
        resolve();
        process.quit();
      })
      .on("command", (command) => {
        h.sendPromptCommand(sessionID, command);
      });
    process.launch();
  });
}

type Session = {
  process: EngineProcess;
  setting: USIEngineSetting;
  createdMs: number;
};

let lastSessionID = 0;

function issueSessionID(): number {
  lastSessionID += 1;
  return lastSessionID;
}

const sessions = new Map<number, Session>();

function isSessionExists(sessionID: number): boolean {
  return sessions.has(sessionID);
}

function getSession(sessionID: number): Session {
  const session = sessions.get(sessionID);
  if (!session) {
    throw new Error("No engine session: SessionID=" + sessionID);
  }
  return session;
}

export function setupPlayer(setting: USIEngineSetting, timeoutSeconds: number): Promise<number> {
  const sessionID = issueSessionID();
  const process = new EngineProcess(resolveEnginePath(setting.path), sessionID, getUSILogger(), {
    timeout: timeoutSeconds * 1e3,
    engineOptions: Object.values(setting.options),
    enableEarlyPonder: setting.enableEarlyPonder,
  });
  sessions.set(sessionID, {
    process,
    setting,
    createdMs: Date.now(),
  });
  return new Promise<number>((resolve, reject) => {
    process
      .on("error", reject)
      .on("timeout", () => reject(newTimeoutError(timeoutSeconds)))
      .on("bestmove", (usi, usiMove, ponder) => h.onUSIBestMove(sessionID, usi, usiMove, ponder))
      .on("checkmate", (position, moves) => {
        h.onUSICheckmate(sessionID, position, moves);
      })
      .on("checkmateNotImplemented", () => {
        h.onUSICheckmateNotImplemented(sessionID);
      })
      .on("checkmateTimeout", (position) => {
        h.onUSICheckmateTimeout(sessionID, position);
      })
      .on("noMate", (position) => {
        h.onUSINoMate(sessionID, position);
      })
      .on("usiok", () => resolve(sessionID))
      .on("command", (command) => {
        h.sendPromptCommand(sessionID, command);
      });
    process.launch();
  });
}

export function ready(sessionID: number): Promise<void> {
  const session = getSession(sessionID);
  return new Promise<void>((resolve, reject) => {
    session.process.on("ready", resolve).on("error", reject);
    const error = session.process.ready();
    if (error) {
      reject(error);
    }
  });
}

function buildTimeState(color: Color, timeStates: TimeStates): TimeState {
  const black = timeStates.black;
  const white = timeStates.white;
  const byoyomi = timeStates[color].byoyomi;
  return {
    // NOTE:
    //   USI では btime + binc (または wtime + winc) が今回利用可能な時間を表すとしている。
    //   Electron Shogi では既に加算した後の値を保持しているため、ここで減算する。
    btime: black.timeMs - black.increment * 1e3,
    wtime: white.timeMs - white.increment * 1e3,
    byoyomi: byoyomi * 1e3,
    // NOTE:
    //   USI で byoyomi と binc, winc の同時使用は認められていない。
    //   Electron Shogi では一方が秒読みでもう一方がフィッシャーという設定も可能なので、
    //   自分が秒読みの場合はそれを優先し、相手の加算時間は記述しない。
    binc: byoyomi === 0 ? black.increment * 1e3 : 0,
    winc: byoyomi === 0 ? white.increment * 1e3 : 0,
  };
}

export function go(sessionID: number, usi: string, timeStates: TimeStates): void {
  const session = getSession(sessionID);
  const nextColor = getNextColorFromUSI(usi);
  session.process.go(usi, buildTimeState(nextColor, timeStates));
  session.process.on("info", (usi, info) => h.onUSIInfo(sessionID, usi, info));
}

export function goPonder(sessionID: number, usi: string, timeStates: TimeStates): void {
  const session = getSession(sessionID);
  const nextColor = getNextColorFromUSI(usi);
  session.process.goPonder(usi, buildTimeState(nextColor, timeStates));
  session.process.on("ponderInfo", (usi, info) => {
    h.onUSIPonderInfo(sessionID, usi, info);
  });
}

export function goInfinite(sessionID: number, usi: string): void {
  const session = getSession(sessionID);
  session.process.go(usi);
  session.process.on("info", (usi, info) => h.onUSIInfo(sessionID, usi, info));
}

export function goMate(sessionID: number, usi: string): void {
  const session = getSession(sessionID);
  session.process.goMate(usi);
  session.process.on("info", (usi, info) => h.onUSIInfo(sessionID, usi, info));
}

export function ponderHit(sessionID: number, timeStates: TimeStates): void {
  const session = getSession(sessionID);
  const nextColor = getNextColorFromUSI(session.process.currentPosition);
  session.process.ponderHit(buildTimeState(nextColor, timeStates));
}

export function stop(sessionID: number): void {
  const session = getSession(sessionID);
  session.process.stop();
}

export function gameover(sessionID: number, result: GameResult): void {
  const session = getSession(sessionID);
  switch (result) {
    case GameResult.WIN:
      session.process.gameover(USIGameResult.WIN);
      break;
    case GameResult.LOSE:
      session.process.gameover(USIGameResult.LOSE);
      break;
    case GameResult.DRAW:
      session.process.gameover(USIGameResult.DRAW);
      break;
  }
}

export function quit(sessionID: number): void {
  if (!isSessionExists(sessionID)) {
    return;
  }
  const session = getSession(sessionID);
  session.process.quit();
  setTimeout(() => {
    sessions.delete(sessionID);
  }, 10e3); // remove 10 seconds later
}

export function quitAll(): void {
  sessions.forEach((session) => {
    session.process.quit();
  });
  sessions.clear();
}

export function collectSessionStates(): USISessionState[] {
  return Array.from(sessions.entries())
    .map(([id, session]) => ({
      sessionID: id,
      uri: session.setting.uri,
      name: session.setting.name,
      path: session.setting.path,
      pid: session.process.pid,
      stateCode: session.process.state,
      createdMs: session.createdMs,
      lastReceived: session.process.lastReceived,
      lastSent: session.process.lastSent,
      updatedMs: Date.now(),
      closed: session.process.state === State.WillQuit,
    }))
    .sort((a, b) => b.sessionID - a.sessionID);
}

export function getCommandHistory(sessionID: number): CommandHistory {
  const session = getSession(sessionID);
  return session.process.commandHistory;
}

export function invokeCommand(sessionID: number, type: CommandType, command: string): void {
  const session = getSession(sessionID);
  session.process.invoke(type, command);
}
