import http from "node:http";
import fs from "node:fs";

const fileNames = ["release.json", "release-win.json", "release-mac.json", "release-linux.json"];

const server = http.createServer((req, res) => {
  for (const fileName of fileNames) {
    if (req.url === `/${fileName}`) {
      const data = fs.readFileSync(`docs/${fileName}`, "utf8");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(data);
      return;
    }
  }
  res.writeHead(404);
  res.end("not found");
});

server.listen(6173);
