import {
  BoardImageType,
  BoardLabelType,
  PieceImageType,
  PieceStandImageType,
} from "@/common/settings/app";
import {
  handPieceTypes,
  ImmutableHand,
  PieceType,
  Color,
  Move,
  Piece,
  ImmutablePosition,
  reverseColor,
  Square,
} from "@/common/shogi";
import preloadImage from "@/renderer/assets/preload";
import { RectSize } from "@/common/graphics";

type PieceImages = {
  // directory: string;
  black: {
    pawn: string;
    lance: string;
    knight: string;
    silver: string;
    gold: string;
    bishop: string;
    rook: string;
    king: string;
    king2: string;
    promPawn: string;
    promLance: string;
    promKnight: string;
    promSilver: string;
    horse: string;
    dragon: string;
  };
  white: {
    pawn: string;
    lance: string;
    knight: string;
    silver: string;
    gold: string;
    bishop: string;
    rook: string;
    king: string;
    king2: string;
    promPawn: string;
    promLance: string;
    promKnight: string;
    promSilver: string;
    horse: string;
    dragon: string;
  };
};

// type PiecePath = {
//   directory: string;
//   pieceImages: PieceImages;
// };

const layoutTemplate = {
  frame: {
    width: 1471,
    height: 959,
  },
  board: {
    x: 296.5,
    y: 0,
    width: 878,
    height: 960,
    squreWidth: 94.8,
    squreHeight: 104,
    leftSquarePadding: 12,
    topSquarePadding: 12.2,
    leftPiecePadding: 17.5,
    topPiecePadding: 18.5,
    highlight: {
      selected: { "background-color": "#0088ff", opacity: "0.8" },
      lastMoveTo: { "background-color": "#44cc44", opacity: "0.8" },
      lastMoveFrom: { "background-color": "#44cc44", opacity: "0.4" },
    },
  },
  label: {
    fontSize: 24,
  },
  piece: {
    width: 88,
    height: 93,
  },
  hand: {
    black: {
      x: 1184,
      y: 600,
    },
    white: {
      x: 0,
      y: 0,
    },
    width: 288,
    height: 360,
    highlight: {
      selected: { "background-color": "#ff4800", opacity: "0.7" },
    },
  },
  turn: {
    black: {
      x: 1184,
      y: 425,
    },
    white: {
      x: 0,
      y: 492,
    },
    width: 288,
    height: 45,
    fontSize: 32,
  },
  playerName: {
    black: {
      x: 1184,
      y: 480,
    },
    white: {
      x: 0,
      y: 370,
    },
    width: 288,
    height: 45,
    fontSize: 25,
  },
  clock: {
    black: {
      x: 1184,
      y: 535,
    },
    white: {
      x: 0,
      y: 425,
    },
    width: 288,
    height: 55,
    fontSize: 40,
  },
  control: {
    left: {
      x: 0,
      y: 547,
      width: 288,
      height: 412,
      fontSize: 26,
    },
    right: {
      x: 1184,
      y: 0,
      width: 288,
      height: 412,
      fontSize: 26,
    },
  },
};

