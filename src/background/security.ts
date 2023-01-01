import { WebFrameMain } from "electron";
import { getAppLogger } from "./log";
import { isDevelopment } from "./environment";

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
  const e = new Error(
    `予期せぬイベントの送信元です。このエラーメッセージを開発者に報告してください。 [${frame.url}]`
  );
  getAppLogger().error(e);
  throw e;
}

function validateHTTPRequestMethod(method: string) {
  if (method === "GET") {
    return;
  }
  const e = new Error(
    `予期せぬHTTPメソッドです。このエラーメッセージを開発者に報告してください。 [${method}]`
  );
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
  const e = new Error(
    `予期せぬURLへのリクエストです。このエラーメッセージを開発者に報告してください。 [${url}]`
  );
  getAppLogger().error(e);
  throw e;
}

export function validateHTTPRequest(method: string, url: string) {
  validateHTTPRequestMethod(method);
  validateHTTPRequestURL(url);
}
