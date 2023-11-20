import fs from "node:fs";
import { promises as readline } from "node:readline";
import { Releases } from "../src/background/version/types";
import semver from "semver";

async function updateReleaseJSON(): Promise<Releases> {
  const releases = JSON.parse(fs.readFileSync("docs/release.json", "utf-8")) as Releases;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  console.log(`Current latest version: ${releases.latest.version}`);
  const latest = semver.clean(await rl.question("Please input new latest version: "));
  if (!latest) {
    throw new Error("Invalid version");
  }
  console.log(`Current stable version: ${releases.stable.version}`);
  const stable = semver.clean(await rl.question("Please input new table version: "));
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
  return releases;
}

async function updateWebsite(releases: Releases) {
  const fileNames = ["index.html", "index.en.html", "index.zh_tw.html"];
  for (const fileName of fileNames) {
    const template = fs.readFileSync(`docs-templates/${fileName}`, "utf-8");
    const out = template
      .replace(/\$LATEST_VERSION\$/g, releases.latest.version)
      .replace(/\$STABLE_VERSION\$/g, releases.stable.version);
    fs.writeFileSync(`docs/${fileName}`, out);
  }
}

updateReleaseJSON().then((releases) => {
  updateWebsite(releases);
});
