import { InitialPositionType, Move, RecordMetadataKey, SpecialMoveType } from "electron-shogi-core";
import { Clock } from "@/renderer/store/clock";
import { GameManager, GameResults } from "@/renderer/store/game";
import { RecordManager } from "@/renderer/store/record";
import { playerURI01, playerURI02, gameSetting10m30s } from "@/tests/mock/game";
import { createMockPlayer, createMockPlayerBuilder } from "@/tests/mock/player";
import { GameSetting, JishogiRule } from "@/common/settings/game";
import { PlayerBuilder } from "@/renderer/players/builder";

export interface MockGameHandlers {
  onError(): void;
  onSaveRecord(): void;
  onGameNext(): void;
  onPieceBeat(): void;
  onBeepShort(): void;
  onBeepUnlimited(): void;
  onStopBeep(): void;
}

function createMockHandlers() {
  return {
    onError: vi.fn(),
    onSaveRecord: vi.fn().mockReturnValue(Promise.resolve()),
    onGameNext: vi.fn(),
    onPieceBeat: vi.fn(),
    onBeepShort: vi.fn(),
    onBeepUnlimited: vi.fn(),
    onStopBeep: vi.fn(),
  };
}

function invoke(
  recordManager: RecordManager,
  handlers: MockGameHandlers,
  gameSetting: GameSetting,
  playerBuilder: PlayerBuilder,
  assert: (gameResults: GameResults, specialMoveType: SpecialMoveType) => void,
  interrupt?: (manager: GameManager) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const manager = new GameManager(recordManager, new Clock(), new Clock())
      .on("gameEnd", (gameResults, specialMoveType) => {
        try {
          assert(gameResults, specialMoveType);
          resolve();
        } catch (e) {
          reject(e);
        }
      })
      .on("error", handlers.onError)
      .on("saveRecord", handlers.onSaveRecord)
      .on("gameNext", handlers.onGameNext)
      .on("pieceBeat", handlers.onPieceBeat)
      .on("beepShort", handlers.onBeepShort)
      .on("beepUnlimited", handlers.onBeepUnlimited)
      .on("stopBeep", handlers.onStopBeep);
    manager
      .start(gameSetting, playerBuilder)
      .then(() => {
        if (interrupt) {
          interrupt(manager);
        }
      })
      .catch(reject);
  });
}

