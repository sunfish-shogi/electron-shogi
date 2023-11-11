import { Notification, app } from "electron";
import { getAppLogger } from "@/background/log";

export function getAppVersion(): string {
  return app.getVersion();
}

export function showNotification(title: string, body: string) {
  getAppLogger().debug(`show notification: ${title}: ${body}`);
  new Notification({
    title,
    body,
    timeoutType: "never",
  }).show();
}