// deprecated
// const pieceImageMap: { [key: string]: PieceImages } = {
//   [PieceImageType.HITOMOJI]: {
//     black: {
//       pawn: "./piece/hitomoji/black_pawn.png",
//       lance: "./piece/hitomoji/black_lance.png",
//       knight: "./piece/hitomoji/black_knight.png",
//       silver: "./piece/hitomoji/black_silver.png",
//       gold: "./piece/hitomoji/black_gold.png",
//       bishop: "./piece/hitomoji/black_bishop.png",
//       rook: "./piece/hitomoji/black_rook.png",
//       king: "./piece/hitomoji/black_king.png",
//       king2: "./piece/hitomoji/black_king2.png",
//       promPawn: "./piece/hitomoji/black_prom_pawn.png",
//       promLance: "./piece/hitomoji/black_prom_lance.png",
//       promKnight: "./piece/hitomoji/black_prom_knight.png",
//       promSilver: "./piece/hitomoji/black_prom_silver.png",
//       horse: "./piece/hitomoji/black_horse.png",
//       dragon: "./piece/hitomoji/black_dragon.png",
//     },
//     white: {
//       pawn: "./piece/hitomoji/white_pawn.png",
//       lance: "./piece/hitomoji/white_lance.png",
//       knight: "./piece/hitomoji/white_knight.png",
//       silver: "./piece/hitomoji/white_silver.png",
//       gold: "./piece/hitomoji/white_gold.png",
//       bishop: "./piece/hitomoji/white_bishop.png",
//       rook: "./piece/hitomoji/white_rook.png",
//       king: "./piece/hitomoji/white_king.png",
//       king2: "./piece/hitomoji/white_king2.png",
//       promPawn: "./piece/hitomoji/white_prom_pawn.png",
//       promLance: "./piece/hitomoji/white_prom_lance.png",
//       promKnight: "./piece/hitomoji/white_prom_knight.png",
//       promSilver: "./piece/hitomoji/white_prom_silver.png",
//       horse: "./piece/hitomoji/white_horse.png",
//       dragon: "./piece/hitomoji/white_dragon.png",
//     },
//   },
//   [PieceImageType.HITOMOJI_DARK]: {
//     black: {
//       pawn: "./piece/hitomoji_dark/black_pawn.png",
//       lance: "./piece/hitomoji_dark/black_lance.png",
//       knight: "./piece/hitomoji_dark/black_knight.png",
//       silver: "./piece/hitomoji_dark/black_silver.png",
//       gold: "./piece/hitomoji_dark/black_gold.png",
//       bishop: "./piece/hitomoji_dark/black_bishop.png",
//       rook: "./piece/hitomoji_dark/black_rook.png",
//       king: "./piece/hitomoji_dark/black_king.png",
//       king2: "./piece/hitomoji_dark/black_king2.png",
//       promPawn: "./piece/hitomoji_dark/black_prom_pawn.png",
//       promLance: "./piece/hitomoji_dark/black_prom_lance.png",
//       promKnight: "./piece/hitomoji_dark/black_prom_knight.png",
//       promSilver: "./piece/hitomoji_dark/black_prom_silver.png",
//       horse: "./piece/hitomoji_dark/black_horse.png",
//       dragon: "./piece/hitomoji_dark/black_dragon.png",
//     },
//     white: {
//       pawn: "./piece/hitomoji_dark/white_pawn.png",
//       lance: "./piece/hitomoji_dark/white_lance.png",
//       knight: "./piece/hitomoji_dark/white_knight.png",
//       silver: "./piece/hitomoji_dark/white_silver.png",
//       gold: "./piece/hitomoji_dark/white_gold.png",
//       bishop: "./piece/hitomoji_dark/white_bishop.png",
//       rook: "./piece/hitomoji_dark/white_rook.png",
//       king: "./piece/hitomoji_dark/white_king.png",
//       king2: "./piece/hitomoji_dark/white_king2.png",
//       promPawn: "./piece/hitomoji_dark/white_prom_pawn.png",
//       promLance: "./piece/hitomoji_dark/white_prom_lance.png",
//       promKnight: "./piece/hitomoji_dark/white_prom_knight.png",
//       promSilver: "./piece/hitomoji_dark/white_prom_silver.png",
//       horse: "./piece/hitomoji_dark/white_horse.png",
//       dragon: "./piece/hitomoji_dark/white_dragon.png",
//     },
//   },
//   [PieceImageType.HITOMOJI_GOTHIC]: {
//     black: {
//       pawn: "./piece/hitomoji_gothic/black_pawn.png",
//       lance: "./piece/hitomoji_gothic/black_lance.png",
//       knight: "./piece/hitomoji_gothic/black_knight.png",
//       silver: "./piece/hitomoji_gothic/black_silver.png",
//       gold: "./piece/hitomoji_gothic/black_gold.png",
//       bishop: "./piece/hitomoji_gothic/black_bishop.png",
//       rook: "./piece/hitomoji_gothic/black_rook.png",
//       king: "./piece/hitomoji_gothic/black_king.png",
//       king2: "./piece/hitomoji_gothic/black_king2.png",
//       promPawn: "./piece/hitomoji_gothic/black_prom_pawn.png",
//       promLance: "./piece/hitomoji_gothic/black_prom_lance.png",
//       promKnight: "./piece/hitomoji_gothic/black_prom_knight.png",
//       promSilver: "./piece/hitomoji_gothic/black_prom_silver.png",
//       horse: "./piece/hitomoji_gothic/black_horse.png",
//       dragon: "./piece/hitomoji_gothic/black_dragon.png",
//     },
//     white: {
//       pawn: "./piece/hitomoji_gothic/white_pawn.png",
//       lance: "./piece/hitomoji_gothic/white_lance.png",
//       knight: "./piece/hitomoji_gothic/white_knight.png",
//       silver: "./piece/hitomoji_gothic/white_silver.png",
//       gold: "./piece/hitomoji_gothic/white_gold.png",
//       bishop: "./piece/hitomoji_gothic/white_bishop.png",
//       rook: "./piece/hitomoji_gothic/white_rook.png",
//       king: "./piece/hitomoji_gothic/white_king.png",
//       king2: "./piece/hitomoji_gothic/white_king2.png",
//       promPawn: "./piece/hitomoji_gothic/white_prom_pawn.png",
//       promLance: "./piece/hitomoji_gothic/white_prom_lance.png",
//       promKnight: "./piece/hitomoji_gothic/white_prom_knight.png",
//       promSilver: "./piece/hitomoji_gothic/white_prom_silver.png",
//       horse: "./piece/hitomoji_gothic/white_horse.png",
//       dragon: "./piece/hitomoji_gothic/white_dragon.png",
//     },
//   },
//   [PieceImageType.HITOMOJI_GOTHIC_DARK]: {
//     black: {
//       pawn: "./piece/hitomoji_gothic_dark/black_pawn.png",
//       lance: "./piece/hitomoji_gothic_dark/black_lance.png",
//       knight: "./piece/hitomoji_gothic_dark/black_knight.png",
//       silver: "./piece/hitomoji_gothic_dark/black_silver.png",
//       gold: "./piece/hitomoji_gothic_dark/black_gold.png",
//       bishop: "./piece/hitomoji_gothic_dark/black_bishop.png",
//       rook: "./piece/hitomoji_gothic_dark/black_rook.png",
//       king: "./piece/hitomoji_gothic_dark/black_king.png",
//       king2: "./piece/hitomoji_gothic_dark/black_king2.png",
//       promPawn: "./piece/hitomoji_gothic_dark/black_prom_pawn.png",
//       promLance: "./piece/hitomoji_gothic_dark/black_prom_lance.png",
//       promKnight: "./piece/hitomoji_gothic_dark/black_prom_knight.png",
//       promSilver: "./piece/hitomoji_gothic_dark/black_prom_silver.png",
//       horse: "./piece/hitomoji_gothic_dark/black_horse.png",
//       dragon: "./piece/hitomoji_gothic_dark/black_dragon.png",
//     },
//     white: {
//       pawn: "./piece/hitomoji_gothic_dark/white_pawn.png",
//       lance: "./piece/hitomoji_gothic_dark/white_lance.png",
//       knight: "./piece/hitomoji_gothic_dark/white_knight.png",
//       silver: "./piece/hitomoji_gothic_dark/white_silver.png",
//       gold: "./piece/hitomoji_gothic_dark/white_gold.png",
//       bishop: "./piece/hitomoji_gothic_dark/white_bishop.png",
//       rook: "./piece/hitomoji_gothic_dark/white_rook.png",
//       king: "./piece/hitomoji_gothic_dark/white_king.png",
//       king2: "./piece/hitomoji_gothic_dark/white_king2.png",
//       promPawn: "./piece/hitomoji_gothic_dark/white_prom_pawn.png",
//       promLance: "./piece/hitomoji_gothic_dark/white_prom_lance.png",
//       promKnight: "./piece/hitomoji_gothic_dark/white_prom_knight.png",
//       promSilver: "./piece/hitomoji_gothic_dark/white_prom_silver.png",
//       horse: "./piece/hitomoji_gothic_dark/white_horse.png",
//       dragon: "./piece/hitomoji_gothic_dark/white_dragon.png",
//     },
//   },
// };