describe("store/game", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("GameManager/resign", () => {
    const mockBlackPlayer = createMockPlayer({
      "position startpos": {
        usi: "7g7f",
        info: { score: 82, pv: ["3c3d", "2g2f", "8c8d"] },
      },
      "position startpos moves 7g7f 3c3d": {
        usi: "2g2f",
        info: { score: 78, pv: ["8c8d", "2f2e", "8d8e"] },
      },
    });
    const mockWhitePlayer = createMockPlayer({
      "position startpos moves 7g7f": {
        usi: "3c3d",
        info: { score: 64, pv: ["2g2f", "8c8d"] },
      },
      "position startpos moves 7g7f 3c3d 2g2f": {
        usi: "resign",
      },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();

    return invoke(
      recordManager,
      mockHandlers,
      gameSetting10m30s,
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 1 },
          player2: { name: "USI Engine 02", win: 0 },
          draw: 0,
          invalid: 0,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.RESIGN);
        expect(mockBlackPlayer.readyNewGame).toBeCalledTimes(1);
        expect(mockBlackPlayer.startSearch).toBeCalledTimes(2);
        expect(mockBlackPlayer.startPonder).toBeCalledTimes(2);
        expect(mockBlackPlayer.gameover).toBeCalledTimes(1);
        expect(mockBlackPlayer.stop).toBeCalledTimes(0);
        expect(mockWhitePlayer.readyNewGame).toBeCalledTimes(1);
        expect(mockWhitePlayer.startSearch).toBeCalledTimes(2);
        expect(mockWhitePlayer.startPonder).toBeCalledTimes(2);
        expect(mockWhitePlayer.gameover).toBeCalledTimes(1);
        expect(mockWhitePlayer.stop).toBeCalledTimes(0);
        expect(mockBlackPlayer.close).toBeCalledTimes(1);
        expect(mockWhitePlayer.close).toBeCalledTimes(1);
        expect(mockHandlers.onBeepShort).toBeCalledTimes(0);
        expect(mockHandlers.onBeepUnlimited).toBeCalledTimes(0);
        expect(mockHandlers.onStopBeep).toBeCalledTimes(8);
        expect(recordManager.record.usi).toBe("position startpos moves 7g7f 3c3d 2g2f");
        expect(recordManager.record.moves[1].comment).toBe(
          "互角\n*評価値=82\n*読み筋=△３四歩▲２六歩△８四歩\n",
        );
        expect(recordManager.record.moves[2].comment).toBe(
          "互角\n*評価値=64\n*読み筋=▲２六歩△８四歩\n",
        );
        expect(recordManager.record.moves[3].comment).toBe(
          "互角\n*評価値=78\n*読み筋=△８四歩▲２五歩△８五歩\n",
        );
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/handicap-bishop", () => {
    const mockBlackPlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 8b2b": {
        usi: "7g7f",
      },
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 8b2b 7g7f 2c2d":
        {
          usi: "resign",
        },
    });
    const mockWhitePlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1": {
        usi: "8b2b",
      },
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 8b2b 7g7f":
        { usi: "2c2d" },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        startPosition: InitialPositionType.HANDICAP_BISHOP,
      },
      mockPlayerBuilder,
      () => {
        expect(mockBlackPlayer.readyNewGame).toBeCalledTimes(1);
        expect(mockBlackPlayer.startSearch).toBeCalledTimes(2);
        expect(mockBlackPlayer.startPonder).toBeCalledTimes(2);
        expect(mockBlackPlayer.gameover).toBeCalledTimes(1);
        expect(mockBlackPlayer.stop).toBeCalledTimes(0);
        expect(mockBlackPlayer.close).toBeCalledTimes(1);
        expect(mockWhitePlayer.readyNewGame).toBeCalledTimes(1);
        expect(mockWhitePlayer.startSearch).toBeCalledTimes(2);
        expect(mockWhitePlayer.startPonder).toBeCalledTimes(2);
        expect(mockWhitePlayer.gameover).toBeCalledTimes(1);
        expect(mockWhitePlayer.stop).toBeCalledTimes(0);
        expect(mockWhitePlayer.close).toBeCalledTimes(1);
        expect(mockHandlers.onBeepShort).toBeCalledTimes(0);
        expect(mockHandlers.onBeepUnlimited).toBeCalledTimes(0);
        expect(mockHandlers.onStopBeep).toBeCalledTimes(8);
        expect(recordManager.record.usi).toBe(
          "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 8b2b 7g7f 2c2d",
        );
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/endGame", () => {
    const mockBlackPlayer = createMockPlayer({
      "position startpos": {
        usi: "7g7f",
      },
      "position startpos moves 7g7f 3c3d": { usi: "2g2f" },
    });
    const mockWhitePlayer = createMockPlayer({
      "position startpos moves 7g7f": {
        usi: "3c3d",
      },
      "position startpos moves 7g7f 3c3d 2g2f": {
        usi: "no-reply",
      },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();

    return invoke(
      recordManager,
      mockHandlers,
      gameSetting10m30s,
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 0 },
          player2: { name: "USI Engine 02", win: 0 },
          draw: 0,
          invalid: 1,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.INTERRUPT);
        expect(mockBlackPlayer.readyNewGame).toBeCalledTimes(1);
        expect(mockBlackPlayer.startSearch).toBeCalledTimes(2);
        expect(mockBlackPlayer.startPonder).toBeCalledTimes(2);
        expect(mockBlackPlayer.gameover).toBeCalledTimes(0);
        expect(mockBlackPlayer.stop).toBeCalledTimes(0);
        expect(mockBlackPlayer.close).toBeCalledTimes(1);
        expect(mockWhitePlayer.readyNewGame).toBeCalledTimes(1);
        expect(mockWhitePlayer.startSearch).toBeCalledTimes(2);
        expect(mockWhitePlayer.startPonder).toBeCalledTimes(2);
        expect(mockWhitePlayer.gameover).toBeCalledTimes(0);
        expect(mockWhitePlayer.stop).toBeCalledTimes(0);
        expect(mockWhitePlayer.close).toBeCalledTimes(1);
        expect(mockHandlers.onBeepShort).toBeCalledTimes(0);
        expect(mockHandlers.onBeepUnlimited).toBeCalledTimes(0);
        expect(mockHandlers.onStopBeep).toBeCalledTimes(8);
        expect(recordManager.record.usi).toBe("position startpos moves 7g7f 3c3d 2g2f");
        expect(mockHandlers.onError).not.toBeCalled();
      },
      (manager) => {
        setTimeout(() => manager.stop(), 100);
      },
    );
  });

  it("GameManager/resign/twice", () => {
    const mockBlackPlayer = createMockPlayer({
      // 1st game
      "position startpos": {
        usi: "7g7f",
      },
      "position startpos moves 7g7f 3c3d": { usi: "2g2f" },
      // 2nd game
      "position startpos moves 7g7f": {
        usi: "3c3d",
      },
    });
    const mockWhitePlayer = createMockPlayer({
      // 1st game
      "position startpos moves 7g7f": {
        usi: "3c3d",
      },
      "position startpos moves 7g7f 3c3d 2g2f": {
        usi: "resign",
      },
      // 2nd game
      "position startpos": {
        usi: "7g7f",
      },
      "position startpos moves 7g7f 3c3d": {
        usi: "resign",
      },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        repeat: 2,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 02", win: 0 },
          player2: { name: "USI Engine 01", win: 2 },
          draw: 0,
          invalid: 0,
          total: 2,
        });
        expect(specialMoveType).toBe(SpecialMoveType.RESIGN);
        expect(recordManager.record.metadata.getStandardMetadata(RecordMetadataKey.TITLE)).toBe(
          "連続対局 2/2",
        );
        expect(mockBlackPlayer.readyNewGame).toBeCalledTimes(2);
        expect(mockBlackPlayer.startSearch).toBeCalledTimes(3);
        expect(mockBlackPlayer.startPonder).toBeCalledTimes(4);
        expect(mockBlackPlayer.gameover).toBeCalledTimes(2);
        expect(mockBlackPlayer.stop).toBeCalledTimes(0);
        expect(mockBlackPlayer.close).toBeCalledTimes(1);
        expect(mockWhitePlayer.readyNewGame).toBeCalledTimes(2);
        expect(mockWhitePlayer.startSearch).toBeCalledTimes(4);
        expect(mockWhitePlayer.startPonder).toBeCalledTimes(3);
        expect(mockWhitePlayer.gameover).toBeCalledTimes(2);
        expect(mockWhitePlayer.stop).toBeCalledTimes(0);
        expect(mockWhitePlayer.close).toBeCalledTimes(1);
        expect(mockHandlers.onBeepShort).toBeCalledTimes(0);
        expect(mockHandlers.onBeepUnlimited).toBeCalledTimes(0);
        expect(mockHandlers.onStopBeep).toBeCalledTimes(14);
        expect(recordManager.record.usi).toBe("position startpos moves 7g7f 3c3d");
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/noStartPosition/twice", () => {
    const mockBlackPlayer = createMockPlayer({
      "position startpos moves 7g7f 3c3d": { usi: "2g2f" },
    });
    const mockWhitePlayer = createMockPlayer({
      "position startpos moves 7g7f": {
        usi: "3c3d",
      },
      "position startpos moves 7g7f 3c3d 2g2f": {
        usi: "resign",
      },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    recordManager.appendMove({
      move: recordManager.record.position.createMoveByUSI("7g7f") as Move,
    });

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        startPosition: undefined,
        repeat: 2,
        swapPlayers: false,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 2 },
          player2: { name: "USI Engine 02", win: 0 },
          draw: 0,
          invalid: 0,
          total: 2,
        });
        expect(specialMoveType).toBe(SpecialMoveType.RESIGN);
        expect(recordManager.record.metadata.getStandardMetadata(RecordMetadataKey.TITLE)).toBe(
          "連続対局 2/2",
        );
        expect(mockBlackPlayer.startSearch).toBeCalledTimes(2);
        expect(mockBlackPlayer.startPonder).toBeCalledTimes(4);
        expect(mockBlackPlayer.gameover).toBeCalledTimes(2);
        expect(mockBlackPlayer.stop).toBeCalledTimes(0);
        expect(mockBlackPlayer.close).toBeCalledTimes(1);
        expect(mockWhitePlayer.startSearch).toBeCalledTimes(4);
        expect(mockWhitePlayer.startPonder).toBeCalledTimes(2);
        expect(mockWhitePlayer.gameover).toBeCalledTimes(2);
        expect(mockWhitePlayer.stop).toBeCalledTimes(0);
        expect(mockWhitePlayer.close).toBeCalledTimes(1);
        expect(mockHandlers.onBeepShort).toBeCalledTimes(0);
        expect(mockHandlers.onBeepUnlimited).toBeCalledTimes(0);
        expect(mockHandlers.onStopBeep).toBeCalledTimes(12);
        expect(recordManager.record.usi).toBe("position startpos moves 7g7f 3c3d 2g2f");
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/maxMoves", () => {
    const mockBlackPlayer = createMockPlayer({
      "position startpos": {
        usi: "7g7f",
      },
      "position startpos moves 7g7f 3c3d": { usi: "2g2f" },
    });
    const mockWhitePlayer = createMockPlayer({
      "position startpos moves 7g7f": {
        usi: "3c3d",
      },
      "position startpos moves 7g7f 3c3d 2g2f": {
        usi: "8c8d",
      },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        maxMoves: 4,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 0 },
          player2: { name: "USI Engine 02", win: 0 },
          draw: 1,
          invalid: 0,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.IMPASS);
        expect(mockBlackPlayer.startSearch).toBeCalledTimes(2);
        expect(mockBlackPlayer.startPonder).toBeCalledTimes(2);
        expect(mockBlackPlayer.gameover).toBeCalledTimes(1);
        expect(mockBlackPlayer.stop).toBeCalledTimes(0);
        expect(mockBlackPlayer.close).toBeCalledTimes(1);
        expect(mockWhitePlayer.startSearch).toBeCalledTimes(2);
        expect(mockWhitePlayer.startPonder).toBeCalledTimes(2);
        expect(mockWhitePlayer.gameover).toBeCalledTimes(1);
        expect(mockWhitePlayer.stop).toBeCalledTimes(0);
        expect(mockWhitePlayer.close).toBeCalledTimes(1);
        expect(mockHandlers.onBeepShort).toBeCalledTimes(0);
        expect(mockHandlers.onBeepUnlimited).toBeCalledTimes(0);
        expect(mockHandlers.onStopBeep).toBeCalledTimes(9);
        expect(recordManager.record.usi).toBe("position startpos moves 7g7f 3c3d 2g2f 8c8d");
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/declaration/black/accepted", () => {
    // https://denryu-sen.jp/denryusen/dr4_production/dist/#/dr4prd+buoy_blackbid300_dr4b-9-top_4_burningbridges_honeywaffle-600-2F+burningbridges+honeywaffle+20231203185029/358
    const sfen = "1Rn1S+S2+B/2S1GGppK/4pG2L/5G2+B/9/5n3/1+p+l6/+lk7/9 b RS2NL11P3p 1";
    const mockBlackPlayer = createMockPlayer({
      [`position sfen ${sfen}`]: { usi: "4d5c" },
      [`position sfen ${sfen} moves 4d5c 2b2c`]: { usi: "win" },
    });
    const mockWhitePlayer = createMockPlayer({
      [`position sfen ${sfen} moves 4d5c`]: { usi: "2b2c" },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    recordManager.resetBySFEN(sfen);

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        startPosition: undefined,
        jishogiRule: JishogiRule.GENERAL24,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 1 },
          player2: { name: "USI Engine 02", win: 0 },
          draw: 0,
          invalid: 0,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.ENTERING_OF_KING);
        expect(recordManager.record.usi).toBe(`position sfen ${sfen} moves 4d5c 2b2c`);
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/declaration/black/rejected", () => {
    // https://denryu-sen.jp/denryusen/dr4_production/dist/#/dr4prd+buoy_blackbid300_dr4b-9-top_4_burningbridges_honeywaffle-600-2F+burningbridges+honeywaffle+20231203185029/356
    const sfen = "1Rn1S+S1p+B/4GGp1K/4pG2L/5G2+B/9/5n3/1+p+l6/+lk7/9 b R2S2NL11P3p 1";
    const mockBlackPlayer = createMockPlayer({
      [`position sfen ${sfen}`]: { usi: "S*7b" },
      [`position sfen ${sfen} moves S*7b 2a2b`]: { usi: "win" },
    });
    const mockWhitePlayer = createMockPlayer({
      [`position sfen ${sfen} moves S*7b`]: { usi: "2a2b" },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    recordManager.resetBySFEN(sfen);

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        startPosition: undefined,
        jishogiRule: JishogiRule.GENERAL24,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 0 },
          player2: { name: "USI Engine 02", win: 1 },
          draw: 0,
          invalid: 0,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.FOUL_LOSE);
        expect(recordManager.record.usi).toBe(`position sfen ${sfen} moves S*7b 2a2b`);
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/declaration/white/accepted", () => {
    // https://denryu-sen.jp/denryusen/dr4_production/dist/#/dr4prd+buoy_blackbid300_dr4a-7-bottom_4_tanuki_dlshogi-600-2F+tanuki+dlshogi+20231203170524/265
    const sfen = "1+N+L1+S4/9/+PK+P6/1G7/9/2+r6/+p1+p2g+p+p+p/1sk2+p3/8+r w 2b2g2s3n3l10p 1";
    const mockBlackPlayer = createMockPlayer({
      [`position sfen ${sfen} moves G*6g`]: { usi: "9c8b" },
    });
    const mockWhitePlayer = createMockPlayer({
      [`position sfen ${sfen}`]: { usi: "G*6g" },
      [`position sfen ${sfen} moves G*6g 9c8b`]: { usi: "win" },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    recordManager.resetBySFEN(sfen);

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        startPosition: undefined,
        jishogiRule: JishogiRule.GENERAL24,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 0 },
          player2: { name: "USI Engine 02", win: 1 },
          draw: 0,
          invalid: 0,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.ENTERING_OF_KING);
        expect(recordManager.record.usi).toBe(`position sfen ${sfen} moves G*6g 9c8b`);
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/try/black", () => {
    const sfen = "1R2+SK2+B/2S+SGGp2/4GG1pL/8+B/9/9/1+p+l6/+lk+n3+n2/9 b RS2NL12P3p 1";
    const mockBlackPlayer = createMockPlayer({
      [`position sfen ${sfen}`]: { usi: "5a6a" },
      [`position sfen ${sfen} moves 5a6a P*6g`]: { usi: "4a5a" },
    });
    const mockWhitePlayer = createMockPlayer({
      [`position sfen ${sfen} moves 5a6a`]: { usi: "P*6g" },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    recordManager.resetBySFEN(sfen);

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        startPosition: undefined,
        jishogiRule: JishogiRule.TRY,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 1 },
          player2: { name: "USI Engine 02", win: 0 },
          draw: 0,
          invalid: 0,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.TRY);
        expect(recordManager.record.usi).toBe(`position sfen ${sfen} moves 5a6a P*6g 4a5a`);
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/try/white", () => {
    const sfen = "1Rn1S+SK2/2S1GGp2/2R1GG1pL/9/7+B1/2P6/1+p+B+l5/+l3pp+n2/3k5 w S2NL11Pp 1";
    const mockBlackPlayer = createMockPlayer({
      [`position sfen ${sfen} moves 8g7g`]: { usi: "2e3e" },
    });
    const mockWhitePlayer = createMockPlayer({
      [`position sfen ${sfen}`]: { usi: "8g7g" },
      [`position sfen ${sfen} moves 8g7g 2e3e`]: { usi: "6i5i" },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    recordManager.resetBySFEN(sfen);

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        startPosition: undefined,
        jishogiRule: JishogiRule.TRY,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 0 },
          player2: { name: "USI Engine 02", win: 1 },
          draw: 0,
          invalid: 0,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.TRY);
        expect(recordManager.record.usi).toBe(`position sfen ${sfen} moves 8g7g 2e3e 6i5i`);
        expect(mockHandlers.onError).not.toBeCalled();
      },
    );
  });

  it("GameManager/illegal-try/white", () => {
    const sfen = "1Rn1S+SK2/2S1GGp2/2R1GG1pL/9/7+B1/2P6/1+p+B+l5/+l3pp+n2/3k5 w S2NL11Pp 1";
    const mockBlackPlayer = createMockPlayer({});
    const mockWhitePlayer = createMockPlayer({
      [`position sfen ${sfen}`]: { usi: "6i5i" }, // 王手放置
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    recordManager.resetBySFEN(sfen);

    return invoke(
      recordManager,
      mockHandlers,
      {
        ...gameSetting10m30s,
        startPosition: undefined,
        jishogiRule: JishogiRule.TRY,
      },
      mockPlayerBuilder,
      (gameResults, specialMoveType) => {
        expect(gameResults).toStrictEqual({
          player1: { name: "USI Engine 01", win: 1 },
          player2: { name: "USI Engine 02", win: 0 },
          draw: 0,
          invalid: 0,
          total: 1,
        });
        expect(specialMoveType).toBe(SpecialMoveType.FOUL_LOSE);
        expect(recordManager.record.usi).toBe(`position sfen ${sfen}`);
        expect(mockHandlers.onError).toBeCalledTimes(1);
      },
    );
  });
});
