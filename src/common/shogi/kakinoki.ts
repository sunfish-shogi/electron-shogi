// KIF file format (.kif or .kifu)
// See http://kakinoki.o.oo7.jp/kif_format.html

import { appendLine } from "@/common/helpers/string";
import { millisecondsToHMMSS, millisecondsToMSS } from "@/common/helpers/time";
import {
  Color,
  Move,
  Position,
  ImmutablePosition,
  Record,
  RecordMetadata,
  RecordMetadataKey,
  Square,
  InvalidHandicapError,
  InvalidBoardError,
  InvalidHandPieceError,
  InvalidMoveError,
  InvalidMoveNumberError,
  InvalidDestinationError,
  InvalidLineError,
} from ".";
import { Board, InitialPositionType } from "./board";
import { Hand, ImmutableHand } from "./hand";
import { Piece, PieceType } from "./piece";
import {
  ImmutableRecord,
  ImmutableRecordMetadata,
  SpecialMove,
} from "./record";
import {
  charToNumber,
  fileToMultiByteChar,
  kanjiToNumber,
  multiByteCharToNumber,
  numberToKanji,
  pieceTypeToStringForBoard,
  pieceTypeToStringForMove,
  rankToKanji,
  stringToPieceType,
} from "./text";

const metadataKeyMap: { [key: string]: RecordMetadataKey | undefined } = {
  先手: RecordMetadataKey.BLACK_NAME,
  後手: RecordMetadataKey.WHITE_NAME,
  下手: RecordMetadataKey.SHITATE_NAME,
  上手: RecordMetadataKey.UWATE_NAME,
  開始日時: RecordMetadataKey.START_DATETIME,
  終了日時: RecordMetadataKey.END_DATETIME,
  対局日: RecordMetadataKey.DATE,
  棋戦: RecordMetadataKey.TOURNAMENT,
  戦型: RecordMetadataKey.STRATEGY,
  表題: RecordMetadataKey.TITLE,
  持ち時間: RecordMetadataKey.TIME_LIMIT,
  秒読み: RecordMetadataKey.BYOYOMI,
  消費時間: RecordMetadataKey.TIME_SPENT,
  場所: RecordMetadataKey.PLACE,
  掲載: RecordMetadataKey.POSTED_ON,
  備考: RecordMetadataKey.NOTE,
  先手省略名: RecordMetadataKey.BLACK_SHORT_NAME,
  後手省略名: RecordMetadataKey.WHITE_SHORT_NAME,
  作品番号: RecordMetadataKey.OPUS_NO,
  作品名: RecordMetadataKey.OPUS_NAME,
  作者: RecordMetadataKey.AUTHOR,
  発表誌: RecordMetadataKey.PUBLISHED_BY,
  発表年月: RecordMetadataKey.PUBLISHED_AT,
  出典: RecordMetadataKey.SOURCE,
  手数: RecordMetadataKey.LENGTH,
  完全性: RecordMetadataKey.INTEGRITY,
  分類: RecordMetadataKey.CATEGORY,
  受賞: RecordMetadataKey.AWARD,
};

const metadataNameMap = {
  [RecordMetadataKey.BLACK_NAME]: "先手",
  [RecordMetadataKey.WHITE_NAME]: "後手",
  [RecordMetadataKey.SHITATE_NAME]: "下手",
  [RecordMetadataKey.UWATE_NAME]: "上手",
  [RecordMetadataKey.START_DATETIME]: "開始日時",
  [RecordMetadataKey.END_DATETIME]: "終了日時",
  [RecordMetadataKey.DATE]: "対局日",
  [RecordMetadataKey.TOURNAMENT]: "棋戦",
  [RecordMetadataKey.STRATEGY]: "戦型",
  [RecordMetadataKey.TITLE]: "表題",
  [RecordMetadataKey.TIME_LIMIT]: "持ち時間",
  [RecordMetadataKey.BYOYOMI]: "秒読み",
  [RecordMetadataKey.TIME_SPENT]: "消費時間",
  [RecordMetadataKey.PLACE]: "場所",
  [RecordMetadataKey.POSTED_ON]: "掲載",
  [RecordMetadataKey.NOTE]: "備考",
  [RecordMetadataKey.BLACK_SHORT_NAME]: "先手省略名",
  [RecordMetadataKey.WHITE_SHORT_NAME]: "後手省略名",
  [RecordMetadataKey.OPUS_NO]: "作品番号",
  [RecordMetadataKey.OPUS_NAME]: "作品名",
  [RecordMetadataKey.AUTHOR]: "作者",
  [RecordMetadataKey.PUBLISHED_BY]: "発表誌",
  [RecordMetadataKey.PUBLISHED_AT]: "発表年月",
  [RecordMetadataKey.SOURCE]: "出典",
  [RecordMetadataKey.LENGTH]: "手数",
  [RecordMetadataKey.INTEGRITY]: "完全性",
  [RecordMetadataKey.CATEGORY]: "分類",
  [RecordMetadataKey.AWARD]: "受賞",
};

