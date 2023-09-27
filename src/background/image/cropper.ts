import path from "path";
import url from "url";
import crypto from "crypto";
import { promises as fs } from "fs";
import { getAppLogger } from "../log";
import Jimp from "jimp";
import { imageCacheDir } from "./cache";
import { exists } from "../helpers/file";

const marginRatio = 0.05;

type PieceImageOptions = {
  deleteMargin?: boolean;
};

function getCroppedPieceImageDir(srcURL: string, opt?: PieceImageOptions): string {
  let md5 = crypto.createHash("md5").update(srcURL).digest("hex");
  if (opt?.deleteMargin) {
    md5 += "_nmgn";
  }
  return path.join(imageCacheDir, "pieces", md5);
}

const pieces = ["king", "rook", "bishop", "gold", "silver", "knight", "lance", "pawn"];

const promPieces = [
  "king2",
  "dragon",
  "horse",
  "",
  "prom_silver",
  "prom_knight",
  "prom_lance",
  "prom_pawn",
];

export async function cropPieceImage(srcURL: string, opt?: PieceImageOptions): Promise<string> {
  const srcPath = url.fileURLToPath(srcURL);
  const destDir = getCroppedPieceImageDir(srcURL, opt);
  getAppLogger().debug(`generate cropped piece images: src=${srcPath} dst=${destDir}`);

  // create folder if there is no folder
  if (!(await exists(destDir))) {
    await fs.mkdir(destDir, { recursive: true });
  }
  const pic = await Jimp.read(srcPath);
  let width: number = pic.getWidth();
  let height: number = pic.getHeight();

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
      const destName = `${side}_${piecesSet[j]}.png`;
      if (!(await exists(path.join(destDir, destName)))) {
        const image = await Jimp.read(srcPath);
        let x = j * width;
        let y = i * height;
        let w = width;
        let h = height;
        if (opt?.deleteMargin) {
          x += width * marginRatio;
          y += height * marginRatio;
          w *= 1 - marginRatio * 2;
          h *= 1 - marginRatio * 2;
        }
        await image.crop(x, y, w, h).writeAsync(path.join(destDir, destName));
        getAppLogger().debug(`${destName} extracted`);
      } else {
        getAppLogger().debug(`${destName} exists`);
      }
    }
  }

  return url.pathToFileURL(destDir).toString();
}