function getPieceTextureMap(
  type: PieceImageType,
  customDir?: string
): PieceImages {
  let dir: string | null = "";
  switch (type) {
    case PieceImageType.HITOMOJI:
      dir = "./piece/hitomoji/";
      break;
    case PieceImageType.HITOMOJI_DARK:
      dir = "./piece/hitomoji_dark/";
      break;
    case PieceImageType.HITOMOJI_GOTHIC:
      dir = "./piece/hitomoji_gothic/";
      break;
    case PieceImageType.HITOMOJI_GOTHIC_DARK:
      dir = "./piece/hitomoji_gothic_dark/";
      break;
    case PieceImageType.CUSTOM_IMAGE:
      dir = customDir || null;
      break;
    default:
      dir = "./piece/hitomoji/";
      break;
  }
  const final_piece: PieceImages = {
    black: {
      pawn: dir + "black_pawn.png",
      lance: dir + "black_lance.png",
      knight: dir + "black_knight.png",
      silver: dir + "black_silver.png",
      gold: dir + "black_gold.png",
      bishop: dir + "black_bishop.png",
      rook: dir + "black_rook.png",
      king: dir + "black_king.png",
      king2: dir + "black_king2.png",
      promPawn: dir + "black_prom_pawn.png",
      promLance: dir + "black_prom_lance.png",
      promKnight: dir + "black_prom_knight.png",
      promSilver: dir + "black_prom_silver.png",
      horse: dir + "black_horse.png",
      dragon: dir + "black_dragon.png",
    },
    white: {
      pawn: dir + "white_pawn.png",
      lance: dir + "white_lance.png",
      knight: dir + "white_knight.png",
      silver: dir + "white_silver.png",
      gold: dir + "white_gold.png",
      bishop: dir + "white_bishop.png",
      rook: dir + "white_rook.png",
      king: dir + "white_king.png",
      king2: dir + "white_king2.png",
      promPawn: dir + "white_prom_pawn.png",
      promLance: dir + "white_prom_lance.png",
      promKnight: dir + "white_prom_knight.png",
      promSilver: dir + "white_prom_silver.png",
      horse: dir + "white_horse.png",
      dragon: dir + "white_dragon.png",
    },
  };

  return final_piece;
}
function getBoardGridURL(type: BoardImageType): string {
  switch (type) {
    default:
      return "./board/grid.svg";
    case BoardImageType.DARK:
      return "./board/grid_white.svg";
  }
}

