import api, { API } from "@/renderer/ipc/api";
import { Tab, TabPaneType, Thema } from "@/common/settings/app";
import { createAppSettings } from "@/renderer/store/settings";
import { Mocked } from "vitest";

vi.mock("@/renderer/ipc/api");

const mockAPI = api as Mocked<API>;

describe("store/index", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("updateAppSettings/success", async () => {
    mockAPI.saveAppSettings.mockResolvedValue();
    const store = createAppSettings();
    expect(store.thema).toBe(Thema.STANDARD);
    expect(store.pieceVolume).toBe(30);
    expect(store.clockVolume).toBe(30);
    expect(store.tab).toBe(Tab.RECORD_INFO);
    await store.updateAppSettings({
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
    await store.updateAppSettings({
      tabPaneType: TabPaneType.DOUBLE,
    });
    expect(store.tab).toBe(Tab.RECORD_INFO); // コメントタブの選択が自動で解除される。
    expect(store.tabPaneType).toBe(TabPaneType.DOUBLE);
    expect(mockAPI.saveAppSettings).toBeCalledTimes(2);
  });

  it("updateAppSettings/error", async () => {
    const store = createAppSettings();
    await expect(() =>
      store.updateAppSettings({
        pieceVolume: -1,
      }),
    ).rejects.toThrow();
    expect(store.pieceVolume).toBe(30);
  });

  it("flipBoard", () => {
    const store = createAppSettings();
    expect(store.boardFlipping).toBeFalsy();
    store.flipBoard();
    expect(store.boardFlipping).toBeTruthy();
    store.flipBoard();
    expect(store.boardFlipping).toBeFalsy();
  });
});
