import { WebFrameMain } from "electron";
import { getAppLogger } from "./log";
import { isDevelopment } from "./environment";
import { t } from "@/common/i18n";

const allowedIPCSenders = [
  { protocol: "http:", host: /^localhost:[0-9]+$/ },
  { protocol: "file:", host: /^$/ },
];

export function validateIPCSender(frame: WebFrameMain) {
  const u = new URL(frame.url);
  for (const allowed of allowedIPCSenders) {
    if (u.protocol === allowed.protocol && allowed.host.test(u.host)) {
      return;
    }
  }
  const e = new Error(t.unexpectedEventSenderPleaseReport(frame.url));
  getAppLogger().error(e);
  throw e;
}

function validateHTTPRequestMethod(method: string) {
  if (method === "GET") {
    return;
  }
  const e = new Error(t.unexpectedHTTPMethodPleaseReport(method));
  getAppLogger().error(e);
  throw e;
}

const allowedHTTPRequestURLs = [
  { protocol: "http:", host: /^localhost:[0-9]+$/ },
  { protocol: "ws:", host: /^localhost:[0-9]+$/ },
  { protocol: "file:", host: /^$/ },
  { protocol: "devtools:", host: /^devtools$/ },
];

function validateHTTPRequestURL(url: string) {
  if (isDevelopment()) {
    return;
  }
  const u = new URL(url);
  for (const allowed of allowedHTTPRequestURLs) {
    if (u.protocol === allowed.protocol && allowed.host.test(u.host)) {
      return;
    }
  }
  const e = new Error(t.unexpectedRequestURLPleaseReport(url));
  getAppLogger().error(e);
  throw e;
}

export function validateHTTPRequest(method: string, url: string) {
  validateHTTPRequestMethod(method);
  validateHTTPRequestURL(url);
}