function getBoardTextureURL(
  type: BoardImageType,
  customURL?: string
): string | null {
  switch (type) {
    case BoardImageType.LIGHT:
      return "./board/wood_light.png";
    case BoardImageType.WARM:
      return "./board/wood_warm.png";
    case BoardImageType.CUSTOM_IMAGE:
      return customURL || null;
  }
  return null;
}

const boardBackgroundColorMap = {
  [BoardImageType.LIGHT]: "rgba(0, 0, 0, 0)",
  [BoardImageType.WARM]: "rgba(0, 0, 0, 0)",
  [BoardImageType.RESIN]: "#d69b00",
  [BoardImageType.RESIN2]: "#efbf63",
  [BoardImageType.RESIN3]: "#ad7624",
  [BoardImageType.DARK]: "#333333",
  [BoardImageType.GREEN]: "#598459",
  [BoardImageType.CHERRY_BLOSSOM]: "#ecb6b6",
  [BoardImageType.CUSTOM_IMAGE]: "rgba(0, 0, 0, 0)",
};

function getPieceStandTextureURL(
  type: PieceStandImageType,
  customURL?: string
): string | null {
  switch (type) {
    case PieceStandImageType.CUSTOM_IMAGE:
      return customURL || null;
  }
  return null;
}

const pieceStandBackgroundColorMap = {
  [PieceStandImageType.STANDARD]: "#8b4513",
  [PieceStandImageType.DARK]: "#333333",
  [PieceStandImageType.GREEN]: "#527a52",
  [PieceStandImageType.CHERRY_BLOSSOM]: "#e8a9a9",
  [PieceStandImageType.CUSTOM_IMAGE]: "rgba(0, 0, 0, 0)",
};

const handLaytoutRule = {
  black: {
    pawn: { row: 3, column: 0, width: 2 },
    lance: { row: 2, column: 0, width: 1 },
    knight: { row: 2, column: 1, width: 1 },
    silver: { row: 1, column: 0, width: 1 },
    gold: { row: 1, column: 1, width: 1 },
    bishop: { row: 0, column: 0, width: 1 },
    rook: { row: 0, column: 1, width: 1 },
    king: { row: 0, column: 0, width: 0 },
    promPawn: { row: 0, column: 0, width: 0 },
    promLance: { row: 0, column: 0, width: 0 },
    promKnight: { row: 0, column: 0, width: 0 },
    promSilver: { row: 0, column: 0, width: 0 },
    horse: { row: 0, column: 0, width: 0 },
    dragon: { row: 0, column: 0, width: 0 },
  },
  white: {
    pawn: { row: 0, column: 0, width: 2 },
    lance: { row: 1, column: 1, width: 1 },
    knight: { row: 1, column: 0, width: 1 },
    silver: { row: 2, column: 1, width: 1 },
    gold: { row: 2, column: 0, width: 1 },
    bishop: { row: 3, column: 1, width: 1 },
    rook: { row: 3, column: 0, width: 1 },
    king: { row: 0, column: 0, width: 0 },
    promPawn: { row: 0, column: 0, width: 0 },
    promLance: { row: 0, column: 0, width: 0 },
    promKnight: { row: 0, column: 0, width: 0 },
    promSilver: { row: 0, column: 0, width: 0 },
    horse: { row: 0, column: 0, width: 0 },
    dragon: { row: 0, column: 0, width: 0 },
  },
};

