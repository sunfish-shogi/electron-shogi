import {
  getBlackPlayerNamePreferShort,
  getWhitePlayerNamePreferShort,
  ImmutableRecord,
} from "tsshogi";

const shogiPlaygroundBaseURL = "https://play.mogproject.com";

export function shogiPlaygroundURL(record: ImmutableRecord, flip?: boolean): string {
  const [usen, branch] = record.usen;
  const move = branch === 0 ? record.current.ply : `${branch}.${record.current.ply}`;
  const bn = getBlackPlayerNamePreferShort(record.metadata);
  const wn = getWhitePlayerNamePreferShort(record.metadata);
  return `${shogiPlaygroundBaseURL}/?u=${usen}&move=${move}&flip=${flip || false}&bn=${bn}&wn=${wn}`;
}
