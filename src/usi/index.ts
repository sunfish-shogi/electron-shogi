import { onUSIBestMove, onUSIInfo } from "@/ipc/background";
import { USIEngineSetting } from "@/settings/usi";
import { GameSetting } from "@/settings/game";
import { Color } from "@/shogi";
import { getNextColorFromUSI } from "@/shogi";
import { EngineProcess, GameResult, TimeState } from "./engine";
import { SpecialMove } from "@/shogi/record";
import { USIInfoSender } from "./info";
import { ResearchSetting } from "@/settings/research";
import * as uri from "@/uri";

export async function getUSIEngineInfo(
  path: string
): Promise<USIEngineSetting> {
  return new Promise<USIEngineSetting>((resolve, reject) => {
    const engine = new EngineProcess(path, { setupOnly: true });
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
  return new Promise((resolve, reject) => {
    const engine = new EngineProcess(path, { setupOnly: true });
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

type Player = { process: EngineProcess; setting: USIEngineSetting };

const players: {
  black: Player | undefined;
  white: Player | undefined;
  research: Player | undefined;
} = {
  black: undefined,
  white: undefined,
  research: undefined,
};

function setupPlayer(
  sessionID: number,
  color: Color,
  setting: USIEngineSetting
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const process = new EngineProcess(setting.path, {
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
    players[color] = { process, setting };
    process.on("bestmove", (sfen, usi) => {
      onUSIBestMove(sessionID, usi, color, sfen);
    });
    process.on("ready", () => {
      clearTimeout(t);
      resolve();
    });
    process.on("info", (info, usi) => {
      onUSIInfo(
        sessionID,
        usi,
        color == Color.BLACK
          ? USIInfoSender.BLACK_PLAYER
          : USIInfoSender.WHITE_PLAYER,
        setting.name,
        info
      );
    });
    process.launch();
  });
}

export async function startGame(
  sessionID: number,
  gameSetting: GameSetting
): Promise<void> {
  endGame();
  const p: Promise<void>[] = [];
  if (uri.isUSIEngine(gameSetting.black.uri)) {
    const setting = gameSetting.black.usi as USIEngineSetting;
    p.push(setupPlayer(sessionID, Color.BLACK, setting));
  }
  if (uri.isUSIEngine(gameSetting.white.uri)) {
    const setting = gameSetting.white.usi as USIEngineSetting;
    p.push(setupPlayer(sessionID, Color.WHITE, setting));
  }
  await Promise.all(p);
}

function gameResult(
  color: Color,
  usi: string,
  specialMove: SpecialMove
): GameResult | null {
  const currentColor = getNextColorFromUSI(usi);
  switch (specialMove) {
    case SpecialMove.FOUL_WIN:
    case SpecialMove.ENTERING_OF_KING:
      return currentColor == color ? GameResult.WIN : GameResult.LOSE;
    case SpecialMove.RESIGN:
    case SpecialMove.MATE:
    case SpecialMove.TIMEOUT:
    case SpecialMove.FOUL_LOSE:
      return currentColor == color ? GameResult.LOSE : GameResult.WIN;
    case SpecialMove.DRAW:
    case SpecialMove.REPETITION_DRAW:
      return GameResult.DRAW;
  }
  return null;
}

export function endGame(usi?: string, specialMove?: SpecialMove): void {
  if (players.black) {
    const result =
      usi && specialMove ? gameResult(Color.BLACK, usi, specialMove) : null;
    if (result) {
      players.black.process.gameover(result);
    }
    players.black.process.quit();
    players.black = undefined;
  }
  if (players.white) {
    const result =
      usi && specialMove ? gameResult(Color.WHITE, usi, specialMove) : null;
    if (result) {
      players.white.process.gameover(result);
    }
    players.white.process.quit();
    players.white = undefined;
  }
}

function setupResearcher(
  sessionID: number,
  setting: USIEngineSetting
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const process = new EngineProcess(setting.path, {
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
    players.research = { process, setting };
    process.on("ready", () => {
      clearTimeout(t);
      resolve();
    });
    process.on("info", (info, usi) => {
      onUSIInfo(sessionID, usi, USIInfoSender.RESEARCHER, setting.name, info);
    });
    process.launch();
  });
}

export async function startResearch(
  sessionID: number,
  researchSetting: ResearchSetting
): Promise<void> {
  endResearch();
  if (researchSetting.usi) {
    await setupResearcher(sessionID, researchSetting.usi);
  }
}

export function endResearch(): void {
  if (players.research) {
    players.research.process.quit();
    players.research = undefined;
  }
}

export function updatePosition(
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
  const color = getNextColorFromUSI(usi);
  switch (color) {
    case Color.BLACK:
      if (players.black) {
        players.black.process.go(usi, timeState);
      }
      break;
    case Color.WHITE:
      if (players.white) {
        players.white.process.go(usi, timeState);
      }
      break;
  }
  if (players.research) {
    players.research.process.go(usi);
  }
}

export function stop(color: Color): void {
  switch (color) {
    case Color.BLACK:
      if (players.black) {
        players.black.process.stop();
      }
      break;
    case Color.WHITE:
      if (players.white) {
        players.white.process.stop();
      }
      break;
  }
}
