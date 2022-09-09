import { ImmutablePosition, Move } from "@/shogi";

export enum USIInfoSender {
  BLACK_PLAYER = "blackPlayer",
  WHITE_PLAYER = "whitePlayer",
  RESEARCHER = "researcher",
}

export type USIInfoCommand = {
  depth?: number;
  seldepth?: number;
  timeMs?: number;
  nodes?: number;
  pv?: string[];
  multipv?: number;
  scoreCP?: number;
  scoreMate?: number;
  lowerbound?: boolean;
  upperbound?: boolean;
  currmove?: string;
  hashfullPerMill?: number;
  nps?: number;
  string?: string;
};

export function parseSFENPV(
  position: ImmutablePosition,
  sfenPV: string[]
): Move[] {
  const pv: Move[] = [];
  const pos = position.clone();
  for (const sfen of sfenPV) {
    const move = pos.createMoveBySFEN(sfen);
    if (!move || !pos.doMove(move)) {
      break;
    }
    pv.push(move);
  }
  return pv;
}
