export type WindowSetting = {
  width: number;
  height: number;
  maximized: boolean;
  fullscreen: boolean;
};

export function defaultWindowSetting(): WindowSetting {
  return {
    width: 1000,
    height: 800,
    maximized: false,
    fullscreen: false,
  };
}

export function normalizeWindowSetting(setting: WindowSetting): WindowSetting {
  return {
    ...defaultWindowSetting(),
    ...setting,
  };
}

interface Window {
  isMaximized(): boolean;
  isFullScreen(): boolean;
  getBounds(): {
    height: number;
    width: number;
  };
}

export function buildWindowSetting(
  latest: WindowSetting,
  win: Window
): WindowSetting {
  const normal = !win.isMaximized() && !win.isFullScreen();
  return {
    height: normal ? win.getBounds().height : latest.height,
    width: normal ? win.getBounds().width : latest.width,
    maximized: win.isMaximized(),
    fullscreen: win.isFullScreen(),
  };
}
