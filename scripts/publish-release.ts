/* eslint-disable no-console,no-restricted-imports */
import fs from "node:fs";
import { promises as readline } from "node:readline";
import { Releases } from "../src/background/version/types";
import semver from "semver";

async function updateReleaseJSON() {
  const releases = JSON.parse(fs.readFileSync("docs/release.json", "utf-8")) as Releases;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log(`Current latest version: ${releases.latest.version}`);
  const latest = semver.clean(
    (await rl.question("Please input new latest version: ")) || releases.latest.version,
  );
  if (!latest) {
    throw new Error("Invalid version");
  }
  console.log(`Current stable version: ${releases.stable.version}`);
  const stable = semver.clean(
    (await rl.question("Please input new stable version: ")) || releases.stable.version,
  );
  if (!stable) {
    throw new Error("Invalid version");
  }
  rl.close();

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
  fs.writeFileSync("docs/release.json", JSON.stringify(releases, null, 1));
}

updateReleaseJSON()
  .then(() => {
    console.log("Updated release.json");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
