import { shell } from "electron";
import { readStatus } from "@/background/version/check";

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

export async function openStableReleasePage() {
  const status = await readStatus();
  if (!status.knownReleases) {
    throw new Error("No known releases");
  }
  const tag = status.knownReleases.stable.tag;
  shell.openExternal("https://github.com/sunfish-shogi/electron-shogi/releases/tag/" + tag);
}
