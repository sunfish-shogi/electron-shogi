import {
  buildWindowSetting,
  normalizeWindowSetting,
} from "@/common/settings/window";

describe("settings/window", () => {
  it("buildWindowSetting", () => {
    const baseSetting = {
      width: 1000,
      height: 800,
      maximized: true,
      fullscreen: false,
    };
    expect(
      buildWindowSetting(baseSetting, {
        isMaximized: () => false,
        isFullScreen: () => false,
        getBounds() {
          return {
            width: 1100,
            height: 900,
          };
        },
      })
    ).toStrictEqual({
      width: 1100,
      height: 900,
      maximized: false,
      fullscreen: false,
    });
    expect(
      buildWindowSetting(baseSetting, {
        isMaximized: () => true,
        isFullScreen: () => false,
        getBounds() {
          return {
            width: 1100,
            height: 900,
          };
        },
      })
    ).toStrictEqual({
      width: 1000,
      height: 800,
      maximized: true,
      fullscreen: false,
    });
    expect(
      buildWindowSetting(baseSetting, {
        isMaximized: () => false,
        isFullScreen: () => true,
        getBounds() {
          return {
            width: 1100,
            height: 900,
          };
        },
      })
    ).toStrictEqual({
      width: 1000,
      height: 800,
      maximized: false,
      fullscreen: true,
    });
  });

  it("normalize", () => {
    const setting = {
      width: 2000,
      height: 1500,
      maximized: true,
      fullscreen: true,
    };
    const result = normalizeWindowSetting(setting);
    expect(result).toStrictEqual(setting);
  });
});
