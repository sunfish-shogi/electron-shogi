import { BrowserWindow, dialog } from "electron";
import { getWebContents, onUpdateAppSetting } from "../ipc";
import fs from "fs";
import path from "path";
import { Rect } from "@/common/graphics";
import { getAppLogger } from "../log";
import { loadAppSetting } from "../settings";

const jpegQuality = 85;

export function exportCapturePNG(rect: Rect): Promise<void> {
  return exportCaptureImage(rect, "png");
}

export function exportCaptureJPEG(rect: Rect): Promise<void> {
  return exportCaptureImage(rect, "jpeg");
}

async function exportCaptureImage(rect: Rect, ext: string): Promise<void> {
  const zoomLevel = getWebContents().getZoomFactor();
  getAppLogger().info(`exportCaptureImage rect=${rect} zoom=${zoomLevel}`);
  const image = await getWebContents().capturePage({
    x: Math.floor(rect.x * zoomLevel),
    y: Math.floor(rect.y * zoomLevel),
    width: Math.floor(rect.width * zoomLevel),
    height: Math.floor(rect.height * zoomLevel),
  });
  const win = BrowserWindow.getFocusedWindow();
  if (!win) {
    throw new Error("Failed to open dialog by unexpected error.");
  }
  const appSetting = await loadAppSetting();
  const ret = await dialog.showSaveDialog(win, {
    defaultPath: path.dirname(appSetting.lastImageExportFilePath),
    properties: ["createDirectory", "showOverwriteConfirmation"],
    filters: [{ name: ext.toUpperCase(), extensions: [ext] }],
  });
  if (ret.canceled || !ret.filePath) {
    return;
  }
  const filePath = ret.filePath;
  onUpdateAppSetting({
    lastImageExportFilePath: filePath,
  });
  switch (ext) {
    case "png":
      fs.promises.writeFile(filePath, image.toPNG());
      break;
    case "jpeg":
      fs.promises.writeFile(filePath, image.toJPEG(jpegQuality));
      break;
  }
}
