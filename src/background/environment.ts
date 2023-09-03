import { app } from "electron";
import fs from "fs";
import os from "os";
import path from "path";

export function isDevelopment(): boolean {
  return process.env.npm_lifecycle_event === "electron:serve" && !isTest();
}

export function isPreview(): boolean {
  return process.env.npm_lifecycle_event === "electron:preview";
}

export function isTest(): boolean {
  return process.env.NODE_ENV === "test";
}

export function isProduction(): boolean {
  return !isDevelopment() && !isPreview() && !isTest();
}

export function isPortable(): boolean {
  return process.env.PORTABLE_EXECUTABLE_DIR !== undefined;
}

export function getPortableExeDir(): string | undefined {
  return process.env.PORTABLE_EXECUTABLE_DIR;
}

let tempPathForTesting: string;

export function getTempPathForTesting(): string {
  if (!tempPathForTesting) {
    tempPathForTesting = fs.mkdtempSync(path.join(os.tmpdir(), "electron-shogi-test-"));
  }
  return tempPathForTesting;
}

export function getAppPath(name: "userData" | "logs" | "exe" | "documents" | "pictures"): string {
  if (isTest()) {
    const tempPath = path.join(getTempPathForTesting(), name);
    fs.mkdirSync(tempPath, { recursive: true });
    return tempPath;
  }
  return app.getPath(name);
}
