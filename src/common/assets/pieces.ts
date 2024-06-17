import { Color, PieceType, pieceTypes } from "tsshogi";

export const pieceAssetTypes: (PieceType | "king2")[] = [...pieceTypes, "king2"];

export function getPieceImageAssetName(color: Color, piece: PieceType | "king2") {
  const snake = piece.replace(/([A-Z])/g, "_$1").toLowerCase();
  return `${color}_${snake}`;
}

const pieceNames = ["king", "rook", "bishop", "gold", "silver", "knight", "lance", "pawn"];
const promPieceNames = [
  "king2",
  "dragon",
  "horse",
  "",
  "prom_silver",
  "prom_knight",
  "prom_lance",
  "prom_pawn",
];

export function getPieceImageAssetNameByIndex(row: number, col: number) {
  const names = row % 2 === 0 ? pieceNames : promPieceNames;
  if (row < 2) {
    return `black_${names[col]}`;
  } else {
    return `white_${names[col]}`;
  }
}
