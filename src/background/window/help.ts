import { shell } from "electron";
import { readStatus } from "@/background/version/check";
import {
  howToUseWikiPageURL,
  latestReleaseURL,
  stableReleaseURL,
  websiteURL,
} from "@/common/links/github";

export function openWebsite(): void {
  shell.openExternal(websiteURL);
}

export function openHowToUse(): void {
  shell.openExternal(howToUseWikiPageURL);
}

export function openLatestReleasePage(): void {
  shell.openExternal(latestReleaseURL);
}

export async function openStableReleasePage() {
  const status = await readStatus();
  if (!status.knownReleases) {
    throw new Error("No known releases");
  }
  const tag = status.knownReleases.stable.tag;
  shell.openExternal(stableReleaseURL(tag));
}
