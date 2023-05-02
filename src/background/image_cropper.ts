import sharp from "sharp";

import fs from "fs";
import { Md5 } from "ts-md5";
import { rootDir } from "./settings";

async function cropImageFromPath(
  imageurl: string,
  x: number,
  y: number,
  w: number,
  h: number,
  destURL: string
) {
  await sharp(imageurl)
    .extract({
      left: x,
      top: y,
      width: w,
      height: h,
    })
    .toFile(destURL);
}

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

export async function shogiGUIStyleCrop(
  srcPath: string,
  destPath: string
): Promise<void> {
  srcPath = srcPath.replace("file://", "");
  destPath = `${rootDir}/pieces/${Md5.hashStr(srcPath)}/`;
  console.log(destPath);

  // create folder if there is no folder

  if (fs.existsSync(destPath)) {
    return;
  }
  fs.mkdirSync(destPath, { recursive: true });

  // return the image width and height

  const width = (await sharp(srcPath).metadata()).width!;
  const height = (await sharp(srcPath).metadata()).height!;
  if (width % 8 != 0 || height % 4 != 0) {
    throw new Error("Invalid image size");
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
      await cropImageFromPath(
        srcPath,
        (j * width) / 8,
        (i * height) / 4,
        width / 8,
        height / 4,
        `${destPath}${side}_${piecesSet[j]}.png`
      );
    }
  }
}