type FrameLayout = {
  style: { [key: string]: string };
  size: RectSize;
};

type BoardLayout = {
  gridImagePath: string;
  textureImagePath: string | null;
  x: number;
  y: number;
  style: { [key: string]: string };
};

type LabelLayout = {
  id: string;
  character: string;
  style: { [key: string]: string };
};

type PieceLayout = {
  id: string;
  imagePath: string;
  style: { [key: string]: string };
};

type SquareLayout = {
  id: number;
  file: number;
  rank: number;
  style: { [key: string]: string };
  backgroundStyle: { [key: string]: string };
};

type HandPieceLayout = {
  id: string;
  imagePath: string;
  style: { [key: string]: string };
};

type HandPointerLayout = {
  id: string;
  type: PieceType;
  style: { [key: string]: string };
  backgroundStyle: { [key: string]: string };
};

type HandLayout = {
  textureImagePath: string | null;
  style: { [key: string]: string };
  pieces: HandPieceLayout[];
  pointers: HandPointerLayout[];
};

type PromotionLayout = {
  promoteImagePath: string;
  notPromoteImagePath: string;
  style: { [key: string]: string };
};

type TurnLayout = {
  style: { [key: string]: string };
};

type PlayerNameLayout = {
  style: { [key: string]: string };
};

type ClockLayout = {
  style: { [key: string]: string };
};

type ControlLayout = {
  left: {
    style: { [key: string]: string };
  };
  right: {
    style: { [key: string]: string };
  };
};

export type FullLayout = {
  frame: FrameLayout;
  board: BoardLayout;
  labels: LabelLayout[];
  piece: PieceLayout[];
  square: SquareLayout[];
  blackHand: HandLayout;
  whiteHand: HandLayout;
  promotion: PromotionLayout | null;
  turn: TurnLayout;
  blackPlayerName: PlayerNameLayout;
  whitePlayerName: PlayerNameLayout;
  blackClock: ClockLayout;
  whiteClock: ClockLayout;
  control: ControlLayout;
};

const rankCharMap: { [n: number]: string } = {
  1: "一",
  2: "二",
  3: "三",
  4: "四",
  5: "五",
  6: "六",
  7: "七",
  8: "八",
  9: "九",
};

export default class LayoutBuilder {
  private pieceImages: PieceImages;
  private boardGridImage: string;
  private boardTextureImage: string | null;
  private pieceStandImage: string | null;

  constructor(
    pieceImageType: PieceImageType,
    private boardImageType: BoardImageType,
    private pieceStandImageType: PieceStandImageType,
    private boardLabelType: BoardLabelType,
    customPieceImageURL?: string,
    customBoardImageURL?: string,
    customPieceStandImageURL?: string
  ) {
    // this.pieceImages =
    // pieceImageMap[pieceImageType] || pieceImageMap[PieceImageType.HITOMOJI];
    this.pieceImages = getPieceTextureMap(pieceImageType, customPieceImageURL);
    this.boardGridImage = getBoardGridURL(boardImageType);
    this.boardTextureImage = getBoardTextureURL(
      boardImageType,
      customBoardImageURL
    );
    this.pieceStandImage = getPieceStandTextureURL(
      pieceStandImageType,
      customPieceStandImageURL
    );
  }

  preload(): void {
    preloadImage(this.boardGridImage);
    if (this.boardTextureImage) {
      preloadImage(this.boardTextureImage);
    }
    if (this.pieceStandImage) {
      preloadImage(this.pieceStandImage);
    }
    Object.values(this.pieceImages.black).forEach(preloadImage);
    Object.values(this.pieceImages.white).forEach(preloadImage);
  }

