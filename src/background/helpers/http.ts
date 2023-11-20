import https from "node:https";
import http from "node:http";
import { isProduction } from "@/background/environment";
import { getAppLogger } from "@/background/log";

export function fetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const get = !isProduction() && url.startsWith("http://") ? http.get : https.get;
    getAppLogger().debug(`fetch remote file: ${url}`);
    get(url, (res) => {
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
