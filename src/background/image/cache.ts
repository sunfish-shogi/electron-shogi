import path from "node:path";
import { getAppPath, getPortableExeDir } from "@/background/proc/env";
import { shell } from "electron";

const userDataRoot = getPortableExeDir() || getAppPath("userData");
export const imageCacheDir = path.join(userDataRoot, "image_cache");

export function openCacheDirectory() {
  shell.openPath(imageCacheDir);
}
