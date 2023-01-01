import { shell } from "electron";

export function openWebSite(): void {
  shell.openExternal("https://sunfish-shogi.github.io/electron-shogi/");
}

export function openHowToUse(): void {
  shell.openExternal(
    "https://github.com/sunfish-shogi/electron-shogi/wiki/%E4%BD%BF%E3%81%84%E6%96%B9"
  );
}

export function checkLatestVersion(): void {
  shell.openExternal(
    "https://github.com/sunfish-shogi/electron-shogi/releases/latest"
  );
}
