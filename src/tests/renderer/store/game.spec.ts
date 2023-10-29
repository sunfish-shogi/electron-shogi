import { InitialPositionType, Move, RecordMetadataKey, SpecialMoveType } from "@/common/shogi";
import { Clock } from "@/renderer/store/clock";
import { GameManager, GameResults } from "@/renderer/store/game";
import { RecordManager } from "@/renderer/store/record";
import { playerURI01, playerURI02, gameSetting10m30s } from "@/tests/mock/game";
import { createMockPlayer, createMockPlayerBuilder } from "@/tests/mock/player";
import { GameSetting } from "@/common/settings/game";
import { PlayerBuilder } from "@/renderer/players/builder";

export interface MockGameHandlers {
  onSaveRecord(): void;
  onGameNext(): void;
  onPieceBeat(): void;
  onBeepShort(): void;
  onBeepUnlimited(): void;
  onStopBeep(): void;
}

function createMockHandlers() {
  return {
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
      .on("error", reject)
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
      "position startpos moves": {
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
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves": {
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
      },
    );
  });

  it("GameManager/endGame", () => {
    const mockBlackPlayer = createMockPlayer({
      "position startpos moves": {
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
      },
      (manager) => {
        setTimeout(() => manager.stop(), 100);
      },
    );
  });

  it("GameManager/resign/twice", () => {
    const mockBlackPlayer = createMockPlayer({
      // 1st game
      "position startpos moves": {
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
      "position startpos moves": {
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
      },
    );
  });

  it("GameManager/maxMoves", () => {
    const mockBlackPlayer = createMockPlayer({
      "position startpos moves": {
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
      },
    );
  });
});
