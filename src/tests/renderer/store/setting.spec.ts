import api, { API } from "@/renderer/ipc/api";
import { Tab, TabPaneType, Thema } from "@/common/settings/app";
import { createAppSetting } from "@/renderer/store/setting";
import { Mocked } from "vitest";

vi.mock("@/renderer/ipc/api");

const mockAPI = api as Mocked<API>;

describe("store/index", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("updateAppSetting/success", async () => {
    mockAPI.saveAppSetting.mockResolvedValue();
    const store = createAppSetting();
    expect(store.thema).toBe(Thema.STANDARD);
    expect(store.pieceVolume).toBe(30);
    expect(store.clockVolume).toBe(30);
    expect(store.tab).toBe(Tab.RECORD_INFO);
    await store.updateAppSetting({
      thema: Thema.DARK,
      pieceVolume: 0,
      tabPaneType: TabPaneType.SINGLE,
      tab: Tab.COMMENT,
    });
    expect(store.thema).toBe(Thema.DARK);
    expect(store.pieceVolume).toBe(0);
    expect(store.clockVolume).toBe(30);
    expect(store.tab).toBe(Tab.COMMENT);
    expect(store.tabPaneType).toBe(TabPaneType.SINGLE);
    await store.updateAppSetting({
      tabPaneType: TabPaneType.DOUBLE,
    });
    expect(store.tab).toBe(Tab.RECORD_INFO); // コメントタブの選択が自動で解除される。
    expect(store.tabPaneType).toBe(TabPaneType.DOUBLE);
    expect(mockAPI.saveAppSetting).toBeCalledTimes(2);
  });

  it("updateAppSetting/error", async () => {
    const store = createAppSetting();
    await expect(() =>
      store.updateAppSetting({
        pieceVolume: -1,
      }),
    ).rejects.toThrow();
    expect(store.pieceVolume).toBe(30);
  });

  it("flipBoard", () => {
    const store = createAppSetting();
    expect(store.boardFlipping).toBeFalsy();
    store.flipBoard();
    expect(store.boardFlipping).toBeTruthy();
    store.flipBoard();
    expect(store.boardFlipping).toBeFalsy();
  });
});