enum LineType {
  PROGRAM_COMMENT,
  METADATA,
  HANDICAP,
  BLACK_HAND,
  WHITE_HAND,
  BOARD,
  BLACK_TURN,
  WHITE_TURN,
  MOVE,
  COMMENT,
  BOOKMARK,
  UNKNOWN,
}

// & で始まる行はしおりを意味するらしいが用途がよくわらず実際の使用例を見たことがない。
const linePatterns = [
  {
    prefix: /^#/,
    type: LineType.PROGRAM_COMMENT,
    removePrefix: false,
    isPosition: false,
  },
  {
    prefix: /^手合割：/,
    type: LineType.HANDICAP,
    removePrefix: true,
    isPosition: true,
  },
  {
    prefix: /^先手の持駒：/,
    type: LineType.BLACK_HAND,
    removePrefix: true,
    isPosition: true,
  },
  {
    prefix: /^後手の持駒：/,
    type: LineType.WHITE_HAND,
    removePrefix: true,
    isPosition: true,
  },
  {
    prefix: /^\|/,
    type: LineType.BOARD,
    removePrefix: false,
    isPosition: true,
  },
  {
    prefix: /^先手番/,
    type: LineType.BLACK_TURN,
    removePrefix: false,
    isPosition: true,
  },
  {
    prefix: /^後手番/,
    type: LineType.WHITE_TURN,
    removePrefix: false,
    isPosition: true,
  },
  {
    prefix: /^ *[0-9]+ +/,
    type: LineType.MOVE,
    removePrefix: false,
    isPosition: false,
  },
  {
    prefix: /^\*/,
    type: LineType.COMMENT,
    removePrefix: true,
    isPosition: false,
  },
  {
    prefix: /^&/,
    type: LineType.BOOKMARK,
    removePrefix: true,
    isPosition: false,
  },
];

type Line = {
  type: LineType;
  data: string;
  isPosition: boolean;
  metadataKey: string;
};

function parseLine(line: string): Line {
  for (let i = 0; i < linePatterns.length; i++) {
    const pattern = linePatterns[i];
    const matched = line.match(pattern.prefix);
    if (matched) {
      const begin = pattern.removePrefix ? matched[0].length : 0;
      return {
        type: pattern.type,
        data: line.substring(begin),
        isPosition: pattern.isPosition,
        metadataKey: "",
      };
    }
  }
  const metadataPrefix = line.match(/^[^ ]+：/);
  if (metadataPrefix) {
    const prefix = metadataPrefix[0];
    return {
      type: LineType.METADATA,
      data: line.substring(prefix.length),
      isPosition: false,
      metadataKey: prefix.substring(0, prefix.length - 1),
    };
  }
  return {
    type: LineType.UNKNOWN,
    data: line,
    isPosition: false,
    metadataKey: "",
  };
}

function readHandicap(position: Position, data: string): Error | undefined {
  switch (data.trim()) {
    case "平手":
      position.reset(InitialPositionType.STANDARD);
      return;
    case "香落ち":
      position.reset(InitialPositionType.HANDICAP_LANCE);
      return;
    case "右香落ち":
      position.reset(InitialPositionType.HANDICAP_RIGHT_LANCE);
      return;
    case "角落ち":
      position.reset(InitialPositionType.HANDICAP_BISHOP);
      return;
    case "飛車落ち":
      position.reset(InitialPositionType.HANDICAP_ROOK);
      return;
    case "飛香落ち":
      position.reset(InitialPositionType.HANDICAP_ROOK_LANCE);
      return;
    case "二枚落ち":
      position.reset(InitialPositionType.HANDICAP_2PIECES);
      return;
    case "四枚落ち":
      position.reset(InitialPositionType.HANDICAP_4PIECES);
      return;
    case "六枚落ち":
      position.reset(InitialPositionType.HANDICAP_6PIECES);
      return;
    case "八枚落ち":
      position.reset(InitialPositionType.HANDICAP_8PIECES);
      return;
    case "十枚落ち":
      position.reset(InitialPositionType.HANDICAP_10PIECES);
      return;
    case "その他":
      position.reset(InitialPositionType.EMPTY);
      return;
  }
  return new InvalidHandicapError(data);
}

