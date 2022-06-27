import { USIEngineSetting } from "@/settings/usi";
import {
  EngineProcess,
  GameResult as USIGameResult,
  TimeState,
} from "./engine";
import * as uri from "@/uri";
import { onUSIBestMove, onUSIInfo, onUSIPonderInfo } from "@/ipc/background";
import { Color, getNextColorFromUSI } from "@/shogi";
import { USIInfoSender } from "@/store/usi";
import { GameSetting } from "@/settings/game";
import { GameResult } from "@/players/player";

const TimeoutSeconds = 10;

export async function getUSIEngineInfo(
  path: string
): Promise<USIEngineSetting> {
  const sessionID = issueSessionID();
  return new Promise<USIEngineSetting>((resolve, reject) => {
    const process = new EngineProcess(path, sessionID, {
      setupOnly: true,
      timeout: TimeoutSeconds * 1e3,
    });
    process.on("error", (e) => {
      reject(e);
    });
    process.on("timeout", () => {
      reject(
        new Error(
          TimeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
    });
    process.on("usiok", () => {
      resolve({
        uri: uri.issueEngineURI(),
        name: process.name,
        defaultName: process.name,
        author: process.author,
        path,
        options: process.engineOptions,
      });
      process.quit();
    });
    process.launch();
  });
}

export function sendSetOptionCommand(
  path: string,
  name: string
): Promise<void> {
  const sessionID = issueSessionID();
  return new Promise((resolve, reject) => {
    const process = new EngineProcess(path, sessionID, {
      setupOnly: true,
      timeout: TimeoutSeconds * 1e3,
    });
    process.on("error", (e) => {
      reject(e);
    });
    process.on("timeout", () => {
      reject(
        new Error(
          TimeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
    });
    process.on("usiok", () => {
      process.setOption(name);
      resolve();
      process.quit();
    });
    process.launch();
  });
}

enum SessionType {
  GAME,
  RESEARCH,
}

type Player = {
  name: string;
  process: EngineProcess;
  setting: USIEngineSetting;
  sessionType: SessionType;
};

let lastSessionID = 0;

function issueSessionID(): number {
  lastSessionID += 1;
  return lastSessionID;
}

const players = new Map<number, Player>();

function getPlayer(sessionID: number): Player {
  const player = players.get(sessionID);
  if (!player) {
    throw new Error(
      "エンジンのセッションが見つかりません: SessionID=" + sessionID
    );
  }
  return player;
}

export function setupPlayer(setting: USIEngineSetting): Promise<number> {
  const sessionID = issueSessionID();
  return new Promise<number>((resolve, reject) => {
    const process = new EngineProcess(setting.path, sessionID, {
      timeout: TimeoutSeconds * 1e3,
      engineOptions: Object.values(setting.options),
    });
    process.on("error", (e) => {
      reject(e);
    });
    process.on("timeout", () => {
      reject(
        new Error(
          TimeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
    });
    players.set(sessionID, {
      name: setting.name,
      process,
      setting,
      sessionType: SessionType.GAME,
    });
    process.on("bestmove", (usi, sfen, ponder) => {
      onUSIBestMove(sessionID, usi, sfen, ponder);
    });
    process.on("ready", () => {
      resolve(sessionID);
    });
    process.launch();
  });
}

function buildTimeState(
  gameSetting: GameSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): TimeState {
  // USI では btime + binc (または wtime + winc) が今回利用可能な時間を表すとしている。
  // Electron Shogi では既に加算した後の値を保持しているため、ここで減算する。
  return {
    btime: blackTimeMs - gameSetting.timeLimit.increment * 1e3,
    wtime: whiteTimeMs - gameSetting.timeLimit.increment * 1e3,
    byoyomi: gameSetting.timeLimit.byoyomi * 1e3,
    binc: gameSetting.timeLimit.increment * 1e3,
    winc: gameSetting.timeLimit.increment * 1e3,
  };
}

export function go(
  sessionID: number,
  usi: string,
  gameSetting: GameSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): void {
  const player = getPlayer(sessionID);
  player.process.go(usi, buildTimeState(gameSetting, blackTimeMs, whiteTimeMs));
  player.process.on("info", (usi, info) => {
    const sender =
      getNextColorFromUSI(usi) === Color.BLACK
        ? USIInfoSender.BLACK_PLAYER
        : USIInfoSender.WHITE_PLAYER;
    onUSIInfo(sessionID, usi, sender, player.name, info);
  });
}

export function goPonder(
  sessionID: number,
  usi: string,
  gameSetting: GameSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): void {
  const player = getPlayer(sessionID);
  player.process.goPonder(
    usi,
    buildTimeState(gameSetting, blackTimeMs, whiteTimeMs)
  );
  player.process.on("ponderInfo", (usi, info) => {
    const sender =
      getNextColorFromUSI(usi) === Color.BLACK
        ? USIInfoSender.BLACK_PLAYER
        : USIInfoSender.WHITE_PLAYER;
    onUSIPonderInfo(sessionID, usi, sender, player.name, info);
  });
}

export function goInfinite(sessionID: number, usi: string): void {
  const player = getPlayer(sessionID);
  player.process.go(usi);
  player.process.on("info", (usi, info) => {
    onUSIInfo(sessionID, usi, USIInfoSender.RESEARCHER, player.name, info);
  });
}

export function ponderHit(sessionID: number): void {
  const player = getPlayer(sessionID);
  player.process.ponderHit();
}

export function stop(sessionID: number): void {
  const player = getPlayer(sessionID);
  player.process.stop();
}

export function gameover(sessionID: number, result: GameResult): void {
  const player = getPlayer(sessionID);
  switch (result) {
    case GameResult.WIN:
      player.process.gameover(USIGameResult.WIN);
      break;
    case GameResult.LOSE:
      player.process.gameover(USIGameResult.LOSE);
      break;
    case GameResult.DRAW:
      player.process.gameover(USIGameResult.DRAW);
      break;
  }
}

export function quit(sessionID: number): void {
  const player = getPlayer(sessionID);
  player.process.quit();
  players.delete(sessionID);
}

export function quitAll(): void {
  players.forEach((player) => {
    player.process.quit();
  });
  players.clear();
}
