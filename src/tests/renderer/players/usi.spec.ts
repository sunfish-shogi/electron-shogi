import api, { API } from "@/renderer/ipc/api";
import { onUSIBestMove, onUSIInfo, USIPlayer } from "@/renderer/players/usi";
import { Record } from "electron-shogi-core";
import { usiEngineSettingWithPonder } from "@/tests/mock/usi";
import { Mocked } from "vitest";

vi.mock("@/renderer/ipc/api");

const mockAPI = api as Mocked<API>;

const timeStates = {
  black: {
    timeMs: 250,
    byoyomi: 30,
    increment: 0,
  },
  white: {
    timeMs: 160,
    byoyomi: 0,
    increment: 5,
  },
};

describe("usi", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("ponderHit", async () => {
    mockAPI.usiLaunch.mockResolvedValueOnce(100);
    mockAPI.usiGo.mockResolvedValueOnce();
    mockAPI.usiGoPonder.mockResolvedValueOnce();
    mockAPI.usiPonderHit.mockResolvedValueOnce();
    const usi1 = "position startpos moves 7g7f 3c3d";
    const usi2 = "position startpos moves 7g7f 3c3d 2g2f";
    const usi3 = "position startpos moves 7g7f 3c3d 2g2f 8c8d";
    const record1 = Record.newByUSI(usi1) as Record;
    const record2 = Record.newByUSI(usi2) as Record;
    const record3 = Record.newByUSI(usi3) as Record;
    const player = new USIPlayer(usiEngineSettingWithPonder, 10);
    try {
      await player.launch();
      const searchHandler = {
        onMove: vi.fn(),
        onResign: vi.fn(),
        onWin: vi.fn(),
        onError: vi.fn(),
      };
      await player.startSearch(record1, timeStates, searchHandler);
      expect(mockAPI.usiGo).toBeCalledWith(100, usi1, timeStates);
      onUSIBestMove(100, usi1, "2g2f", "8c8d");
      expect(searchHandler.onMove.mock.calls[0][0].usi).toBe("2g2f");
      await player.startPonder(record2, timeStates);
      expect(mockAPI.usiGoPonder).toBeCalled();
      onUSIInfo(100, usi3, {
        pv: ["2f2e", "8d8e"],
      });
      await player.startSearch(record3, timeStates, searchHandler);
      expect(mockAPI.usiPonderHit).toBeCalledWith(100);
      onUSIBestMove(100, usi3, "2f2e");
      expect(searchHandler.onMove.mock.calls[1][0].usi).toBe("2f2e");
      expect(searchHandler.onMove.mock.calls[1][1].pv[0].usi).toBe("8d8e");
    } finally {
      await player.close();
    }
  });

  it("illegalPonderMove", async () => {
    mockAPI.usiLaunch.mockResolvedValueOnce(100);
    mockAPI.usiGo.mockResolvedValueOnce();
    mockAPI.usiGoPonder.mockResolvedValueOnce();
    const usi1 = "position startpos moves 7g7f 3c3d";
    const usi2 = "position startpos moves 7g7f 3c3d 2g2f";
    const record1 = Record.newByUSI(usi1) as Record;
    const record2 = Record.newByUSI(usi2) as Record;
    const player = new USIPlayer(usiEngineSettingWithPonder, 10);
    try {
      await player.launch();
      const searchHandler = {
        onMove: vi.fn(),
        onResign: vi.fn(),
        onWin: vi.fn(),
        onError: vi.fn(),
      };
      await player.startSearch(record1, timeStates, searchHandler);
      expect(mockAPI.usiGo).toBeCalledWith(100, usi1, timeStates);
      onUSIBestMove(100, usi1, "2g2f", "4a3a");
      expect(searchHandler.onMove.mock.calls[0][0].usi).toBe("2g2f");
      await player.startPonder(record2, timeStates);
      expect(mockAPI.usiGoPonder).not.toBeCalled();
    } finally {
      await player.close();
    }
  });
});
