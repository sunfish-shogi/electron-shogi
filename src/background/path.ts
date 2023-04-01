import path from "path";
import { getPortableExeDir } from "./environment";

export function resolvePath(filepath: string): string {
  const portableExeDir = getPortableExeDir();
  if (portableExeDir) {
    return path.resolve(portableExeDir, filepath);
  }
  return filepath;
}

export function getRelativePath(filepath: string): string {
  const portableExeDir = getPortableExeDir();
  if (portableExeDir) {
    const relative = path.relative(portableExeDir, filepath);
    if (!relative.startsWith("..")) {
      return relative;
    }
  }
  return filepath;
}
