import url from "node:url";
import { getAppLogger } from "@/background/log";

export function fileURLToPath(fileURL: string, defaultPath: string): string {
  if (fileURL) {
    try {
      return url.fileURLToPath(fileURL);
    } catch (e) {
      getAppLogger().warn(`invalid file URL: ${fileURL}`);
    }
  }
  return defaultPath;
}
