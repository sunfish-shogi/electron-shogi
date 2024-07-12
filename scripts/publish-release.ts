/* eslint-disable no-console,no-restricted-imports */
import fs from "node:fs";
import { createInterface } from "node:readline/promises";
import { Releases } from "../src/background/version/types";
import * as semver from "semver";

const releaseJSON = "docs/release.json";
const releaseWinJSON = "docs/release-win.json";
const releaseMacJSON = "docs/release-mac.json";
const releaseLinuxJSON = "docs/release-linux.json";

const stdio = createInterface({
  input: process.stdin,
  output: process.stdout,
});

type Target = "stable" | "latest";

async function getTarget(): Promise<Target> {
  const value = process.argv[2];
  switch (value) {
    case "":
    case undefined:
      return "latest";
    case "stable":
    case "latest":
      return value as Target;
    default:
      throw new Error("Invalid target");
  }
}

async function inputPlatforms(): Promise<string[]> {
  const paths = [] as string[];
  if (!(await stdio.question(`Do you want to update ${releaseWinJSON}? [Y/n]:`)).match(/^n/i)) {
    paths.push(releaseWinJSON);
  }
  if (!(await stdio.question(`Do you want to update ${releaseMacJSON}? [Y/n]:`)).match(/^n/i)) {
    paths.push(releaseMacJSON);
  }
  if (!(await stdio.question(`Do you want to update ${releaseLinuxJSON}? [Y/n]:`)).match(/^n/i)) {
    paths.push(releaseLinuxJSON);
  }
  return paths;
}

async function updateReleaseJSON(target: Target) {
  const releases = JSON.parse(fs.readFileSync(releaseJSON, "utf-8")) as Releases;

  console.log(`Current latest version: ${releases.latest.version}`);
  console.log(`Current stable version: ${releases.stable.version}`);

  let latest: string;
  let stable: string;

  if (target === "stable") {
    const stableSemver = semver.parse(releases.stable.version);
    if (!stableSemver) {
      throw new Error("Invalid stable version");
    }
    stableSemver.patch++;

    latest = releases.latest.version;
    stable = stableSemver.format() as string;
  } else {
    latest = semver.clean(JSON.parse(fs.readFileSync("package.json", "utf-8")).version) as string;

    const isMinorUpdate =
      semver.major(latest) !== semver.major(releases.latest.version) ||
      semver.minor(latest) !== semver.minor(releases.latest.version);
    stable = isMinorUpdate ? releases.latest.version : releases.stable.version;
  }

  console.log(`New latest version: ${latest}`);
  console.log(`New stable version: ${stable}`);

  releases.stable = {
    version: stable,
    tag: `v${stable}`,
    link: `https://github.com/sunfish-shogi/electron-shogi/releases/tag/v${stable}`,
  };
  releases.latest = {
    version: latest,
    tag: `v${latest}`,
    link: `https://github.com/sunfish-shogi/electron-shogi/releases/tag/v${latest}`,
  };
  const json = JSON.stringify(releases, null, 1);
  fs.writeFileSync(releaseJSON, json);
}

async function main() {
  const target = await getTarget();
  const paths = await inputPlatforms();
  await updateReleaseJSON(target);
  for (const path of paths) {
    fs.copyFileSync(releaseJSON, path);
  }
  console.log("updated.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    stdio.close();
  });
