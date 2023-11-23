import { InitialRecordFileRequest } from "@/common/file";
import { getAppLogger } from "./log";
import { isSupportedRecordFilePath } from "./extensions";

let initialFilePath = "";

export function setInitialFilePath(path: string): void {
  initialFilePath = path;
}

export function fetchInitialRecordFileRequest(): InitialRecordFileRequest {
  // macOS
  if (isSupportedRecordFilePath(initialFilePath)) {
    getAppLogger().debug(`record path from open-file event: ${initialFilePath}`);
    return { path: initialFilePath };
  }

  let path = null;
  let ply = undefined;
  // Option:
  //   ShogiGUI/KifuExplorer style:
  //     -n <ply>
  //   KifuBase style:
  //     +<ply>
  for (const arg of process.argv) {
    if (isSupportedRecordFilePath(arg)) {
      path = arg;
    } else if (!isNaN(Number(arg))) {
      ply = Number(arg);
    } else if (arg.match(/^\+\d+$/)) {
      ply = Number(arg.substring(1));
    }
  }
  return path ? { path, ply } : null;
}
