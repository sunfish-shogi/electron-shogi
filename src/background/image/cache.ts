import path from "path";
import { getAppPath, getPortableExeDir } from "@/background/environment";
import { shell } from "electron";

const userDataRoot = getPortableExeDir() || getAppPath("userData");
export const imageCacheDir = path.join(userDataRoot, "image_cache");

export function openCacheDirectory() {
  shell.openPath(imageCacheDir);
}
