import api, { API } from "@/renderer/ipc/api";
import { onUSIBestMove, onUSIInfo, USIPlayer } from "@/renderer/players/usi";
import { parsePV, Record } from "electron-shogi-core";
import { usiEngineSetting, usiEngineSettingWithPonder } from "@/tests/mock/usi";
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
    vi.useRealTimers();
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
      await player.startSearch(record1.position, usi1, timeStates, searchHandler);
      expect(mockAPI.usiGo).toBeCalledWith(100, usi1, timeStates);
      onUSIBestMove(100, usi1, "2g2f", "8c8d");
      expect(searchHandler.onMove.mock.calls[0][0].usi).toBe("2g2f");
      await player.startPonder(record2.position, usi2, timeStates);
      expect(mockAPI.usiGoPonder).toBeCalled();
      onUSIInfo(100, usi3, {
        pv: ["2f2e", "8d8e"],
      });
      await player.startPonder(record2.position, usi2, timeStates);
      expect(mockAPI.usiGoPonder).toBeCalledTimes(1); // startPonder を連続して呼び出すと無視される。
      await player.startSearch(record3.position, usi3, timeStates, searchHandler);
      expect(mockAPI.usiPonderHit).toBeCalledWith(100, timeStates);
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
      await player.startSearch(record1.position, usi1, timeStates, searchHandler);
      expect(mockAPI.usiGo).toBeCalledWith(100, usi1, timeStates);
      onUSIBestMove(100, usi1, "2g2f", "4a3a");
      expect(searchHandler.onMove.mock.calls[0][0].usi).toBe("2g2f");
      await player.startPonder(record2.position, usi2, timeStates);
      expect(mockAPI.usiGoPonder).not.toBeCalled();
    } finally {
      await player.close();
    }
  });

  it("onUSIInfo", async () => {
    vi.useFakeTimers();
    mockAPI.usiLaunch.mockResolvedValueOnce(100);
    mockAPI.usiGo.mockResolvedValueOnce();
    const usi = "position startpos moves 7g7f 3c3d";
    const record = Record.newByUSI(usi) as Record;
    const onSearchInfo = vi.fn();
    const player = new USIPlayer(usiEngineSetting, 10, onSearchInfo);
    try {
      await player.launch();
      const searchHandler = {
        onMove: vi.fn(),
        onResign: vi.fn(),
        onWin: vi.fn(),
        onError: vi.fn(),
      };
      await player.startSearch(record.position, usi, timeStates, searchHandler);

      // 深さ 15 の評価値と最善種
      onUSIInfo(100, usi, {
        multipv: 1,
        depth: 15,
        scoreCP: 81,
        currmove: "2g2f",
      });
      expect(onSearchInfo).not.toBeCalled();
      vi.runOnlyPendingTimers();
      expect(onSearchInfo).toBeCalledTimes(1);
      expect(onSearchInfo).lastCalledWith({
        usi,
        depth: 15,
        pv: parsePV(record.position, "▲２六歩"),
        score: 81,
      });

      // 深さ 16
      onUSIInfo(100, usi, {
        multipv: 1,
        depth: 16,
        scoreCP: 32,
        currmove: "5g5f",
        pv: ["5g5f", "8c8d", "5f5e"],
      });
      expect(onSearchInfo).toBeCalledTimes(1);
      // タイマーが作動する前に深さ 17 が来た場合はその情報で上書きされる。

      // 深さ 17 の評価値と PV
      onUSIInfo(100, usi, {
        multipv: 1,
        depth: 17,
        scoreCP: 123,
        currmove: "2g2f",
        pv: ["2g2f", "8c8d", "2f2e"],
      });
      vi.runOnlyPendingTimers();
      expect(onSearchInfo).toBeCalledTimes(2);
      expect(onSearchInfo).lastCalledWith({
        usi,
        depth: 17,
        pv: parsePV(record.position, "▲２六歩△８四歩▲２五歩"),
        score: 123,
      });

      // 評価値とメッセージ
      onUSIInfo(100, usi, {
        multipv: 1,
        scoreCP: -75,
        string: "free format message",
      });
      vi.runOnlyPendingTimers();
      expect(onSearchInfo).toBeCalledTimes(3);
      expect(onSearchInfo).lastCalledWith({
        usi,
        depth: 17,
        pv: parsePV(record.position, "▲２六歩△８四歩▲２五歩"),
        score: -75,
      });

      // Multi PV 第 2 位
      onUSIInfo(100, usi, {
        multipv: 2,
        depth: 17,
        scoreCP: -98,
        currmove: "5g5f",
        pv: ["5g5f", "8c8d", "5f5e"],
      });
      vi.runOnlyPendingTimers();
      expect(onSearchInfo).toBeCalledTimes(3);
    } finally {
      await player.close();
    }
  });
});
