export enum USIInfoSender {
  BLACK_PLAYER = "blackPlayer",
  WHITE_PLAYER = "whitePlayer",
  RESEARCHER = "researcher",
}

export function stringifyUSIInfoSender(sender: USIInfoSender): string {
  switch (sender) {
    case USIInfoSender.BLACK_PLAYER:
      return "先手";
    case USIInfoSender.WHITE_PLAYER:
      return "後手";
    case USIInfoSender.RESEARCHER:
      return "検討";
  }
}

export type InfoCommand = {
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
