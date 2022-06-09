import { USIEngineSetting } from "@/settings/usi";
import {
  EngineProcess,
  GameResult as USIGameResult,
  TimeState,
} from "./engine";
import * as uri from "@/uri";
import { onUSIBestMove, onUSIInfo } from "@/ipc/background";
import { Color, getNextColorFromUSI } from "@/shogi";
import { USIInfoSender } from "@/store/usi";
import { GameSetting } from "@/settings/game";
import { GameResult } from "@/players/player";

export async function getUSIEngineInfo(
  path: string
): Promise<USIEngineSetting> {
  const sessionID = issueSessionID();
  return new Promise<USIEngineSetting>((resolve, reject) => {
    const engine = new EngineProcess(path, sessionID, { setupOnly: true });
    const timeoutSeconds = 10;
    const t = setTimeout(() => {
      reject(
        new Error(
          timeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
      engine.quit();
    }, timeoutSeconds * 1e3);
    engine.on("usiok", () => {
      clearTimeout(t);
      resolve({
        uri: uri.issueEngineURI(),
        name: engine.name,
        defaultName: engine.name,
        author: engine.author,
        path,
        options: engine.engineOptions,
      });
      engine.quit();
    });
    engine.launch();
  });
}

export function sendSetOptionCommand(
  path: string,
  name: string
): Promise<void> {
  const sessionID = issueSessionID();
  return new Promise((resolve, reject) => {
    const engine = new EngineProcess(path, sessionID, { setupOnly: true });
    const timeoutSeconds = 10;
    const t = setTimeout(() => {
      reject(
        new Error(
          timeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
      engine.quit();
    }, timeoutSeconds * 1e3);
    engine.on("usiok", () => {
      clearTimeout(t);
      engine.setOption(name);
      resolve();
      engine.quit();
    });
    engine.launch();
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
      engineOptions: Object.values(setting.options),
    });
    const timeoutSeconds = 10;
    const t = setTimeout(() => {
      reject(
        new Error(
          timeoutSeconds + "秒以内にエンジンから応答がありませんでした。"
        )
      );
      process.quit();
    }, timeoutSeconds * 1e3);
    players.set(sessionID, {
      name: setting.name,
      process,
      setting,
      sessionType: SessionType.GAME,
    });
    process.on("bestmove", (sfen, usi) => {
      onUSIBestMove(sessionID, usi, sfen);
    });
    process.on("ready", () => {
      clearTimeout(t);
      resolve(sessionID);
    });
    process.launch();
  });
}

export function go(
  sessionID: number,
  usi: string,
  gameSetting: GameSetting,
  blackTimeMs: number,
  whiteTimeMs: number
): void {
  // USI では btime + binc (または wtime + winc) が今回利用可能な時間を表すとしている。
  // Electron Shogi では既に加算した後の値を保持しているため、ここで減算する。
  const timeState: TimeState = {
    btime: blackTimeMs - gameSetting.timeLimit.increment * 1e3,
    wtime: whiteTimeMs - gameSetting.timeLimit.increment * 1e3,
    byoyomi: gameSetting.timeLimit.byoyomi * 1e3,
    binc: gameSetting.timeLimit.increment * 1e3,
    winc: gameSetting.timeLimit.increment * 1e3,
  };
  const player = getPlayer(sessionID);
  player.process.go(usi, timeState);
  player.process.on("info", (info, usi) => {
    const sender =
      getNextColorFromUSI(usi) === Color.BLACK
        ? USIInfoSender.BLACK_PLAYER
        : USIInfoSender.WHITE_PLAYER;
    onUSIInfo(sessionID, usi, sender, player.name, info);
  });
}

export function goInfinite(sessionID: number, usi: string): void {
  const player = getPlayer(sessionID);
  player.process.go(usi);
  player.process.on("info", (info, usi) => {
    onUSIInfo(sessionID, usi, USIInfoSender.RESEARCHER, player.name, info);
  });
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
