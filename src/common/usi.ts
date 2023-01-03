import { ImmutablePosition, Move } from "@/common/shogi";

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

export function parseUSIPV(
  position: ImmutablePosition,
  usiPv: string[]
): Move[] {
  const pv: Move[] = [];
  const pos = position.clone();
  for (const usiMove of usiPv) {
    const move = pos.createMoveByUSI(usiMove);
    if (!move || !pos.doMove(move)) {
      break;
    }
    pv.push(move);
  }
  return pv;
}
