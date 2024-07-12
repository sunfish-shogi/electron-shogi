/* eslint-disable no-console */
import { createInterface } from "node:readline";

start();

function start() {
  process.stdin.setEncoding("utf8");
  createInterface({
    input: process.stdin,
  }).on("line", onReadLine);
}

function onReadLine(line) {
  if (line === "usi") {
    console.log("id name ShogiHomeDummyEngine");
    console.log("id author Ryosuke Kubo");
    console.log("option name StringA type string default foo");
    console.log("option name StringB type string");
    console.log("option name StringC type string default <empty>");
    console.log("option name FilenameA type filename default foo");
    console.log("option name FilenameB type filename");
    console.log("option name FilenameC type filename default <empty>");
    console.log("option name CheckA type check default true");
    console.log("option name CheckB type check");
    console.log("option name SpinA type spin default 10 min 0 max 100");
    console.log("option name SpinB type spin");
    console.log(
      "option name ComboA type combo default Foo var Foo var Bar var Baz var Qux var Quux",
    );
    console.log("option name ComboB type combo var Foo var Bar var Baz var Qux var Quux");
    console.log("option name Button type button");
    console.log("usiok");
  } else if (line === "isready") {
    console.log("readyok");
  } else if (line.startsWith("go mate ")) {
    console.log("checkmate notimplemented");
  } else if (line.startsWith("go ")) {
    console.log("bestmove resign");
  } else if (line === "quit") {
    process.exit(0);
  }
}