  build(
    upperSizeLimit: RectSize,
    position: ImmutablePosition,
    lastMove: Move | null | undefined,
    pointer: Square | Piece | null | undefined,
    reservedMoveForPromotion: Move | null | undefined,
    flip?: boolean
  ): FullLayout {
    let ratio = upperSizeLimit.width / layoutTemplate.frame.width;
    if (layoutTemplate.frame.height * ratio > upperSizeLimit.height) {
      ratio = upperSizeLimit.height / layoutTemplate.frame.height;
    }

    const buildFrameLayout = (): FrameLayout => {
      const height = layoutTemplate.frame.height * ratio;
      const width = layoutTemplate.frame.width * ratio;
      return {
        style: {
          height: height + "px",
          width: width + "px",
        },
        size: new RectSize(width, height),
      };
    };

    const buildBoardLayout = (): BoardLayout => {
      const x = layoutTemplate.board.x * ratio;
      const y = layoutTemplate.board.y * ratio;
      const width = layoutTemplate.board.width * ratio;
      const height = layoutTemplate.board.height * ratio;
      const bgColor = boardBackgroundColorMap[this.boardImageType];
      const style = {
        "background-color": bgColor,
        left: x + "px",
        top: y + "px",
        height: height + "px",
        width: width + "px",
      };
      return {
        gridImagePath: this.boardGridImage,
        textureImagePath: this.boardTextureImage,
        x,
        y,
        style,
      };
    };

    const buildLabelLayout = (boardLayout: BoardLayout): LabelLayout[] => {
      const layouts: LabelLayout[] = [];
      if (this.boardLabelType == BoardLabelType.NONE) {
        return layouts;
      }
      const fontSize = layoutTemplate.label.fontSize * ratio;
      const shadow = fontSize * 0.1;
      const commonStyle = {
        color: "black",
        "font-size": fontSize + "px",
        "font-weight": "bold",
        "text-shadow": `${shadow}px ${shadow}px  ${shadow}px white`,
      };
      for (let rank = 1; rank <= 9; rank++) {
        const x =
          boardLayout.x -
          fontSize * 0.5 +
          (flip ? 0 : layoutTemplate.board.width) * ratio +
          layoutTemplate.board.leftPiecePadding * 0.5 * ratio * (flip ? 1 : -1);
        const y =
          boardLayout.y -
          fontSize * 0.5 +
          (layoutTemplate.board.topSquarePadding +
            ((flip ? 10 - rank : rank) - 0.5) *
              layoutTemplate.board.squreHeight) *
            ratio;
        layouts.push({
          id: "rank" + rank,
          character: rankCharMap[rank],
          style: {
            left: x + "px",
            top: y + "px",
            ...commonStyle,
          },
        });
      }
      for (let file = 1; file <= 9; file++) {
        const x =
          boardLayout.x -
          fontSize * 0.5 +
          (layoutTemplate.board.leftPiecePadding +
            (9.5 - (flip ? 10 - file : file)) *
              layoutTemplate.board.squreWidth) *
            ratio;
        const y =
          boardLayout.y -
          fontSize * 0.6 +
          (flip ? layoutTemplate.board.height : 0) * ratio +
          layoutTemplate.board.topSquarePadding * 0.7 * ratio * (flip ? -1 : 1);
        layouts.push({
          id: "file" + file,
          character: String(file),
          style: {
            left: x + "px",
            top: y + "px",
            ...commonStyle,
          },
        });
      }
      return layouts;
    };

    const buildPieceLayout = (boardLayout: BoardLayout): PieceLayout[] => {
      const layouts: PieceLayout[] = [];
      position.board.listNonEmptySquares().forEach((square) => {
        const piece = position.board.at(square) as Piece;
        const id = piece.id + square.index;
        const displayColor = flip ? reverseColor(piece.color) : piece.color;
        const pieceType =
          piece.type == PieceType.KING && piece.color == Color.BLACK
            ? "king2"
            : piece.type;
        const imagePath = this.pieceImages[displayColor][pieceType];
        const x =
          boardLayout.x +
          (layoutTemplate.board.leftPiecePadding +
            layoutTemplate.board.squreWidth *
              (flip ? square.opposite : square).x) *
            ratio;
        const y =
          boardLayout.y +
          (layoutTemplate.board.topPiecePadding +
            layoutTemplate.board.squreHeight *
              (flip ? square.opposite : square).y) *
            ratio;
        const width = layoutTemplate.piece.width * ratio;
        const height = layoutTemplate.piece.height * ratio;
        layouts.push({
          id,
          imagePath,
          style: {
            left: x + "px",
            top: y + "px",
            width: width + "px",
            height: height + "px",
          },
        });
      });
      return layouts;
    };

    const buildSquareLayout = (boardLayout: BoardLayout): SquareLayout[] => {
      const layouts: SquareLayout[] = [];
      Square.all.forEach((square) => {
        const id = square.index;
        const { file } = square;
        const { rank } = square;
        const x =
          boardLayout.x +
          (layoutTemplate.board.leftSquarePadding +
            layoutTemplate.board.squreWidth *
              (flip ? square.opposite : square).x) *
            ratio;
        const y =
          boardLayout.y +
          (layoutTemplate.board.topSquarePadding +
            layoutTemplate.board.squreHeight *
              (flip ? square.opposite : square).y) *
            ratio;
        const width = layoutTemplate.board.squreWidth * ratio;
        const height = layoutTemplate.board.squreHeight * ratio;
        const style = {
          left: x + "px",
          top: y + "px",
          width: width + "px",
          height: height + "px",
        };
        let backgroundStyle = style;
        if (lastMove && square.equals(lastMove.to)) {
          backgroundStyle = {
            ...backgroundStyle,
            ...layoutTemplate.board.highlight.lastMoveTo,
          };
        }
        if (
          lastMove &&
          lastMove.from instanceof Square &&
          square.equals(lastMove.from)
        ) {
          backgroundStyle = {
            ...backgroundStyle,
            ...layoutTemplate.board.highlight.lastMoveFrom,
          };
        }
        if (pointer instanceof Square && pointer.equals(square)) {
          backgroundStyle = {
            ...backgroundStyle,
            ...layoutTemplate.board.highlight.selected,
          };
        }
        layouts.push({
          id,
          file,
          rank,
          style,
          backgroundStyle,
        });
      });
      return layouts;
    };

    const buildHandLayout = (color: Color, hand: ImmutableHand): HandLayout => {
      const displayColor = flip ? reverseColor(color) : color;
      const bgColor = pieceStandBackgroundColorMap[this.pieceStandImageType];
      const standX = layoutTemplate.hand[displayColor].x * ratio;
      const standY = layoutTemplate.hand[displayColor].y * ratio;
      const standWidth = layoutTemplate.hand.width * ratio;
      const standHeight = layoutTemplate.hand.height * ratio;
      const standStyle = {
        "background-color": bgColor,
        left: standX + "px",
        top: standY + "px",
        width: standWidth + "px",
        height: standHeight + "px",
      };
      const pieces: HandPieceLayout[] = [];
      const pointers: HandPointerLayout[] = [];
      handPieceTypes.forEach((type) => {
        const count = hand.count(type);
        const rule = handLaytoutRule[displayColor][type];
        const areaWidth = (layoutTemplate.hand.width / 2) * rule.width * ratio;
        const areaHeight = (layoutTemplate.hand.height / 4) * ratio;
        const areaX = areaWidth * rule.column;
        const areaY = areaHeight * rule.row;
        const pieceWidth = layoutTemplate.piece.width * ratio;
        const pieceHeight = layoutTemplate.piece.height * ratio;
        const padding =
          Math.max(areaWidth - pieceWidth * count, 0) / (count * 2);
        const dx =
          (areaWidth - pieceWidth - padding * 2) / Math.max(count - 1, 1);
        for (let i = count - 1; i >= 0; i -= 1) {
          const id = type + i;
          const imagePath = this.pieceImages[displayColor][type];
          const x = areaX + padding + dx * i;
          const y = areaY;
          pieces.push({
            id,
            imagePath,
            style: {
              left: x + "px",
              top: y + "px",
              width: pieceWidth + "px",
              height: pieceHeight + "px",
            },
          });
        }
        const id = type;
        const style = {
          left: areaX + "px",
          top: areaY + "px",
          width: areaWidth + "px",
          height: areaHeight + "px",
        };
        let backgroundStyle = style;
        if (
          pointer &&
          pointer instanceof Piece &&
          pointer.color === color &&
          pointer.type === type
        ) {
          backgroundStyle = {
            ...backgroundStyle,
            ...layoutTemplate.hand.highlight.selected,
          };
        }
        pointers.push({
          id,
          type,
          style,
          backgroundStyle,
        });
      });
      return {
        textureImagePath: this.pieceStandImage,
        style: standStyle,
        pieces,
        pointers,
      };
    };

    const buildPromotionLayout = (
      boardLayout: BoardLayout,
      move: Move | null | undefined
    ): PromotionLayout | null => {
      if (!move) {
        return null;
      }
      const color = flip ? reverseColor(move.color) : move.color;
      const square = flip ? move.to.opposite : move.to;
      const piece = new Piece(color, move.pieceType);
      const promoted = piece.promoted();
      const notPromoted = piece.unpromoted();
      const promoteImagePath = this.pieceImages[color][promoted.type];
      const notPromoteImagePath = this.pieceImages[color][notPromoted.type];
      const x =
        boardLayout.x +
        (layoutTemplate.board.leftSquarePadding +
          layoutTemplate.board.squreWidth *
            (square.x === 0 ? 0 : square.x === 8 ? 7 : square.x - 0.5)) *
          ratio;
      const y =
        boardLayout.y +
        (layoutTemplate.board.topSquarePadding +
          layoutTemplate.board.squreHeight * square.y) *
          ratio;
      const width = layoutTemplate.board.squreWidth * 2 * ratio;
      const height = layoutTemplate.board.squreHeight * ratio;
      const style = {
        left: x + "px",
        top: y + "px",
        width: width + "px",
        height: height + "px",
        "font-size": height / 4 + "px",
      };
      return {
        promoteImagePath,
        notPromoteImagePath,
        style,
      };
    };

    const buildTurnLayout = (): TurnLayout => {
      const color = position.color;
      const displayColor = flip ? reverseColor(color) : color;
      const borderWidth = 2;
      return {
        style: {
          left:
            layoutTemplate.turn[displayColor].x * ratio - borderWidth + "px",
          top: layoutTemplate.turn[displayColor].y * ratio - borderWidth + "px",
          width: layoutTemplate.turn.width * ratio - borderWidth + "px",
          height: layoutTemplate.turn.height * ratio - borderWidth + "px",
          "font-size": layoutTemplate.turn.fontSize * ratio + "px",
          "border-radius": layoutTemplate.turn.height * ratio * 0.4 + "px",
          "border-width": borderWidth + "px",
          "border-style": "solid",
        },
      };
    };

    const buildPlayerNameLayout = (color: Color): PlayerNameLayout => {
      const displayColor = flip ? reverseColor(color) : color;
      return {
        style: {
          left: layoutTemplate.playerName[displayColor].x * ratio + "px",
          top: layoutTemplate.playerName[displayColor].y * ratio + "px",
          width: layoutTemplate.playerName.width * ratio + "px",
          height: layoutTemplate.playerName.height * ratio + "px",
          "font-size": layoutTemplate.playerName.fontSize * ratio + "px",
        },
      };
    };

    const buildClockLayout = (color: Color): ClockLayout => {
      const displayColor = flip ? reverseColor(color) : color;
      return {
        style: {
          left: layoutTemplate.clock[displayColor].x * ratio + "px",
          top: layoutTemplate.clock[displayColor].y * ratio + "px",
          width: layoutTemplate.clock.width * ratio + "px",
          height: layoutTemplate.clock.height * ratio + "px",
          "font-size": layoutTemplate.clock.fontSize * ratio + "px",
        },
      };
    };

    const buildControlLayout = (): ControlLayout => {
      return {
        left: {
          style: {
            left: layoutTemplate.control.left.x * ratio + "px",
            top: layoutTemplate.control.left.y * ratio + "px",
            width: layoutTemplate.control.left.width * ratio + "px",
            height: layoutTemplate.control.left.height * ratio + "px",
            "font-size": layoutTemplate.control.left.fontSize * ratio + "px",
          },
        },
        right: {
          style: {
            left: layoutTemplate.control.right.x * ratio + "px",
            top: layoutTemplate.control.right.y * ratio + "px",
            width: layoutTemplate.control.right.width * ratio + "px",
            height: layoutTemplate.control.right.height * ratio + "px",
            "font-size": layoutTemplate.control.right.fontSize * ratio + "px",
          },
        },
      };
    };

    const frameLayout = buildFrameLayout();
    const boardLayout = buildBoardLayout();
    const labelLayout = buildLabelLayout(boardLayout);
    const pieceLayout = buildPieceLayout(boardLayout);
    const squareLayout = buildSquareLayout(boardLayout);
    const blackHandLayout = buildHandLayout(
      Color.BLACK,
      position.hand(Color.BLACK)
    );
    const whiteHandLayout = buildHandLayout(
      Color.WHITE,
      position.hand(Color.WHITE)
    );
    const promotionLayout = buildPromotionLayout(
      boardLayout,
      reservedMoveForPromotion
    );
    const turnLayout = buildTurnLayout();
    const blackPlayerNameLayout = buildPlayerNameLayout(Color.BLACK);
    const whitePlayerNameLayout = buildPlayerNameLayout(Color.WHITE);
    const blackClockLayout = buildClockLayout(Color.BLACK);
    const whiteClockLayout = buildClockLayout(Color.WHITE);
    const controlLayout = buildControlLayout();
    return {
      frame: frameLayout,
      board: boardLayout,
      labels: labelLayout,
      piece: pieceLayout,
      square: squareLayout,
      blackHand: blackHandLayout,
      whiteHand: whiteHandLayout,
      promotion: promotionLayout,
      turn: turnLayout,
      blackPlayerName: blackPlayerNameLayout,
      whitePlayerName: whitePlayerNameLayout,
      blackClock: blackClockLayout,
      whiteClock: whiteClockLayout,
      control: controlLayout,
    };
  }
}