const stringToSpecialMove: { [move: string]: SpecialMove } = {
  中断: SpecialMove.INTERRUPT,
  投了: SpecialMove.RESIGN,
  持将棋: SpecialMove.IMPASS,
  千日手: SpecialMove.REPETITION_DRAW,
  詰み: SpecialMove.MATE,
  不詰: SpecialMove.NO_MATE,
  切れ負け: SpecialMove.TIMEOUT,
  反則勝ち: SpecialMove.FOUL_WIN,
  反則負け: SpecialMove.FOUL_LOSE,
  入玉勝ち: SpecialMove.ENTERING_OF_KING,
  不戦勝: SpecialMove.WIN_BY_DEFAULT,
  不戦敗: SpecialMove.LOSE_BY_DEFAULT,
  封じ手: SpecialMove.SEALED_MOVE,
};

const moveRegExp =
  /^ *([0-9]+) +[▲△]?([１２３４５６７８９][一二三四五六七八九]|同\u3000*)(王|玉|飛|龍|竜|角|馬|金|銀|成銀|全|桂|成桂|圭|香|成香|杏|歩|と)\u3000*(成?)(打|\([1-9][1-9]\)) *(.*)$/;

const timeRegExp = /\( *([0-9]+):([0-9]+)\/[0-9: ]*\)/;

const specialMoveRegExp =
  /^ *([0-9]+) +(中断|投了|持将棋|千日手|詰み|不詰|切れ負け|反則勝ち|反則負け|入玉勝ち|不戦勝|不戦敗|封じ手) *(.*)$/;

function readBoard(board: Board, data: string): Error | undefined {
  if (data.length < 21) {
    return new InvalidBoardError(data);
  }
  const rankStr = data[20];
  const rank = kanjiToNumber(rankStr);
  if (!rank) {
    return new InvalidBoardError(data);
  }
  for (let x = 0; x < 9; x += 1) {
    const file = 9 - x;
    const square = new Square(file, rank);
    const index = x * 2 + 1;
    const pieceStr = data[index + 1];
    const pieceType = stringToPieceType(pieceStr);
    if (!pieceType) {
      board.remove(square);
      continue;
    }
    const color = data[index] !== "v" ? Color.BLACK : Color.WHITE;
    board.set(square, new Piece(color, pieceType));
  }
}

function readHand(hand: Hand, data: string): Error | undefined {
  const sections = data.split(/[ 　]/);
  for (const section of sections) {
    if (!section || section === "なし") {
      continue;
    }
    const pieceStr = section[0];
    const numberStr = section.substring(1);
    const pieceType = stringToPieceType(pieceStr);
    const n = kanjiToNumber(numberStr) || 1;
    if (!pieceType) {
      return new InvalidHandPieceError(section);
    }
    hand.add(pieceType, n);
  }
  return;
}

function readMoveTime(record: Record, data: string): void {
  const timeResult = timeRegExp.exec(data);
  if (timeResult) {
    const minutes = timeResult[1];
    const seconds = timeResult[2];
    const s = Number.parseInt(minutes) * 60 + Number.parseInt(seconds);
    record.current.setElapsedMs(s * 1e3);
  }
}

