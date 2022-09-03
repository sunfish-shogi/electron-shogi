import { Player, SearchHandler } from "@/players/player";
import { TimeLimitSetting } from "@/settings/game";
import { PlayerSetting } from "@/settings/player";
import { ImmutableRecord, Move } from "@/shogi";

export function createMockPlayer(moves: { [usi: string]: string }) {
  return {
    isEngine(): boolean {
      return false;
    },
    startSearch: jest.fn(
      (
        r: ImmutableRecord,
        t: TimeLimitSetting,
        bt: number,
        wt: number,
        h: SearchHandler
      ) => {
        const sfen = moves[r.usi];
        if (sfen === "no-reply") {
          // eslint-disable-next-line  @typescript-eslint/no-empty-function
          return new Promise<void>(() => {});
        }
        if (sfen === "resign") {
          h.onResign();
          return Promise.resolve();
        }
        const move = r.position.createMoveBySFEN(sfen) as Move;
        h.onMove(move);
        return Promise.resolve();
      }
    ),
    startPonder: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    gameover: jest.fn(() => Promise.resolve()),
    close: jest.fn(() => Promise.resolve()),
  };
}

export function createMockPlayerBuilder(playerMap: { [uri: string]: Player }) {
  return {
    build: (playerSetting: PlayerSetting) => {
      const player = playerMap[playerSetting.uri];
      if (!player) {
        throw new Error("unexpected player URI");
      }
      return new Promise<Player>((resolve) => resolve(player));
    },
  };
}
