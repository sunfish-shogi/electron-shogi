import { requireElectron } from "@/background/helpers/portability";
import { exists } from "./file";
import { t } from "@/common/i18n";

export function getAppVersion(): string {
  return requireElectron().app.getVersion();
}

export async function openPath(path: string) {
  // 存在しないパスを開こうとした場合の振る舞いがプラットフォームによって異なるため、事前に存在チェックを行う。
  if (!(await exists(path))) {
    throw new Error(t.failedToOpenDirectory(path));
  }
  requireElectron().shell.openPath(path);
}

export function showNotification(title: string, body: string) {
  new (requireElectron().Notification)({
    title,
    body,
    timeoutType: "never",
  }).show();
}
