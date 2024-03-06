import { t } from "@/common/i18n";
import { Notification } from "electron";
import { loadAppSetting } from "@/background/settings";
import { cropPieceImage } from "@/background/image/cropper";
import { AppSettingUpdate, PieceImageType } from "@/common/settings/app";

export async function refreshCustomPieceImages(
  onUpdateAppSetting: (update: AppSettingUpdate) => void,
) {
  const appSettings = await loadAppSetting();
  if (appSettings.pieceImage !== PieceImageType.CUSTOM_IMAGE || !appSettings.pieceImageFileURL) {
    throw new Error("No custom piece image is in use.");
  }
  await cropPieceImage(appSettings.pieceImageFileURL, {
    deleteMargin: appSettings.deletePieceImageMargin,
    overwrite: true,
  });
  onUpdateAppSetting({
    croppedPieceImageQuery: `updated=${Date.now()}`,
  });
}

export function sendTestNotification() {
  new Notification({
    title: t.electronShogi,
    body: t.thisIsTestNotification,
  }).show();
}
