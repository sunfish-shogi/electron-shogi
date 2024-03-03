import { getAppLogger } from "@/background/log";
import { requireElectron } from "@/background/helpers/portability";

export function getAppVersion(): string {
  return requireElectron().app.getVersion();
}

export function showNotification(title: string, body: string) {
  getAppLogger().debug(`show notification: ${title}: ${body}`);
  new (requireElectron().Notification)({
    title,
    body,
    timeoutType: "never",
  }).show();
}
