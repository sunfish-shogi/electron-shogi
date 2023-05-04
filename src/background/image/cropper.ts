import path from "path";
import sharp from "sharp";
import fs from "fs";
import { fileURLToPath } from "node:url";
import { getAppLogger } from "../log";

const pieces = [
  "king2",
  "rook",
  "bishop",
  "gold",
  "silver",
  "knight",
  "lance",
  "pawn",
];
const promPieces = [
  "king",
  "dragon",
  "horse",
  "",
  "prom_silver",
  "prom_knight",
  "prom_lance",
  "prom_pawn",
];

export async function cropPieceImage(
  srcURL: string,
  destDir: string
): Promise<void> {
  srcURL = fileURLToPath(srcURL);
  getAppLogger().debug(
    `generate cropped piece images: src=${srcURL} dst=${destDir}`
  );
  // create folder if there is no folder
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  // return the image width and height
  const pic = sharp(srcURL);
  const metadata = await pic.metadata();
  let width = metadata.width;
  let height = metadata.height;
  if (!width || !height) {
    throw new Error("cannot get image metadata");
  } else {
    width = width / 8;
    height = height / 4;
  }

  for (let i = 0; i < 4; i++) {
    let side = "";
    switch (i) {
      case 0:
      case 1:
        side = "black";
        break;
      case 2:
      case 3:
        side = "white";
        break;
    }
    for (let j = 0; j < 8; j++) {
      if ((i == 1 && j == 3) || (i == 3 && j == 3)) {
        continue; // "promoted gold" escape
      }

      let piecesSet: string[] = [];
      switch (i) {
        case 0:
        case 2:
          piecesSet = pieces;
          break;
        case 1:
        case 3:
          piecesSet = promPieces;
          break;
      }
      if (!fs.existsSync(path.join(destDir, `${side}_${piecesSet[j]}.png`))) {
        console.log(`${j * width}, ${i * height}, ${width}, ${height}`);
        sharp(srcURL)
          .extract({
            left: j * width,
            top: i * height,
            width: width,
            height: height,
          })
          .resize(width, height)
          .toFile(path.join(destDir, `${side}_${piecesSet[j]}.png`));
        getAppLogger().debug(`${side}_${piecesSet[j]}.png extracted`);
      } else {
        getAppLogger().debug(`${side}_${piecesSet[j]}.png exists`);
      }
    }
  }
}
