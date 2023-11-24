/* eslint-disable no-console */
import fs from "node:fs";
import { Releases } from "../src/background/version/types";

const releases = JSON.parse(fs.readFileSync("docs/release.json", "utf-8")) as Releases;
const fileNames = ["index.html", "index.en.html", "index.zh_tw.html"];
for (const fileName of fileNames) {
  const template = fs.readFileSync(`docs-templates/${fileName}`, "utf-8");
  const out = template
    .replace(/\$LATEST_VERSION\$/g, releases.latest.version)
    .replace(/\$STABLE_VERSION\$/g, releases.stable.version);
  fs.writeFileSync(`docs/${fileName}`, out);
  console.log(`Updated docs/${fileName}`);
}
