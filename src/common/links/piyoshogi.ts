import { ImmutableRecord } from "tsshogi";

const piyoShogiBaseURL = "https://www.studiok-i.net/kifu/";

export function piyoShogiURL(record: ImmutableRecord): string {
  const sfen = record.getUSI({
    startpos: true,
    resign: true,
    allMoves: true,
  });
  return `${piyoShogiBaseURL}?sfen=${encodeURIComponent(sfen)}`;
}
