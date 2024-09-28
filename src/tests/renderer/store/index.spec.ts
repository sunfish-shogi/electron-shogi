/* eslint-disable @typescript-eslint/no-non-null-assertion */
import api, { API } from "@/renderer/ipc/api";
import { Move } from "tsshogi";
import { createStore } from "@/renderer/store";
import { RecordCustomData } from "@/renderer/store/record";
import * as audio from "@/renderer/devices/audio";
import { gameSettings10m30s } from "@/tests/mock/game";
import { GameManager } from "@/renderer/store/game";
import { AppState, ResearchState } from "@/common/control/state";
import { AnalysisManager } from "@/renderer/store/analysis";
import { analysisSettings } from "@/tests/mock/analysis";
import { USIPlayer } from "@/renderer/players/usi";
import { researchSettings } from "@/tests/mock/research";
import {
  csaGameSettings,
  emptyCSAGameSettingsHistory,
  singleCSAGameSettingsHistory,
} from "@/tests/mock/csa";
import { CSAGameManager } from "@/renderer/store/csa";
import { convert } from "encoding-japanese";
import { Mocked, MockedClass } from "vitest";
import { useAppSettings } from "@/renderer/store/settings";
import { defaultAppSettings } from "@/common/settings/app";
import { useMessageStore } from "@/renderer/store/message";
import { useBusyState } from "@/renderer/store/busy";
import { useErrorStore } from "@/renderer/store/error";
import { useConfirmationStore } from "@/renderer/store/confirm";
import { RecordFileFormat } from "@/common/file/record";

vi.mock("@/renderer/devices/audio");
vi.mock("@/renderer/ipc/api");
vi.mock("@/renderer/store/game");
vi.mock("@/renderer/store/csa");
vi.mock("@/renderer/players/usi");
vi.mock("@/renderer/store/analysis");

const mockAudio = audio as Mocked<typeof audio>;
const mockAPI = api as Mocked<API>;
const mockGameManager = GameManager as MockedClass<typeof GameManager>;
const mockCSAGameManager = CSAGameManager as MockedClass<typeof CSAGameManager>;
const mockUSIPlayer = USIPlayer as MockedClass<typeof USIPlayer>;
const mockAnalysisManager = AnalysisManager as MockedClass<typeof AnalysisManager>;

const sampleKIF = `
手合割：平手
手数----指手---------消費時間--
   1 ２六歩(27)   ( 0:00/00:00:00)
*通常コメント
   2 ８四歩(83)   ( 0:00/00:00:00)
*#評価値=108
   3 ７六歩(77)   ( 0:00/00:00:00)
   4 ８五歩(84)   ( 0:00/00:00:00)
   5 ７七角(88)   ( 0:00/00:00:00)
   6 ３二金(41)   ( 0:00/00:00:00)
   7 ６八銀(79)   ( 0:00/00:00:00)
   8 ３四歩(33)   ( 0:00/00:00:00)
   9 ７八金(69)   ( 0:00/00:00:00)
  10 ４二銀(31)   ( 0:00/00:00:00)
`;

const sampleCSA = `V2.2
P1 *  *  *  *  *  *  * -KE * 
P2 *  *  *  *  *  * -KI-OU * 
P3 *  *  *  *  *  * -KI-FU+KE
P4 *  *  *  *  *  *  *  *  * 
P5 *  *  *  *  *  *  *  *  * 
P6 *  *  *  *  *  * -KA * +FU
P7 *  *  *  *  *  *  *  *  * 
P8 *  *  *  *  *  *  *  *  * 
P9 *  *  *  *  *  *  *  *  * 
P+00HI00HI00KI00KI
P-00AL
+
+1321NK,T0
'読み飛ばすコメント
'*初手へのコメント
'** 30011 2b2a
-2221OU,T0
'** 30010
+0013KE,T0
'** 30009
-2122OU,T0
'** 30008
+0012KI,T0
'** 30007
-2212OU,T0
'** 30006
+0011HI,T0
'** 30005
-1211OU,T0
'** 30004
+0021KI,T0
'** 30003
-1112OU,T0
'** 30002
+0011HI,T0
'** 30001
%TSUMI,T0
`;

