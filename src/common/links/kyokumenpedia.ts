import { ImmutablePosition } from "tsshogi";

const kyokumenpediaBaseURL = "http://kyokumen.jp/positions/";

export function kyokumenpediaURL(position: ImmutablePosition): string {
  const sfen = position.sfen.replace(/ 1$/, "");
  return encodeURI(`${kyokumenpediaBaseURL}${sfen}`);
}
