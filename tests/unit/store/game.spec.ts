import { TimeoutChain } from "@/helpers/testing";
import { InitialPositionType, Position, SpecialMove } from "@/shogi";
import { Clock } from "@/store/clock";
import { GameManager } from "@/store/game";
import { RecordManager } from "@/store/record";
import { playerURI01, playerURI02, gameSetting10m30s } from "../mock/game";
import { createMockPlayer, createMockPlayerBuilder } from "../mock/player";

function createMockHandlers() {
  return {
    onGameEnd: jest.fn(),
    onPieceBeat: jest.fn(),
    onBeepShort: jest.fn(),
    onBeepUnlimited: jest.fn(),
    onStopBeep: jest.fn(),
    onError: jest.fn(),
  };
}

describe("store/game", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GameManager/resign", () => {
    const mockBlackPlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves":
        "7g7f",
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d":
        "2g2f",
    });
    const mockWhitePlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f":
        "3c3d",
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f":
        "resign",
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    const manager = new GameManager(
      recordManager,
      new Clock(),
      new Clock(),
      mockPlayerBuilder,
      mockHandlers
    );
    return new TimeoutChain()
      .next(() => manager.startGame(gameSetting10m30s))
      .next(() => {
        expect(mockBlackPlayer.startSearch.mock.calls.length).toBe(2);
        expect(mockBlackPlayer.startPonder.mock.calls.length).toBe(2);
        expect(mockBlackPlayer.gameover.mock.calls.length).toBe(1);
        expect(mockBlackPlayer.stop.mock.calls.length).toBe(0);
        expect(mockBlackPlayer.close.mock.calls.length).toBe(1);
        expect(mockWhitePlayer.startSearch.mock.calls.length).toBe(2);
        expect(mockWhitePlayer.startPonder.mock.calls.length).toBe(2);
        expect(mockWhitePlayer.gameover.mock.calls.length).toBe(1);
        expect(mockWhitePlayer.stop.mock.calls.length).toBe(0);
        expect(mockWhitePlayer.close.mock.calls.length).toBe(1);
        expect(mockHandlers.onGameEnd.mock.calls.length).toBe(1);
        expect(mockHandlers.onBeepShort.mock.calls.length).toBe(0);
        expect(mockHandlers.onBeepUnlimited.mock.calls.length).toBe(0);
        expect(mockHandlers.onStopBeep.mock.calls.length).toBe(8);
        expect(mockHandlers.onError.mock.calls.length).toBe(0);
        expect(recordManager.record.usi).toBe(
          "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f"
        );
      })
      .invoke();
  });

  it("GameManager/handicap-bishop", () => {
    const initPos = new Position();
    initPos.reset(InitialPositionType.HANDICAP_BISHOP);
    const mockBlackPlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 8b2b":
        "7g7f",
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 8b2b 7g7f 2c2d":
        "resign",
    });
    const mockWhitePlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves":
        "8b2b",
      "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 8b2b 7g7f":
        "2c2d",
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    recordManager.importRecord(initPos.sfen);
    const manager = new GameManager(
      recordManager,
      new Clock(),
      new Clock(),
      mockPlayerBuilder,
      mockHandlers
    );
    return new TimeoutChain()
      .next(() => manager.startGame(gameSetting10m30s))
      .next(() => {
        expect(mockBlackPlayer.startSearch.mock.calls.length).toBe(2);
        expect(mockBlackPlayer.startPonder.mock.calls.length).toBe(2);
        expect(mockBlackPlayer.gameover.mock.calls.length).toBe(1);
        expect(mockBlackPlayer.stop.mock.calls.length).toBe(0);
        expect(mockBlackPlayer.close.mock.calls.length).toBe(1);
        expect(mockWhitePlayer.startSearch.mock.calls.length).toBe(2);
        expect(mockWhitePlayer.startPonder.mock.calls.length).toBe(2);
        expect(mockWhitePlayer.gameover.mock.calls.length).toBe(1);
        expect(mockWhitePlayer.stop.mock.calls.length).toBe(0);
        expect(mockWhitePlayer.close.mock.calls.length).toBe(1);
        expect(mockHandlers.onGameEnd.mock.calls.length).toBe(1);
        expect(mockHandlers.onBeepShort.mock.calls.length).toBe(0);
        expect(mockHandlers.onBeepUnlimited.mock.calls.length).toBe(0);
        expect(mockHandlers.onStopBeep.mock.calls.length).toBe(8);
        expect(mockHandlers.onError.mock.calls.length).toBe(0);
        expect(recordManager.record.usi).toBe(
          "position sfen lnsgkgsnl/1r7/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL w - 1 moves 8b2b 7g7f 2c2d"
        );
      })
      .invoke();
  });

  it("GameManager/endGame", () => {
    const mockBlackPlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves":
        "7g7f",
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d":
        "2g2f",
    });
    const mockWhitePlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f":
        "3c3d",
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f":
        "no-reply",
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    const manager = new GameManager(
      recordManager,
      new Clock(),
      new Clock(),
      mockPlayerBuilder,
      mockHandlers
    );
    return new TimeoutChain()
      .next(() => manager.startGame(gameSetting10m30s))
      .next(() => manager.endGame(SpecialMove.INTERRUPT))
      .next(() => {
        expect(mockBlackPlayer.startSearch.mock.calls.length).toBe(2);
        expect(mockBlackPlayer.startPonder.mock.calls.length).toBe(2);
        expect(mockBlackPlayer.gameover.mock.calls.length).toBe(0);
        expect(mockBlackPlayer.stop.mock.calls.length).toBe(0);
        expect(mockBlackPlayer.close.mock.calls.length).toBe(1);
        expect(mockWhitePlayer.startSearch.mock.calls.length).toBe(2);
        expect(mockWhitePlayer.startPonder.mock.calls.length).toBe(2);
        expect(mockWhitePlayer.gameover.mock.calls.length).toBe(0);
        expect(mockWhitePlayer.stop.mock.calls.length).toBe(0);
        expect(mockWhitePlayer.close.mock.calls.length).toBe(1);
        expect(mockHandlers.onGameEnd.mock.calls.length).toBe(1);
        expect(mockHandlers.onGameEnd.mock.calls[0][0]).toBe(
          SpecialMove.INTERRUPT
        );
        expect(mockHandlers.onBeepShort.mock.calls.length).toBe(0);
        expect(mockHandlers.onBeepUnlimited.mock.calls.length).toBe(0);
        expect(mockHandlers.onStopBeep.mock.calls.length).toBe(8);
        expect(mockHandlers.onError.mock.calls.length).toBe(0);
        expect(recordManager.record.usi).toBe(
          "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f"
        );
      })
      .invoke();
  });

  it("GameManager/time-not-reduced", () => {
    const mockBlackPlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves":
        "7g7f",
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d":
        "2g2f",
    });
    const mockWhitePlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f":
        "3c3d",
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f":
        "resign",
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI01]: mockBlackPlayer,
      [playerURI02]: mockWhitePlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    const blackClock = new Clock();
    const whiteClock = new Clock();
    const manager = new GameManager(
      recordManager,
      blackClock,
      whiteClock,
      mockPlayerBuilder,
      mockHandlers
    );
    return new TimeoutChain()
      .next(() => manager.startGame(gameSetting10m30s))
      .next(() => {
        expect(blackClock.timeMs).toBe(600 * 1e3);
        expect(whiteClock.timeMs).toBe(600 * 1e3);
      })
      .invoke();
  });
});
