import { TimeoutChain } from "@/helpers/testing";
import api, { API } from "@/ipc/api";
import { CSAGameResult, CSASpecialMove } from "@/ipc/csa";
import { SpecialMove } from "@/shogi";
import { Clock } from "@/store/clock";
import {
  CSAGameManager,
  onCSAGameResult,
  onCSAGameSummary,
  onCSAMove,
  onCSAStart,
} from "@/store/csa";
import { RecordManager } from "@/store/record";
import { csaGameSetting, csaGameSummary, playerURI } from "../mock/csa";
import { createMockPlayer, createMockPlayerBuilder } from "../mock/player";

jest.mock("@/ipc/api");

const mockAPI = api as jest.Mocked<API>;

function createMockHandlers() {
  return {
    onSaveRecord: jest.fn(),
    onGameNext: jest.fn(),
    onGameEnd: jest.fn(),
    onFlipBoard: jest.fn(),
    onPieceBeat: jest.fn(),
    onBeepShort: jest.fn(),
    onBeepUnlimited: jest.fn(),
    onStopBeep: jest.fn(),
    onError: jest.fn(),
  };
}

describe("store/csa", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("CSAManager/resign", () => {
    mockAPI.csaLogin.mockResolvedValueOnce(123);
    mockAPI.csaAgree.mockResolvedValueOnce();
    mockAPI.csaMove.mockResolvedValue();
    mockAPI.csaLogout.mockResolvedValueOnce();
    const mockPlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves":
        {
          sfen: "7g7f",
          info: { score: 82, pv: ["3c3d", "2g2f", "8c8d"] },
        },
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d":
        {
          sfen: "2g2f",
          info: { score: 78, pv: ["8c8d", "2f2e", "8d8e"] },
        },
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f 8c8d":
        { sfen: "resign" },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI]: mockPlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    const manager = new CSAGameManager(
      recordManager,
      new Clock(),
      new Clock(),
      mockPlayerBuilder,
      mockHandlers
    );
    return new TimeoutChain()
      .next(() => manager.login(csaGameSetting))
      .next(() => {
        expect(mockAPI.csaLogin.mock.calls).toHaveLength(1);
        expect(mockAPI.csaLogin.mock.calls[0][0]).toBe(csaGameSetting.server);
        expect(mockAPI.csaAgree.mock.calls).toHaveLength(0);
        onCSAGameSummary(123, csaGameSummary);
        expect(mockAPI.csaAgree.mock.calls).toHaveLength(1);
        expect(mockAPI.csaMove.mock.calls).toHaveLength(0);
        expect(mockPlayer.startSearch.mock.calls).toHaveLength(0);
        onCSAStart(123, { black: { time: 600 }, white: { time: 600 } });
        expect(mockAPI.csaMove.mock.calls).toHaveLength(1);
        expect(mockAPI.csaMove.mock.calls[0][0]).toBe(123);
        expect(mockAPI.csaMove.mock.calls[0][1]).toBe("+7776FU");
        expect(mockPlayer.startSearch.mock.calls).toHaveLength(1);
        expect(mockPlayer.startPonder.mock.calls).toHaveLength(0);
        onCSAMove(123, "+7776FU", {
          black: { time: 590 },
          white: { time: 600 },
        });
        expect(mockAPI.csaMove.mock.calls).toHaveLength(1);
        expect(mockPlayer.startSearch.mock.calls).toHaveLength(1);
        expect(mockPlayer.startPonder.mock.calls).toHaveLength(1);
        onCSAMove(123, "-3334FU", {
          black: { time: 590 },
          white: { time: 580 },
        });
        expect(mockAPI.csaMove.mock.calls).toHaveLength(2);
        expect(mockAPI.csaMove.mock.calls[1][0]).toBe(123);
        expect(mockAPI.csaMove.mock.calls[1][1]).toBe("+2726FU");
        expect(mockPlayer.startSearch.mock.calls).toHaveLength(2);
        expect(mockPlayer.startPonder.mock.calls).toHaveLength(1);
        onCSAMove(123, "+2726FU", {
          black: { time: 570 },
          white: { time: 580 },
        });
        expect(mockAPI.csaMove.mock.calls).toHaveLength(2);
        expect(mockAPI.csaResign.mock.calls).toHaveLength(0);
        expect(mockPlayer.startSearch.mock.calls).toHaveLength(2);
        expect(mockPlayer.startPonder.mock.calls).toHaveLength(2);
        onCSAMove(123, "-8384FU", {
          black: { time: 570 },
          white: { time: 560 },
        });
        expect(mockAPI.csaLogout.mock.calls).toHaveLength(0);
        expect(mockAPI.csaMove.mock.calls).toHaveLength(2);
        expect(mockAPI.csaResign.mock.calls).toHaveLength(1);
        expect(mockPlayer.startSearch.mock.calls).toHaveLength(3);
        expect(mockPlayer.startPonder.mock.calls).toHaveLength(2);
        expect(mockPlayer.close.mock.calls).toHaveLength(0);
        expect(mockHandlers.onGameEnd.mock.calls).toHaveLength(0);
        onCSAGameResult(123, CSASpecialMove.RESIGN, CSAGameResult.WIN);
      })
      .next(() => {
        expect(mockAPI.csaLogout.mock.calls).toHaveLength(1);
        expect(mockAPI.csaLogout.mock.calls[0][0]).toBe(123);
        expect(mockPlayer.close.mock.calls).toHaveLength(1);
        expect(mockHandlers.onGameEnd.mock.calls).toHaveLength(1);
        expect(mockHandlers.onError.mock.calls).toHaveLength(0);
        expect(recordManager.record.moves).toHaveLength(6);
        expect(recordManager.record.moves[1].comment).toBe(
          "互角\n*評価値=82\n*読み筋=△３四歩(33)▲２六歩(27)△８四歩(83)\n"
        );
        expect(recordManager.record.moves[2].comment).toBe("");
        expect(recordManager.record.moves[3].comment).toBe(
          "互角\n*評価値=78\n*読み筋=△８四歩(83)▲２五歩(26)△８五歩(84)\n"
        );
        expect(recordManager.record.moves[4].comment).toBe("");
        expect(recordManager.record.moves[5].move).toBe(SpecialMove.RESIGN);
      })
      .invoke();
  });

  it("CSAManager/resign/twice", () => {
    mockAPI.csaLogin.mockResolvedValue(123);
    mockAPI.csaAgree.mockResolvedValue();
    mockAPI.csaMove.mockResolvedValue();
    mockAPI.csaLogout.mockResolvedValue();
    const mockPlayer = createMockPlayer({
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves":
        {
          sfen: "7g7f",
          info: { score: 82, pv: ["3c3d", "2g2f", "8c8d"] },
        },
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d":
        {
          sfen: "2g2f",
          info: { score: 78, pv: ["8c8d", "2f2e", "8d8e"] },
        },
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f 8c8d":
        { sfen: "resign" },
    });
    const mockPlayerBuilder = createMockPlayerBuilder({
      [playerURI]: mockPlayer,
    });
    const mockHandlers = createMockHandlers();
    const recordManager = new RecordManager();
    const manager = new CSAGameManager(
      recordManager,
      new Clock(),
      new Clock(),
      mockPlayerBuilder,
      mockHandlers
    );
    return new TimeoutChain()
      .next(() =>
        manager.login({
          ...csaGameSetting,
          repeat: 2,
        })
      )
      .next(() => {
        expect(mockHandlers.onGameNext.mock.calls).toHaveLength(1);
        onCSAGameSummary(123, csaGameSummary);
        onCSAStart(123, { black: { time: 600 }, white: { time: 600 } });
        onCSAMove(123, "+7776FU", {
          black: { time: 590 },
          white: { time: 600 },
        });
        onCSAMove(123, "-3334FU", {
          black: { time: 590 },
          white: { time: 580 },
        });
        onCSAMove(123, "+2726FU", {
          black: { time: 570 },
          white: { time: 580 },
        });
        onCSAMove(123, "-8384FU", {
          black: { time: 570 },
          white: { time: 560 },
        });
        expect(mockAPI.csaLogin.mock.calls).toHaveLength(1);
        onCSAGameResult(123, CSASpecialMove.RESIGN, CSAGameResult.WIN);
        expect(mockAPI.csaLogin.mock.calls).toHaveLength(1);
      })
      .next(() => {
        expect(mockHandlers.onGameNext.mock.calls).toHaveLength(2);
        expect(mockHandlers.onGameEnd.mock.calls).toHaveLength(0);
        expect(recordManager.record.moves).toHaveLength(6);
        expect(mockAPI.csaLogin.mock.calls).toHaveLength(2);
        expect(mockAPI.csaAgree.mock.calls).toHaveLength(1);
        onCSAGameSummary(123, csaGameSummary);
        expect(mockAPI.csaAgree.mock.calls).toHaveLength(2);
        onCSAStart(123, { black: { time: 600 }, white: { time: 600 } });
        expect(recordManager.record.moves).toHaveLength(1);
        onCSAMove(123, "+7776FU", {
          black: { time: 590 },
          white: { time: 600 },
        });
        onCSAMove(123, "-3334FU", {
          black: { time: 590 },
          white: { time: 580 },
        });
        onCSAMove(123, "+2726FU", {
          black: { time: 570 },
          white: { time: 580 },
        });
        onCSAMove(123, "-8384FU", {
          black: { time: 570 },
          white: { time: 560 },
        });
        onCSAGameResult(123, CSASpecialMove.RESIGN, CSAGameResult.WIN);
      })
      .next(() => {
        expect(mockAPI.csaLogout.mock.calls).toHaveLength(2);
        expect(mockPlayer.close.mock.calls).toHaveLength(2);
        expect(mockHandlers.onGameNext.mock.calls).toHaveLength(2);
        expect(mockHandlers.onGameEnd.mock.calls).toHaveLength(1);
        expect(mockHandlers.onError.mock.calls).toHaveLength(0);
        expect(recordManager.record.moves).toHaveLength(6);
      })
      .invoke();
  });
});
