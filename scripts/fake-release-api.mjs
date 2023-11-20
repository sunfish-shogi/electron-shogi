import http from "http";
import fs from "fs";

const server = http.createServer((req, res) => {
  const data = fs.readFileSync("docs/release.json", "utf8");
  if (req.url === "/release.json") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(data);
    return;
  }
  res.writeHead(404);
  res.end("not found");
});

server.listen(6173);
