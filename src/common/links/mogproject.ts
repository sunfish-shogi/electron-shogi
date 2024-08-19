import {
  getBlackPlayerNamePreferShort,
  getWhitePlayerNamePreferShort,
  ImmutableRecord,
} from "tsshogi";

const shogiPlaygroundBaseURL = "https://play.mogproject.com";

export function shogiPlaygroundURL(record: ImmutableRecord, flip: boolean = false): string {
  // クエリ仕様: https://github.com/mogproject/mog-playground/wiki/Query-Parameters
  const [usen, branch] = record.usen;
  const move = branch === 0 ? record.current.ply : `${branch}.${record.current.ply}`;
  const bn = encodeURIComponent(getBlackPlayerNamePreferShort(record.metadata) || "");
  const wn = encodeURIComponent(getWhitePlayerNamePreferShort(record.metadata) || "");
  return `${shogiPlaygroundBaseURL}/?u=${usen}&move=${move}&flip=${flip}&bn=${bn}&wn=${wn}`;
}
