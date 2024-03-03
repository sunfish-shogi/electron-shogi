import path from "node:path";
import { getAppPath, getPortableExeDir } from "@/background/proc/env";
import { requireElectron } from "@/background/helpers/portability";

const userDataRoot = getPortableExeDir() || getAppPath("userData");
export const imageCacheDir = path.join(userDataRoot, "image_cache");

export function openCacheDirectory() {
  requireElectron().shell.openPath(imageCacheDir);
}
