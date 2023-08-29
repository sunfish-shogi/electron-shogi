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

export function getAppPath(name: "userData" | "logs" | "exe" | "documents" | "pictures"): string {
  return !isTest() ? app.getPath(name) : fs.mkdtempSync(path.join(os.tmpdir(), `${name}-`));
}
