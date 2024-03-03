import * as fs from "fs";
import * as path from "path";

const name = process.argv[2];

const packageJsonFileName = "package.json";
const srcDir = path.join("src/command", name);
const distDir = path.join("dist/command", name);
const outputFilePath = path.join(distDir, packageJsonFileName);
const readmeSrcFilePath = path.join(srcDir, "README.md");
const readmeDistFilePath = path.join(distDir, "README.md");
const licenseSrcFilePath = path.join("LICENSE");
const licenseDistFilePath = path.join(distDir, "LICENSE");

const commonPackageJson = JSON.parse(fs.readFileSync(packageJsonFileName, "utf8"));
const packageJson = {
  ...commonPackageJson,
  name,
  description: `command line tool derived from ElectronShogi(https://github.com/sunfish-shogi/electron-shogi)`,
  private: false,
  publishConfig: {
    access: "public",
  },
  homepage:
    "https://github.com/sunfish-shogi/electron-shogi/blob/main/src/command/usi-csa-bridge#readme",
  main: "index.js",
  bin: {
    cli: "index.js",
  },
  scripts: {},
};
fs.writeFileSync(outputFilePath, JSON.stringify(packageJson, null, 2), "utf8");

fs.copyFileSync(readmeSrcFilePath, readmeDistFilePath);
fs.copyFileSync(licenseSrcFilePath, licenseDistFilePath);
