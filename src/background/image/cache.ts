import path from "node:path";
import { getAppPath, getPortableExeDir } from "@/background/proc/env";
import { openPath } from "@/background/helpers/electron";

const userDataRoot = getPortableExeDir() || getAppPath("userData");
export const imageCacheDir = path.join(userDataRoot, "image_cache");

export function openCacheDirectory(): Promise<void> {
  return openPath(imageCacheDir);
}
