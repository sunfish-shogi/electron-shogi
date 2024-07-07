export type WindowSettings = {
  width: number;
  height: number;
  maximized: boolean;
  fullscreen: boolean;
};

export function defaultWindowSettings(): WindowSettings {
  return {
    width: 1000,
    height: 800,
    maximized: false,
    fullscreen: false,
  };
}

export function normalizeWindowSettings(settings: WindowSettings): WindowSettings {
  return {
    ...defaultWindowSettings(),
    ...settings,
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

export function buildWindowSettings(latest: WindowSettings, win: Window): WindowSettings {
  const normal = !win.isMaximized() && !win.isFullScreen();
  return {
    height: normal ? win.getBounds().height : latest.height,
    width: normal ? win.getBounds().width : latest.width,
    maximized: win.isMaximized(),
    fullscreen: win.isFullScreen(),
  };
}
