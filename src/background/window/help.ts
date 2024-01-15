import { shell } from "electron";
import { readStatus } from "@/background/version/check";
import { sendError } from "./ipc";

export function openWebSite(): void {
  shell.openExternal("https://sunfish-shogi.github.io/electron-shogi/");
}

export function openHowToUse(): void {
  shell.openExternal(
    "https://github.com/sunfish-shogi/electron-shogi/wiki/%E4%BD%BF%E3%81%84%E6%96%B9",
  );
}

export function openLatestReleasePage(): void {
  shell.openExternal("https://github.com/sunfish-shogi/electron-shogi/releases/latest");
}

export function openStableReleasePage(): void {
  readStatus()
    .then((status) => {
      if (!status.knownReleases) {
        throw new Error("No known releases");
      }
      const tag = status.knownReleases.stable.tag;
      shell.openExternal("https://github.com/sunfish-shogi/electron-shogi/releases/tag/" + tag);
    })
    .catch((error) => {
      sendError(error);
    });
}
