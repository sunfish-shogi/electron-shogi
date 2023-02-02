import { AnalysisManager } from "@/renderer/store/analysis";
import { RecordManager } from "@/renderer/store/record";
import { analysisSetting as baseAnalysisSetting } from "@/tests/mock/analysis";
import { USIPlayer } from "@/renderer/players/usi";

jest.mock("@/renderer/players/usi");

const mockUSIPlayer = USIPlayer as jest.MockedClass<typeof USIPlayer>;

describe("store/analysis", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("open-end", async () => {
    mockUSIPlayer.prototype.launch.mockResolvedValue();
    mockUSIPlayer.prototype.startResearch.mockResolvedValue();
    mockUSIPlayer.prototype.stop.mockResolvedValue();
    mockUSIPlayer.prototype.close.mockResolvedValue();
    const recordManager = new RecordManager();
    recordManager.importRecord(
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f 8c8d"
    );
    const analysisSetting = baseAnalysisSetting;
    analysisSetting.startCriteria.enableNumber = false;
    analysisSetting.endCriteria.enableNumber = false;
    const onFinish = jest.fn();
    const onError = jest.fn();
    const manager = new AnalysisManager(recordManager)
      .on("finish", onFinish)
      .on("error", onError);
    await manager.start(analysisSetting);
    expect(mockUSIPlayer).toBeCalledTimes(1);
    expect(mockUSIPlayer.prototype.launch).toBeCalled();
    expect(mockUSIPlayer.prototype.startResearch).not.toBeCalled();
    jest.runOnlyPendingTimers();
    expect(mockUSIPlayer.prototype.startResearch).toBeCalledTimes(1);
    manager.updateSearchInfo({
      usi: "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves",
      score: 10,
    });
    jest.runOnlyPendingTimers();
    expect(mockUSIPlayer.prototype.startResearch).toBeCalledTimes(2);
    manager.updateSearchInfo({
      usi: "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f",
      score: 20,
    });
    jest.runOnlyPendingTimers();
    expect(mockUSIPlayer.prototype.startResearch).toBeCalledTimes(3);
    manager.updateSearchInfo({
      usi: "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d",
      score: 30,
    });
    jest.runOnlyPendingTimers();
    expect(mockUSIPlayer.prototype.startResearch).toBeCalledTimes(4);
    manager.updateSearchInfo({
      usi: "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f",
      score: 40,
    });
    jest.runOnlyPendingTimers();
    expect(mockUSIPlayer.prototype.startResearch).toBeCalledTimes(5);
    expect(mockUSIPlayer.prototype.close).not.toBeCalled();
    expect(onFinish).not.toBeCalled();
    manager.updateSearchInfo({
      usi: "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d 2g2f 8c8d",
      score: 50,
    });
    jest.runOnlyPendingTimers();
    expect(mockUSIPlayer.prototype.startResearch).toBeCalledTimes(5);
    expect(mockUSIPlayer.prototype.stop).not.toBeCalled();
    expect(mockUSIPlayer.prototype.close).toBeCalledTimes(1);
    expect(onFinish).toBeCalledTimes(1);
    expect(onError).not.toBeCalled();
    recordManager.changePly(0);
    expect(recordManager.record.current.comment).toBe("");
    recordManager.changePly(1);
    expect(recordManager.record.current.comment).toBe("互角\n#評価値=20\n");
    recordManager.changePly(2);
    expect(recordManager.record.current.comment).toBe("互角\n#評価値=30\n");
    recordManager.changePly(3);
    expect(recordManager.record.current.comment).toBe("互角\n#評価値=40\n");
    recordManager.changePly(4);
    expect(recordManager.record.current.comment).toBe("互角\n#評価値=50\n");
  });
});
