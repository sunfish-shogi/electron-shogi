import { Position } from ".";

export enum RecordFormatType {
  USI,
  SFEN,
  KIF,
  CSA,
}

export function detectRecordFormat(data: string): RecordFormatType {
  // USI
  if (
    data.startsWith("position sfen ") ||
    data.startsWith("position startpos ") ||
    data.startsWith("sfen ") ||
    data.startsWith("startpos ") ||
    data.startsWith("moves ")
  ) {
    return RecordFormatType.USI;
  }

  // SFEN
  if (Position.isValidSFEN(data)) {
    return RecordFormatType.SFEN;
  }

  // KIF vs CSA: 行頭の文字の出現頻度を比較する。
  const pattKIF = /(^|\n)[#0-9開終棋手戦表持秒記消場掲備先後作発出完分受]/g;
  const pattCSA = /(^|,|\n)[-+$%'VNPT]/g;
  const matchedKIF = data.match(pattKIF);
  const matchedCSA = data.match(pattCSA);
  const evalKIF = matchedKIF ? matchedKIF.length : 0;
  const evalCSA = matchedCSA ? matchedCSA.length : 0;
  return evalKIF >= evalCSA ? RecordFormatType.KIF : RecordFormatType.CSA;
}