function readMove(record: Record, data: string): Error | undefined {
  let result = specialMoveRegExp.exec(data);
  if (result) {
    const num = Number(result[1]);
    const move = stringToSpecialMove[result[2]];
    const time = result[3];
    record.goto(num - 1);
    record.append(move, {
      ignoreValidation: true,
    });
    readMoveTime(record, time);
    return;
  }

  result = moveRegExp.exec(data);
  if (!result) {
    return new InvalidMoveError(data);
  }
  const num = Number(result[1]);
  const toStr = result[2];
  const pieceTypeStr = result[3];
  const promStr = result[4];
  const fromStr = result[5];
  const time = result[6];

  if (num === 0) {
    return new InvalidMoveNumberError(data);
  }
  record.goto(num - 1);
  let to: Square;
  let from: Square | PieceType;
  if (toStr.startsWith("同")) {
    if (!(record.current.move instanceof Move)) {
      return new InvalidDestinationError(data);
    }
    to = record.current.move.to;
  } else {
    const file = multiByteCharToNumber(toStr[0]);
    const rank = kanjiToNumber(toStr[1]);
    to = new Square(file, rank);
  }
  if (fromStr === "打") {
    from = stringToPieceType(pieceTypeStr);
  } else {
    const file = charToNumber(fromStr[1]);
    const rank = charToNumber(fromStr[2]);
    from = new Square(file, rank);
  }
  let move = record.position.createMove(from, to);
  if (!move) {
    return new InvalidMoveError(data);
  }
  if (promStr === "成") {
    move = move.withPromote();
  }
  record.append(move, {
    ignoreValidation: true,
  });
  readMoveTime(record, time);
  return;
}

export function importKakinoki(data: string): Record | Error {
  const metadata = new RecordMetadata();
  const record = new Record();
  const lines = data.split(/\r?\n/);
  const position = new Position();
  let preMoveComment = "";
  let preMoveBookmark = "";
  let inMoveSection = false;
  for (const line of lines) {
    if (line === "") {
      continue;
    }
    const parsed = parseLine(line);
    if (inMoveSection && parsed.isPosition) {
      return new InvalidLineError(line);
    }
    let e: Error | undefined;
    switch (parsed.type) {
      case LineType.METADATA: {
        const standardKey = metadataKeyMap[parsed.metadataKey];
        if (standardKey) {
          metadata.setStandardMetadata(standardKey, parsed.data);
        } else {
          metadata.setCustomMetadata(parsed.metadataKey, parsed.data);
        }
        break;
      }
      case LineType.HANDICAP:
        e = readHandicap(position, parsed.data);
        break;
      case LineType.BLACK_HAND:
        e = readHand(position.blackHand, parsed.data);
        break;
      case LineType.WHITE_HAND:
        e = readHand(position.whiteHand, parsed.data);
        break;
      case LineType.BOARD:
        e = readBoard(position.board, parsed.data);
        break;
      case LineType.BLACK_TURN:
        position.setColor(Color.BLACK);
        break;
      case LineType.WHITE_TURN:
        position.setColor(Color.WHITE);
        break;
      case LineType.MOVE:
        if (!inMoveSection) {
          record.clear(position);
          record.first.comment = preMoveComment;
          record.first.bookmark = preMoveBookmark;
          inMoveSection = true;
        }
        e = readMove(record, parsed.data);
        break;
      case LineType.COMMENT:
        if (inMoveSection) {
          record.current.comment = appendLine(
            record.current.comment,
            parsed.data
          );
        } else {
          preMoveComment = appendLine(preMoveComment, parsed.data);
        }
        break;
      case LineType.BOOKMARK:
        if (inMoveSection) {
          record.current.bookmark = parsed.data;
        } else {
          preMoveBookmark = parsed.data;
        }
        break;
      case LineType.PROGRAM_COMMENT:
        break;
      case LineType.UNKNOWN:
        break;
    }
    if (e) {
      return e;
    }
  }
  if (!inMoveSection) {
    record.clear(position);
    record.first.comment = preMoveComment;
    record.first.bookmark = preMoveBookmark;
  }
  record.goto(0);
  record.resetAllBranchSelection();
  record.metadata = metadata;
  return record;
}

const specialMoveToString = {
  [SpecialMove.START]: "",
  [SpecialMove.RESIGN]: "投了",
  [SpecialMove.INTERRUPT]: "中断",
  [SpecialMove.IMPASS]: "持将棋",
  [SpecialMove.DRAW]: "持将棋",
  [SpecialMove.REPETITION_DRAW]: "千日手",
  [SpecialMove.MATE]: "詰み",
  [SpecialMove.NO_MATE]: "不詰",
  [SpecialMove.TIMEOUT]: "切れ負け",
  [SpecialMove.FOUL_WIN]: "反則勝ち",
  [SpecialMove.FOUL_LOSE]: "反則負け",
  [SpecialMove.ENTERING_OF_KING]: "入玉勝ち",
  [SpecialMove.WIN_BY_DEFAULT]: "不戦勝",
  [SpecialMove.LOSE_BY_DEFAULT]: "不戦敗",
  [SpecialMove.SEALED_MOVE]: "封じ手",
};

