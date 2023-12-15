/* eslint-disable no-console,no-restricted-imports */
import fs from "node:fs";
import { Releases } from "../src/background/version/types";
import semver from "semver";

async function updateReleaseJSON() {
  const releases = JSON.parse(fs.readFileSync("docs/release.json", "utf-8")) as Releases;

  console.log(`Current latest version: ${releases.latest.version}`);
  console.log(`Current stable version: ${releases.stable.version}`);

  const latest = semver.clean(
    JSON.parse(fs.readFileSync("package.json", "utf-8")).version,
  ) as string;

  const isMinorUpdate =
    semver.major(latest) !== semver.major(releases.latest.version) ||
    semver.minor(latest) !== semver.minor(releases.latest.version);
  const stable = isMinorUpdate ? releases.latest.version : releases.stable.version;

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
