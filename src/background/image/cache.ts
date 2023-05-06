import path from "path";
import { app } from "electron";
import { getPortableExeDir, isTest } from "@/background/environment";

const userDataRoot =
  getPortableExeDir() || !isTest() ? app.getPath("userData") : "";
export const imageCacheDir = path.join(userDataRoot, "image_cache");