type KakinokiExportOptions = {
  returnCode?: string;
};

function formatMetadata(
  metadata: ImmutableRecordMetadata,
  options: KakinokiExportOptions
): string {
  let ret = "";
  const returnCode = options.returnCode ? options.returnCode : "\n";
  for (const key of metadata.standardMetadataKeys) {
    ret +=
      metadataNameMap[key] +
      "：" +
      metadata.getStandardMetadata(key) +
      returnCode;
  }
  for (const key of metadata.customMetadataKeys) {
    ret += key + "：" + metadata.getCustomMetadata(key) + returnCode;
  }
  return ret;
}

function formatPosition(
  position: ImmutablePosition,
  options: KakinokiExportOptions
): string {
  let ret = "";
  const returnCode = options.returnCode ? options.returnCode : "\n";
  ret += "後手の持駒：" + formatHand(position.whiteHand) + returnCode;
  ret += "  ９ ８ ７ ６ ５ ４ ３ ２ １" + returnCode;
  ret += "+---------------------------+" + returnCode;
  for (let y = 0; y < 9; y++) {
    ret += "|";
    for (let x = 0; x < 9; x++) {
      const square = Square.newByXY(x, y);
      const piece = position.board.at(square);
      if (!piece) {
        ret += " ・";
      } else if (piece.color === Color.BLACK) {
        ret += " " + pieceTypeToStringForBoard(piece.type);
      } else {
        ret += "v" + pieceTypeToStringForBoard(piece.type);
      }
    }
    ret += "|" + rankToKanji(y + 1) + returnCode;
  }
  ret += "+---------------------------+" + returnCode;
  ret += "先手の持駒：" + formatHand(position.blackHand) + returnCode;
  if (position.color === Color.BLACK) {
    ret += "先手番" + returnCode;
  } else {
    ret += "後手番" + returnCode;
  }
  return ret;
}

function formatMove(move: Move): string {
  let ret = "";
  ret += fileToMultiByteChar(move.to.file);
  ret += rankToKanji(move.to.rank);
  ret += pieceTypeToStringForMove(move.pieceType);
  if (move.promote) {
    ret += "成";
  }
  if (move.from instanceof Square) {
    ret += "(" + move.from.file + move.from.rank + ")";
  } else {
    ret += "打";
  }
  return ret;
}

function formatHand(hand: ImmutableHand): string {
  let ret = "";
  hand.forEach((pieceType, n) => {
    if (n >= 1) {
      ret += pieceTypeToStringForBoard(pieceType);
      if (n >= 2) {
        ret += numberToKanji(n);
      }
      ret += "　";
    }
  });
  return ret;
}

export function exportKakinoki(
  record: ImmutableRecord,
  options: KakinokiExportOptions
): string {
  let ret = "";
  const returnCode = options.returnCode ? options.returnCode : "\n";
  ret += "# KIF形式棋譜ファイル Generated by Electron Shogi" + returnCode;
  ret += formatMetadata(record.metadata, options);
  ret += formatPosition(record.initialPosition, options);
  ret += "手数----指手---------消費時間--" + returnCode;
  record.forEach((node) => {
    if (node.ply !== 0) {
      if (!node.isFirstBranch) {
        ret += returnCode;
        ret += "変化：" + node.ply + "手" + returnCode;
      }
      ret += node.ply + " ";
      if (node.move instanceof Move) {
        ret += formatMove(node.move);
      } else {
        ret += specialMoveToString[node.move];
      }
      const elapsed = millisecondsToMSS(node.elapsedMs);
      const totalElapsed = millisecondsToHMMSS(node.totalElapsedMs);
      ret += ` (${elapsed}/${totalElapsed})`;
      if (node.isFirstBranch && node.hasBranch) {
        ret += "+";
      }
      ret += returnCode;
    }
    if (node.comment.length !== 0) {
      const comment = node.comment.endsWith("\n")
        ? node.comment.slice(0, -1)
        : node.comment;
      ret += "*" + comment.replaceAll("\n", returnCode + "*") + returnCode;
    }
    if (node.bookmark.length !== 0) {
      ret += "&" + node.bookmark + returnCode;
    }
  });
  return ret;
}
