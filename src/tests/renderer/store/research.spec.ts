import { Move, Record } from "@/common/shogi";
import api, { API } from "@/renderer/ipc/api";
import { ResearchManager } from "@/renderer/store/research";
import {
  researchSetting,
  researchSettingMax5Seconds,
  researchSettingSecondaryEngines,
} from "@/tests/mock/research";

jest.mock("@/renderer/ipc/api");

const mockAPI = api as jest.Mocked<API>;

describe("store/research", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("unlimited", async () => {
    jest.useFakeTimers();
    mockAPI.usiLaunch.mockResolvedValueOnce(100);
    mockAPI.usiGo.mockResolvedValue();
    const manager = new ResearchManager();
    await manager.launch(researchSetting);
    expect(mockAPI.usiLaunch).toBeCalledWith(researchSetting.usi, 10);
    expect(mockAPI.usiReady).toBeCalledTimes(1);
    const record = new Record();
    manager.updatePosition(record);
    jest.runOnlyPendingTimers(); // 遅延実行
    expect(mockAPI.usiGoInfinite).toBeCalledTimes(1);
    expect(mockAPI.usiGoInfinite).toBeCalledWith(100, "position startpos moves");

    // 時間制限が無いので stop コマンドは送信されない。
    jest.runOnlyPendingTimers();
    expect(mockAPI.usiStop).toBeCalledTimes(0);

    record.append(record.position.createMoveByUSI("7g7f") as Move);
    manager.updatePosition(record);
    jest.runOnlyPendingTimers(); // 遅延実行
    expect(mockAPI.usiGoInfinite).toBeCalledTimes(2);
    expect(mockAPI.usiGoInfinite).toBeCalledWith(100, "position startpos moves 7g7f");
  });

  it("max5Seconds", async () => {
    jest.useFakeTimers();
    mockAPI.usiLaunch.mockResolvedValueOnce(100);
    mockAPI.usiGo.mockResolvedValue();
    const manager = new ResearchManager();
    await manager.launch(researchSettingMax5Seconds);
    const record = new Record();
    manager.updatePosition(record);
    jest.runOnlyPendingTimers(); // 遅延実行
    expect(mockAPI.usiStop).toBeCalledTimes(0);

    // 時間制限があるので stop コマンドが送信される。
    jest.runOnlyPendingTimers();
    expect(mockAPI.usiStop).toBeCalledTimes(1);
  });

  it("secondaryEngines", async () => {
    jest.useFakeTimers();
    mockAPI.usiLaunch.mockResolvedValue(100);
    mockAPI.usiGo.mockResolvedValue();
    const manager = new ResearchManager();
    await manager.launch(researchSettingSecondaryEngines);
    expect(mockAPI.usiLaunch).toBeCalledTimes(3);
    expect(mockAPI.usiReady).toBeCalledTimes(3);
    const record = new Record();
    manager.updatePosition(record);
    jest.runOnlyPendingTimers(); // 遅延実行
    expect(mockAPI.usiGoInfinite).toBeCalledTimes(3);
    record.append(record.position.createMoveByUSI("7g7f") as Move);
    manager.updatePosition(record);
    jest.runOnlyPendingTimers(); // 遅延実行
    expect(mockAPI.usiGoInfinite).toBeCalledTimes(6);
  });

  it("pause", async () => {
    jest.useFakeTimers();
    mockAPI.usiLaunch.mockResolvedValueOnce(101);
    mockAPI.usiLaunch.mockResolvedValueOnce(102);
    mockAPI.usiLaunch.mockResolvedValueOnce(103);
    mockAPI.usiGo.mockResolvedValue();
    const manager = new ResearchManager();
    await manager.launch(researchSettingSecondaryEngines);
    const record = new Record();
    manager.updatePosition(record);
    jest.runOnlyPendingTimers();
    expect(mockAPI.usiGoInfinite).toBeCalledTimes(3);
    // all sessions are unpaused
    expect(manager.isPaused(101)).toBeFalsy();
    expect(manager.isPaused(102)).toBeFalsy();
    expect(manager.isPaused(103)).toBeFalsy();
    // pause 102
    manager.pause(102);
    expect(manager.isPaused(101)).toBeFalsy();
    expect(manager.isPaused(102)).toBeTruthy();
    expect(manager.isPaused(103)).toBeFalsy();
    // update position
    record.append(record.position.createMoveByUSI("7g7f") as Move);
    manager.updatePosition(record);
    jest.runOnlyPendingTimers();
    expect(mockAPI.usiGoInfinite).toBeCalledTimes(5);
    // unpause 102
    manager.unpause(102);
    expect(manager.isPaused(101)).toBeFalsy();
    expect(manager.isPaused(102)).toBeFalsy();
    expect(manager.isPaused(103)).toBeFalsy();
    expect(mockAPI.usiGoInfinite).toBeCalledTimes(6);
  });
});