const sampleBranchKIF = `
手合割：平手
手数----指手---------消費時間--
1 ２六歩(27) ( 0:00/0:00:00)
2 ８四歩(83) ( 0:00/0:00:00)
3 ２五歩(26) ( 0:00/0:00:00)
4 ８五歩(84) ( 0:00/0:00:00)
5 ７八金(69) ( 0:00/0:00:00)
6 ３二金(41) ( 0:00/0:00:00)
7 ３八銀(39) ( 0:00/0:00:00)+
8 ７二銀(71) ( 0:00/0:00:00)
9 中断 ( 0:00/0:00:00)

変化：7手
7 ２四歩(25) ( 0:00/0:00:00)
`;

describe("store/index", () => {
  beforeEach(() => {
    mockGameManager.prototype.on.mockReturnThis();
    mockCSAGameManager.prototype.on.mockReturnThis();
    mockAnalysisManager.prototype.on.mockReturnThis();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    while (useMessageStore().hasMessage) {
      useMessageStore().dequeue();
    }
    useErrorStore().clear();
    useAppSettings().updateAppSettings(defaultAppSettings());
  });

  it("updateUSIInfo", () => {
    vi.useFakeTimers();
    const usi = "position startpos moves 7g7f";
    const store = createStore();
    store.pasteRecord(usi);
    store.updateUSIInfo(101, usi, "Engine A", {
      depth: 8,
      scoreCP: 138,
      pv: ["8c8d", "2g2f", "foo", "bar"],
    });
    vi.runOnlyPendingTimers();
    expect(store.usiMonitors).toHaveLength(1);
    expect(store.usiMonitors[0].sfen).toBe(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL w - 1",
    );
    expect(store.usiMonitors[0].iterations.length).toBe(1);
    expect(store.usiMonitors[0].iterations[0].depth).toBe(8);
    expect(store.usiMonitors[0].iterations[0].score).toBe(138);
    expect(store.usiMonitors[0].iterations[0].pv).toEqual(["8c8d", "2g2f", "foo", "bar"]);
    expect(store.usiMonitors[0].iterations[0].text).toBe("☖８四歩☗２六歩 foo bar");
    store.updateUSIInfo(101, usi, "Engine A", {
      depth: 10,
      scoreCP: 213,
    });
    store.updateUSIPonderInfo(102, usi, "Engine B", {
      depth: 9,
      scoreCP: -89,
    });
    vi.runOnlyPendingTimers();
    expect(store.usiMonitors).toHaveLength(2);
    expect(store.usiMonitors[0].iterations).toHaveLength(2);
    expect(store.usiMonitors[0].iterations[0].depth).toBe(10);
    expect(store.usiMonitors[0].iterations[0].score).toBe(213);
    expect(store.usiMonitors[0].latestIteration).toHaveLength(1);
    expect(store.usiMonitors[0].latestIteration[0].score).toBe(213);
    expect(store.usiMonitors[1].iterations).toHaveLength(1);
    expect(store.usiMonitors[1].iterations[0].depth).toBe(9);
    expect(store.usiMonitors[1].iterations[0].score).toBe(-89);
    expect(store.usiMonitors[1].latestIteration).toHaveLength(1);
    expect(store.usiMonitors[1].latestIteration[0].score).toBe(-89);
  });

  it("candidates", async () => {
    vi.useFakeTimers();
    const usi = "position startpos moves 7g7f";
    const store = createStore();
    store.pasteRecord(usi);
    expect(store.candidates).toHaveLength(0);

    store.updateUSIInfo(101, usi, "Engine A", {
      multipv: 1,
      scoreCP: 83,
      pv: ["8c8d", "2g2f"],
    });
    store.updateUSIInfo(101, usi, "Engine A", {
      multipv: 2,
      scoreCP: 0,
      pv: ["4a3b", "2g2f"],
    });
    store.updateUSIInfo(101, usi, "Engine A", {
      multipv: 3,
      scoreCP: -5,
      pv: ["3c3d", "2g2f"],
    });
    store.updateUSIInfo(101, usi, "Engine A", {
      multipv: 4,
      scoreCP: -21,
      pv: ["5c5d", "2g2f"],
    });
    store.updateUSIInfo(102, usi, "Engine B", {
      scoreCP: -5,
      pv: ["9c9d", "9g9f"],
    });
    store.updateUSIInfo(103, usi, "Engine C", {
      multipv: 1,
      scoreMate: 3,
      pv: ["3c3d", "5g5f"],
    });
    store.updateUSIInfo(103, usi, "Engine C", {
      multipv: 2,
      scoreCP: 150,
      pv: ["1c1d", "5g5f"],
    });
    store.updateUSIInfo(103, usi, "Engine C", {
      multipv: 3,
      scoreMate: -5,
      pv: ["7c7d", "5g5f"],
    });
    vi.runOnlyPendingTimers();

    await useAppSettings().updateAppSettings({ maxArrowsPerEngine: 3 });
    expect(store.candidates).toHaveLength(4);
    expect(store.candidates[0].usi).toBe("8c8d");
    expect(store.candidates[1].usi).toBe("4a3b");
    expect(store.candidates[2].usi).toBe("3c3d");
    expect(store.candidates[3].usi).toBe("9c9d");

    await useAppSettings().updateAppSettings({ maxArrowsPerEngine: 1 });
    expect(store.candidates).toHaveLength(3);
    expect(store.candidates[0].usi).toBe("8c8d");
    expect(store.candidates[1].usi).toBe("9c9d");
    expect(store.candidates[2].usi).toBe("3c3d");

    await useAppSettings().updateAppSettings({ maxArrowsPerEngine: 0 });
    expect(store.candidates).toHaveLength(0);
  });

  it("updateUSIPonderInfo", () => {
    vi.useFakeTimers();
    const usi = "position startpos moves 7g7f";
    const usi2 = "position startpos moves 7g7f 3c3d";
    const store = createStore();
    store.pasteRecord(usi);
    store.updateUSIPonderInfo(101, usi2, "Engine A", {
      depth: 8,
      scoreCP: 138,
    });
    vi.runOnlyPendingTimers();
    expect(store.usiMonitors[0].sfen).toBe(
      "lnsgkgsnl/1r5b1/pppppp1pp/6p2/9/2P6/PP1PPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    expect(store.usiMonitors[0].ponderMove).toBe("☖３四歩");
    expect(store.usiMonitors[0].iterations.length).toBe(1);
    expect(store.usiMonitors[0].iterations[0].depth).toBe(8);
    expect(store.usiMonitors[0].iterations[0].score).toBe(138);
  });

  it("startGame/success", async () => {
    mockAPI.saveGameSettings.mockResolvedValue();
    mockGameManager.prototype.start.mockResolvedValue();
    const store = createStore();
    store.showGameDialog();
    store.startGame(gameSettings10m30s);
    expect(useBusyState().isBusy).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.GAME);
    expect(mockAPI.saveGameSettings).toBeCalledTimes(1);
    expect(mockAPI.saveGameSettings.mock.calls[0][0]).toBe(gameSettings10m30s);
    expect(mockGameManager.prototype.start).toBeCalledTimes(1);
    expect(mockGameManager.prototype.start.mock.calls[0][0]).toBe(gameSettings10m30s);
  });

  it("startGame/invalidState", () => {
    const store = createStore();
    store.showAnalysisDialog();
    store.startGame(gameSettings10m30s);
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.ANALYSIS_DIALOG);
  });

  it("loginCSAGame/success", async () => {
    mockAPI.loadCSAGameSettingsHistory.mockResolvedValue(emptyCSAGameSettingsHistory);
    mockAPI.saveCSAGameSettingsHistory.mockResolvedValue();
    mockCSAGameManager.prototype.login.mockResolvedValue();
    const store = createStore();
    store.showCSAGameDialog();
    store.loginCSAGame(csaGameSettings, { saveHistory: true });
    expect(useBusyState().isBusy).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.CSA_GAME);
    expect(mockAPI.loadCSAGameSettingsHistory).toBeCalledTimes(1);
    expect(mockAPI.saveCSAGameSettingsHistory).toBeCalledTimes(1);
    expect(mockAPI.saveCSAGameSettingsHistory.mock.calls[0][0]).toStrictEqual(
      singleCSAGameSettingsHistory,
    );
    expect(mockCSAGameManager.prototype.login).toBeCalledTimes(1);
    expect(mockCSAGameManager.prototype.login.mock.calls[0][0]).toBe(csaGameSettings);
  });

  it("loginCSAGame/doNotSaveHistory", async () => {
    mockAPI.loadCSAGameSettingsHistory.mockResolvedValue(emptyCSAGameSettingsHistory);
    mockAPI.saveCSAGameSettingsHistory.mockResolvedValue();
    mockCSAGameManager.prototype.login.mockResolvedValue();
    const store = createStore();
    store.showCSAGameDialog();
    store.loginCSAGame(csaGameSettings, { saveHistory: false });
    expect(useBusyState().isBusy).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.CSA_GAME);
    expect(mockAPI.loadCSAGameSettingsHistory).toBeCalledTimes(0);
    expect(mockAPI.saveCSAGameSettingsHistory).toBeCalledTimes(0);
    expect(mockCSAGameManager.prototype.login).toBeCalledTimes(1);
    expect(mockCSAGameManager.prototype.login.mock.calls[0][0]).toBe(csaGameSettings);
  });

  it("loginCSAGame/invalidState", () => {
    const store = createStore();
    store.loginCSAGame(csaGameSettings, { saveHistory: true });
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.NORMAL);
  });

  it("startResearch/success", async () => {
    mockAPI.saveResearchSettings.mockResolvedValue();
    mockUSIPlayer.prototype.launch.mockResolvedValue();
    mockUSIPlayer.prototype.startResearch.mockResolvedValue();
    const store = createStore();
    store.showResearchDialog();
    store.startResearch(researchSettings);
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.researchState).toBe(ResearchState.RUNNING);
    expect(mockAPI.saveResearchSettings).toBeCalledTimes(1);
    expect(mockUSIPlayer).toBeCalledTimes(1);
    expect(mockUSIPlayer.mock.calls[0][0]).toBe(researchSettings.usi);
    expect(mockUSIPlayer.prototype.launch).toBeCalledTimes(1);
    // FIXME: 遅延実行の導入によってすぐに呼ばれなくなった。
    //expect(mockUSIPlayer.prototype.startResearch).toBeCalledTimes(1);
    mockUSIPlayer.prototype.close.mockResolvedValue();
    store.stopResearch();
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.NORMAL);
    expect(mockUSIPlayer.prototype.close).toBeCalledTimes(1);
  });

  it("startResearch/invalidState", () => {
    const store = createStore();
    store.startResearch(researchSettings);
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.NORMAL);
  });

  it("startAnalysis/success", async () => {
    mockAPI.saveAnalysisSettings.mockResolvedValue();
    mockAnalysisManager.prototype.start.mockResolvedValue();
    const store = createStore();
    store.showAnalysisDialog();
    store.startAnalysis(analysisSettings);
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.ANALYSIS);
    expect(mockAPI.saveAnalysisSettings).toBeCalledTimes(1);
    expect(mockAPI.saveAnalysisSettings.mock.calls[0][0]).toBe(analysisSettings);
    expect(mockAnalysisManager).toBeCalledTimes(1);
    expect(mockAnalysisManager.prototype.start).toBeCalledTimes(1);
    expect(mockAnalysisManager.prototype.start.mock.calls[0][0]).toBe(analysisSettings);
  });

  it("startAnalysis/invalidState", () => {
    const store = createStore();
    store.startAnalysis(analysisSettings);
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.appState).toBe(AppState.NORMAL);
  });

  it("doMove", () => {
    mockAudio.playPieceBeat.mockReturnValue();
    const store = createStore();
    store.doMove(store.record.position.createMoveByUSI("7g7f") as Move);
    store.doMove(store.record.position.createMoveByUSI("3c3d") as Move);
    store.doMove(store.record.position.createMoveByUSI("2g2f") as Move);
    expect(store.record.current.ply).toBe(3);
    expect(store.record.position.sfen).toBe(
      "lnsgkgsnl/1r5b1/pppppp1pp/6p2/9/2P4P1/PP1PPPP1P/1B5R1/LNSGKGSNL w - 1",
    );
  });

  it("resetRecord", async () => {
    mockAPI.showOpenRecordDialog.mockResolvedValueOnce("/test/sample.kif");
    mockAPI.openRecord.mockResolvedValueOnce(
      new Uint8Array(convert(sampleKIF, { type: "arraybuffer", to: "SJIS" })),
    );
    const store = createStore();
    store.openRecord();
    await new Promise((resolve) => setTimeout(resolve));
    expect(store.record.moves.length).not.toBe(1);
    expect(store.recordFilePath).not.toBeUndefined();
    store.resetRecord();
    expect(useConfirmationStore().message).toBe("現在の棋譜は削除されます。よろしいですか？");
    useConfirmationStore().ok();
    expect(store.record.moves.length).toBe(1);
    expect(store.recordFilePath).toBeUndefined();
  });

  it("removeCurrentMove", () => {
    const store = createStore();
    store.pasteRecord(sampleBranchKIF);
    store.changePly(8);
    store.removeCurrentMove();
    expect(useConfirmationStore().message).toBeUndefined();
    expect(store.record.current.ply).toBe(7);
    expect(store.record.moves.length).toBe(8);
    store.removeCurrentMove();
    expect(useConfirmationStore().message).toBeUndefined();
    expect(store.record.current.ply).toBe(6);
    expect(store.record.moves.length).toBe(8);
    store.removeCurrentMove();
    expect(useConfirmationStore().message).toBe("6手目以降を削除します。よろしいですか？");
    useConfirmationStore().cancel();
    expect(store.record.current.ply).toBe(6);
    expect(store.record.moves.length).toBe(8);
    store.removeCurrentMove();
    expect(useConfirmationStore().message).toBe("6手目以降を削除します。よろしいですか？");
    useConfirmationStore().ok();
    expect(store.record.current.ply).toBe(5);
    expect(store.record.moves.length).toBe(6);
  });

  it("copyRecordKIF", () => {
    const writeText = vi.fn();
    vi.spyOn(global, "navigator", "get").mockReturnValueOnce(
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      }),
    );
    const store = createStore();
    store.copyRecordKIF();
    expect(writeText).toBeCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toBe(
      "手合割：平手\r\n" + "手数----指手---------消費時間--\r\n",
    );
  });

  it("copyRecordCSA", () => {
    const writeText = vi.fn();
    vi.spyOn(global, "navigator", "get").mockReturnValueOnce(
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      }),
    );
    const store = createStore();
    store.copyRecordCSA();
    expect(writeText).toBeCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toBe("V2.2\r\nPI\r\n+\r\n");
  });

  it("copyRecordCSA/v3", async () => {
    const writeText = vi.fn();
    vi.spyOn(global, "navigator", "get").mockReturnValueOnce(
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      }),
    );
    await useAppSettings().updateAppSettings({ useCSAV3: true });
    const store = createStore();
    store.copyRecordCSA();
    expect(writeText).toBeCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toBe("'CSA encoding=UTF-8\r\nV3.0\r\nPI\r\n+\r\n");
  });

  it("copyRecordUSEN", () => {
    const writeText = vi.fn();
    vi.spyOn(global, "navigator", "get").mockReturnValueOnce(
      Object.assign(navigator, {
        clipboard: {
          writeText,
        },
      }),
    );
    const store = createStore();
    store.copyRecordUSEN();
    expect(writeText).toBeCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toBe("~0..");
  });

  it("pasteRecord/kif/success", () => {
    const store = createStore();
    store.pasteRecord(sampleKIF);
    const moves = store.record.moves;
    expect(moves.length).toBe(11);
    expect(moves[1].comment).toBe("通常コメント\n");
    expect(moves[1].customData).toStrictEqual({});
    expect(moves[2].comment).toBe("#評価値=108\n");
    const customData = moves[2].customData as RecordCustomData;
    expect(customData.researchInfo?.score).toBe(108);
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.isRecordFileUnsaved).toBeTruthy();
  });

  it("pasteRecord/csa/success", () => {
    const store = createStore();
    store.pasteRecord(sampleCSA);
    const moves = store.record.moves;
    expect(moves.length).toBe(13);
    store.changePly(1);
    expect(store.record.current.comment).toBe("初手へのコメント\n* 30011 2b2a\n");
    const customData1 = store.record.current.customData as RecordCustomData;
    expect(customData1.playerSearchInfo?.score).toBe(30011);
    store.changePly(2);
    expect(store.record.current.comment).toBe("* 30010\n");
    const customData2 = store.record.current.customData as RecordCustomData;
    expect(customData2.playerSearchInfo?.score).toBe(30010);
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.isRecordFileUnsaved).toBeTruthy();
  });

  it("pasteRecord/usen/success", () => {
    const store = createStore();
    store.pasteRecord("~0.6y236e7ku4be.r");
    expect(store.record.getUSI({ allMoves: true })).toBe(
      "position startpos moves 2g2f 8c8d 7g7f 8d8e",
    );
  });

  it("pasteRecord/invalidState", () => {
    const store = createStore();
    store.showGameDialog();
    store.pasteRecord(sampleKIF);
    const moves = store.record.moves;
    expect(moves.length).toBe(1);
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.isRecordFileUnsaved).toBeFalsy();
  });

  it("openRecord/kif/success", async () => {
    mockAPI.showOpenRecordDialog.mockResolvedValue("/test/sample.kif");
    mockAPI.openRecord.mockResolvedValue(
      new Uint8Array(convert(sampleKIF, { type: "arraybuffer", to: "SJIS" })),
    );
    const store = createStore();
    store.openRecord();
    expect(useBusyState().isBusy).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(useErrorStore().errors).toStrictEqual([]);
    expect(store.recordFilePath).toBe("/test/sample.kif");
    const moves = store.record.moves;
    expect(moves.length).toBe(11);
    expect(moves[1].comment).toBe("通常コメント\n");
    expect(moves[1].customData).toStrictEqual({});
    expect(moves[2].comment).toBe("#評価値=108\n");
    const customData = moves[2].customData as RecordCustomData;
    expect(customData.researchInfo?.score).toBe(108);
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.isRecordFileUnsaved).toBeFalsy();
  });

  it("openRecord/kif-utf8/success", async () => {
    mockAPI.showOpenRecordDialog.mockResolvedValue("/test/sample.kif");
    mockAPI.openRecord.mockResolvedValue(
      new Uint8Array(convert(sampleKIF, { type: "arraybuffer", to: "UTF8" })),
    );
    const store = createStore();
    store.openRecord();
    expect(useBusyState().isBusy).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(useErrorStore().errors).toStrictEqual([]);
    expect(store.recordFilePath).toBe("/test/sample.kif");
    const moves = store.record.moves;
    expect(moves.length).toBe(11);
    expect(moves[1].comment).toBe("通常コメント\n");
    expect(moves[1].customData).toStrictEqual({});
    expect(moves[2].comment).toBe("#評価値=108\n");
    const customData = moves[2].customData as RecordCustomData;
    expect(customData.researchInfo?.score).toBe(108);
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.isRecordFileUnsaved).toBeFalsy();
  });

  it("openRecord/kifu/success", async () => {
    mockAPI.showOpenRecordDialog.mockResolvedValue("/test/sample.kifu");
    mockAPI.openRecord.mockResolvedValue(
      new Uint8Array(convert(sampleKIF, { type: "arraybuffer", to: "UTF8" })),
    );
    const store = createStore();
    store.openRecord();
    expect(useBusyState().isBusy).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(useErrorStore().errors).toStrictEqual([]);
    expect(store.recordFilePath).toBe("/test/sample.kifu");
    const moves = store.record.moves;
    expect(moves.length).toBe(11);
    expect(moves[1].comment).toBe("通常コメント\n");
    expect(moves[1].customData).toStrictEqual({});
    expect(moves[2].comment).toBe("#評価値=108\n");
    const customData = moves[2].customData as RecordCustomData;
    expect(customData.researchInfo?.score).toBe(108);
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.isRecordFileUnsaved).toBeFalsy();
  });

  it("openRecord/csa/success", async () => {
    mockAPI.showOpenRecordDialog.mockResolvedValue("/test/sample.csa");
    mockAPI.openRecord.mockResolvedValue(new TextEncoder().encode(sampleCSA));
    const store = createStore();
    store.openRecord();
    expect(useBusyState().isBusy).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(useErrorStore().errors).toStrictEqual([]);
    expect(store.recordFilePath).toBe("/test/sample.csa");
    const moves = store.record.moves;
    expect(moves.length).toBe(13);
    expect(useErrorStore().hasError).toBeFalsy();
    expect(mockAPI.showOpenRecordDialog).toBeCalledTimes(1);
    expect(mockAPI.openRecord).toBeCalledTimes(1);
    expect(mockAPI.openRecord.mock.calls[0][0]).toBe("/test/sample.csa");
    expect(store.isRecordFileUnsaved).toBeFalsy();
  });

  it("openRecord/invalidState", () => {
    const store = createStore();
    store.showGameDialog();
    store.openRecord();
    const moves = store.record.moves;
    expect(moves.length).toBe(1);
    expect(useErrorStore().hasError).toBeTruthy();
    expect(store.recordFilePath).toBeUndefined();
  });

  it("openRecord/cancel", async () => {
    mockAPI.showOpenRecordDialog.mockResolvedValue("");
    const store = createStore();
    store.openRecord();
    expect(useBusyState().isBusy).toBeTruthy();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.recordFilePath).toBeUndefined();
    expect(useErrorStore().hasError).toBeFalsy();
  });

  it("saveRecord/success", async () => {
    mockAPI.showSaveRecordDialog.mockResolvedValue("/test/sample.csa");
    mockAPI.saveRecord.mockResolvedValue();
    const store = createStore();
    store.saveRecord();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.recordFilePath).toBe("/test/sample.csa");
    expect(useErrorStore().hasError).toBeFalsy();
    expect(mockAPI.showSaveRecordDialog).toBeCalledTimes(1);
    expect(mockAPI.saveRecord).toBeCalledTimes(1);
    expect(mockAPI.saveRecord.mock.calls[0][0]).toBe("/test/sample.csa");
    const data = new TextDecoder().decode(mockAPI.saveRecord.mock.calls[0][1]);
    expect(data).toMatch(/^V2\.2/);
    expect(store.isRecordFileUnsaved).toBeFalsy();
  });

  it("saveRecord/invalidState", () => {
    const store = createStore();
    store.showGameDialog();
    store.saveRecord();
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.recordFilePath).toBeUndefined();
  });

  it("saveRecord/cancel", async () => {
    mockAPI.showSaveRecordDialog.mockResolvedValue("");
    const store = createStore();
    store.saveRecord();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.recordFilePath).toBeUndefined();
    expect(useErrorStore().hasError).toBeFalsy();
    expect(mockAPI.showSaveRecordDialog).toBeCalledTimes(1);
    expect(mockAPI.saveRecord).toBeCalledTimes(0);
  });

  it("saveRecord/noOverwrite", async () => {
    mockAPI.openRecord.mockResolvedValue(
      new Uint8Array(convert(sampleKIF, { type: "arraybuffer", to: "SJIS" })),
    );
    mockAPI.showSaveRecordDialog.mockResolvedValue("/test/sample2.csa");
    mockAPI.saveRecord.mockResolvedValue();
    const store = createStore();
    store.openRecord("/test/sample1.csa");
    await new Promise((resolve) => setTimeout(resolve));
    store.saveRecord();
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.recordFilePath).toBe("/test/sample2.csa");
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.isRecordFileUnsaved).toBeFalsy();
    expect(mockAPI.showSaveRecordDialog).toBeCalledTimes(1);
    expect(mockAPI.saveRecord).toBeCalledTimes(1);
  });

  it("saveRecord/overwrite", async () => {
    mockAPI.openRecord.mockResolvedValue(
      new Uint8Array(convert(sampleKIF, { type: "arraybuffer", to: "SJIS" })),
    );
    mockAPI.showSaveRecordDialog.mockResolvedValue("/test/sample2.csa");
    mockAPI.saveRecord.mockResolvedValue();
    const store = createStore();
    store.openRecord("/test/sample1.csa");
    await new Promise((resolve) => setTimeout(resolve));
    store.saveRecord({ overwrite: true });
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.recordFilePath).toBe("/test/sample1.csa");
    expect(useErrorStore().hasError).toBeFalsy();
    expect(store.isRecordFileUnsaved).toBeFalsy();
    expect(mockAPI.showSaveRecordDialog).toBeCalledTimes(0);
    expect(mockAPI.saveRecord).toBeCalledTimes(1);
  });

  it("saveRecord/specificFormat", async () => {
    mockAPI.showSaveRecordDialog.mockResolvedValue("/test/sample.jkf");
    mockAPI.saveRecord.mockResolvedValue();
    const store = createStore();
    store.saveRecord({ format: RecordFileFormat.JKF });
    await new Promise((resolve) => setTimeout(resolve));
    expect(useBusyState().isBusy).toBeFalsy();
    expect(store.recordFilePath).toBe("/test/sample.jkf");
    expect(useErrorStore().hasError).toBeFalsy();
    expect(mockAPI.showSaveRecordDialog).toBeCalledTimes(1);
    expect(mockAPI.showSaveRecordDialog.mock.calls[0][0]).toMatch(/\.jkf$/);
    expect(mockAPI.saveRecord).toBeCalledTimes(1);
    expect(mockAPI.saveRecord.mock.calls[0][0]).toBe("/test/sample.jkf");
    const data = new TextDecoder().decode(mockAPI.saveRecord.mock.calls[0][1]);
    expect(data).toMatch(/^\{.*\}$/);
    expect(store.isRecordFileUnsaved).toBeFalsy();
  });

  it("showJishogiPoints", () => {
    const store = createStore();
    // https://denryu-sen.jp/denryusen/dr3_production/dist/#/dr3prd+t_test1_test2-600-2F+aobazero+aobazerotest+20221201210630
    store.pasteRecord(
      "2GK1+L3/2+P+S+R1G+N1/3+B1GG2/9/+r8/1+bs6/+p+p3+n3/2+n2k3/6+p2 b 2SN7P3l7p 375",
    );
    store.showJishogiPoints();
    expect(useMessageStore().message).toStrictEqual({
      text: "持将棋の点数",
      attachments: [
        {
          type: "list",
          items: [
            {
              text: "先手",
              children: [
                "Points (Total): 28",
                "Points (Declaration): 28",
                "Rule-24: DRAW",
                "Rule-27: WIN",
              ],
            },
            {
              text: "後手",
              children: [
                "Points (Total): 26",
                "Points (Declaration): 15",
                "Rule-24: LOSE",
                "Rule-27: LOSE",
              ],
            },
          ],
        },
      ],
    });
  });
});
