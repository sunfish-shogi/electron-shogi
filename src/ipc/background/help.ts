import { shell } from "electron";

export function openWebSite(): void {
  shell.openExternal("https://sunfish-shogi.github.io/electron-shogi/");
}

export function openHowToUse(): void {
  shell.openExternal(
    "https://sunfish-shogi.github.io/electron-shogi/how-to-use.html"
  );
}

export function checkLatestVersion(): void {
  shell.openExternal(
    "https://github.com/sunfish-shogi/electron-shogi/releases/latest"
  );
}
