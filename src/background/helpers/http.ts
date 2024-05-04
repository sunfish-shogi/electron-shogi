import https from "node:https";
import http from "node:http";
import { getAppLogger } from "@/background/log";

export function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const get = url.startsWith("http://") ? http.get : https.get;
    getAppLogger().debug(`fetch remote file: ${url}`);
    const req = get(url);
    req.setTimeout(5000, () => {
      reject(new Error(`request timeout: ${url}`));
      req.destroy();
    });
    req.on("error", (e) => {
      reject(new Error(`request failed: ${url}: ${e}`));
    });
    req.on("response", (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`request failed: ${url}: ${res.statusCode}`));
        return;
      }
      let data = "";
      res
        .setEncoding("utf8")
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          resolve(data);
        })
        .on("error", (e) => {
          reject(new Error(`request failed: ${url}: ${e}`));
        });
    });
  });
}
