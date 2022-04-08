import Board, { ImmutableBoard, InitialPositionType } from "./board";
import {
  Color,
  reverseColor,
  colorToSFEN,
  parseSFENColor,
  isValidSFENColor,
} from "./color";
import Move, { parseSFENMove } from "./move";
import Square from "./square";
import Hand, { ImmutableHand } from "./hand";
import { Piece, PieceType } from "./piece";
import {
  Direction,
  directionToDeltaMap,
  movableDirections,
  MoveType,
  resolveMoveType,
  vectorToDirectionAndDistance,
} from "./direction";

const invalidRankMap: {
  [color: string]: { [pieceType: string]: { [rank: number]: boolean } };
} = {
  black: {
    pawn: { 1: true },
    lance: { 1: true },
    knight: { 1: true, 2: true },
  },
  white: {
    pawn: { 9: true },
    lance: { 9: true },
    knight: { 9: true, 8: true },
  },
};

function isInvalidRank(color: Color, type: PieceType, rank: number): boolean {
  const rule = invalidRankMap[color][type];
  return rule ? rule[rank] : false;
}

function isPromotableRank(color: Color, rank: number): boolean {
  if (color === Color.BLACK) {
    return rank <= 3;
  }
  return rank >= 7;
}

function pawnExists(color: Color, board: Board, file: number): boolean {
  for (let rank = 1; rank <= 9; rank += 1) {
    const piece = board.at(new Square(file, rank));
    if (piece && piece.type === PieceType.PAWN && piece.color === color) {
      return true;
    }
  }
  return false;
}

export type PositionChange = {
  move?: {
    from: Square | Piece;
    to: Square | Color;
  };
  rotate?: Square;
};

export interface ImmutablePosition {
  readonly board: ImmutableBoard;
  readonly color: Color;
  readonly blackHand: ImmutableHand;
  readonly whiteHand: ImmutableHand;
  hand(color: Color): ImmutableHand;
  createMove(from: Square | PieceType, to: Square): Move | null;
  createMoveBySFEN(sfen: string): Move | null;
  isPawnDropMate(move: Move): boolean;
  isValidMove(move: Move): boolean;
  isValidEditing(from: Square | Piece, to: Square | Color): boolean;
  readonly sfen: string;
  getSfen(nextMoveNumber: number): string;
  clone(): Position;
}

export default class Position {
  private _board: Board;
  private _color: Color;
  private _blackHand: Hand;
  private _whiteHand: Hand;

  constructor() {
    this._board = new Board();
    this._color = Color.BLACK;
    this._blackHand = new Hand();
    this._whiteHand = new Hand();
  }

  get board(): Board {
    return this._board;
  }

  get color(): Color {
    return this._color;
  }

  get blackHand(): Hand {
    return this._blackHand;
  }

  get whiteHand(): Hand {
    return this._whiteHand;
  }

  reset(type: InitialPositionType): void {
    this._board.reset(type);
    this._blackHand = new Hand();
    this._whiteHand = new Hand();
    switch (type) {
      case InitialPositionType.STANDARD:
      case InitialPositionType.EMPTY:
      case InitialPositionType.TSUME_SHOGI:
        this._color = Color.BLACK;
        break;
      case InitialPositionType.HANDICAP_LANCE:
      case InitialPositionType.HANDICAP_RIGHT_LANCE:
      case InitialPositionType.HANDICAP_BISHOP:
      case InitialPositionType.HANDICAP_ROOK:
      case InitialPositionType.HANDICAP_ROOK_LANCE:
      case InitialPositionType.HANDICAP_2PIECES:
      case InitialPositionType.HANDICAP_4PIECES:
      case InitialPositionType.HANDICAP_6PIECES:
      case InitialPositionType.HANDICAP_8PIECES:
        this._color = Color.WHITE;
        break;
    }
    if (type === InitialPositionType.TSUME_SHOGI) {
      this._whiteHand.set(PieceType.PAWN, 18);
      this._whiteHand.set(PieceType.LANCE, 4);
      this._whiteHand.set(PieceType.KNIGHT, 4);
      this._whiteHand.set(PieceType.SILVER, 4);
      this._whiteHand.set(PieceType.GOLD, 4);
      this._whiteHand.set(PieceType.BISHOP, 2);
      this._whiteHand.set(PieceType.ROOK, 2);
    }
  }

  hand(color: Color): Hand {
    return this._hand(color);
  }

  _hand(color: Color): Hand {
    if (color === Color.BLACK) {
      return this._blackHand;
    }
    return this._whiteHand;
  }

  createMove(from: Square | PieceType, to: Square): Move | null {
    let pieceType: PieceType;
    if (from instanceof Square) {
      const piece = this._board.at(from);
      if (!piece) {
        return null;
      }
      pieceType = piece.type;
    } else {
      pieceType = from;
    }
    const capturedPiece = this._board.at(to);
    return new Move(
      from,
      to,
      false,
      this.color,
      pieceType,
      capturedPiece ? capturedPiece.type : null
    );
  }

  createMoveBySFEN(sfen: string): Move | null {
    const m = parseSFENMove(sfen);
    if (!m) {
      return null;
    }
    let move = this.createMove(m.from, m.to);
    if (!move) {
      return null;
    }
    if (m.promote) {
      move = move.withPromote();
    }
    return move;
  }

  isPawnDropMate(move: Move): boolean {
    if (move.from instanceof Square) {
      return false;
    }
    if (move.pieceType !== PieceType.PAWN) {
      return false;
    }
    const kingSquare = move.to.neighbor(
      move.color === Color.BLACK ? Direction.UP : Direction.DOWN
    );
    const king = this.board.at(kingSquare);
    if (!king || king.type !== PieceType.KING || king.color === move.color) {
      return false;
    }
    const movable = movableDirections(king).find((dir) => {
      const to = kingSquare.neighbor(dir);
      if (!to.valid) {
        return false;
      }
      const piece = this.board.at(to);
      if (piece && piece.color == king.color) {
        return false;
      }
      return !this.board.hasPower(to, move.color);
    });
    if (movable) {
      return false;
    }
    return !this.board.listSquaresByColor(king.color).find((from) => {
      return (
        !from.equals(kingSquare) &&
        this.isMovable(from, move.to) &&
        !this.board.isCheck(king.color, {
          filled: move.to,
          ignore: from,
        })
      );
    });
  }

  isValidMove(move: Move): boolean {
    if (move.from instanceof Square) {
      const target = this._board.at(move.from);
      if (!target || target.color !== this.color) {
        return false;
      }
      if (!this.isMovable(move.from, move.to)) {
        return false;
      }
      const captured = this._board.at(move.to);
      if (captured && captured.color === this.color) {
        return false;
      }
      if (move.promote) {
        if (!target.isPromotable()) {
          return false;
        }
        if (
          !isPromotableRank(this.color, move.from.rank) &&
          !isPromotableRank(this.color, move.to.rank)
        ) {
          return false;
        }
      } else if (isInvalidRank(this.color, target.type, move.to.rank)) {
        return false;
      }
      if (
        move.pieceType !== PieceType.KING
          ? this._board.isCheck(this.color, {
              filled: move.to,
              ignore: move.from,
            })
          : this._board.hasPower(move.to, reverseColor(this.color), {
              ignore: move.from,
            })
      ) {
        return false;
      }
    } else {
      if (move.promote) {
        return false;
      }
      if (move.color !== this.color) {
        return false;
      }
      if (this.hand(this.color).count(move.from) === 0) {
        return false;
      }
      if (this._board.at(move.to)) {
        return false;
      }
      if (isInvalidRank(this.color, move.from, move.to.rank)) {
        return false;
      }
      if (
        move.from === PieceType.PAWN &&
        pawnExists(this.color, this._board, move.to.file)
      ) {
        return false;
      }
      if (this._board.isCheck(this.color, { filled: move.to })) {
        return false;
      }
      if (this.isPawnDropMate(move)) {
        return false;
      }
    }
    // FIXME: 連続王手の千日手チェック
    return true;
  }

  doMove(move: Move): boolean {
    if (!this.isValidMove(move)) {
      return false;
    }
    if (move.from instanceof Square) {
      const target = this._board.at(move.from) as Piece;
      const captured = this._board.at(move.to);
      this._board.remove(move.from);
      this._board.set(move.to, move.promote ? target.promoted() : target);
      if (captured && captured.type !== PieceType.KING) {
        this._hand(this.color).add(captured.unpromoted().type, 1);
      }
    } else {
      this._hand(this.color).reduce(move.from, 1);
      this._board.set(move.to, new Piece(this.color, move.from));
    }
    this._color = reverseColor(this.color);
    return true;
  }

  undoMove(move: Move): void {
    this._color = reverseColor(this.color);
    if (move.from instanceof Square) {
      this._board.set(move.from, new Piece(this.color, move.pieceType));
      if (move.capturedPieceType) {
        const capturedPiece = new Piece(
          reverseColor(this.color),
          move.capturedPieceType
        );
        this._board.set(move.to, capturedPiece);
        if (capturedPiece.type !== PieceType.KING) {
          this._hand(this.color).reduce(capturedPiece.unpromoted().type, 1);
        }
      } else {
        this._board.remove(move.to);
      }
    } else {
      this._hand(this.color).add(move.from, 1);
      this._board.remove(move.to);
    }
  }

  isValidEditing(from: Square | Piece, to: Square | Color): boolean {
    if (from instanceof Square) {
      const piece = this._board.at(from);
      if (!piece) {
        return false;
      }
      if (to instanceof Square) {
        if (from.equals(to)) {
          return false;
        }
      } else if (piece.type === PieceType.KING) {
        return false;
      }
    } else {
      if (!from.color) {
        return false;
      }
      if (this.hand(from.color).count(from.type) === 0) {
        return false;
      }
      if (to instanceof Square) {
        if (this._board.at(to)) {
          return false;
        }
      } else if (from.color === to) {
        return false;
      }
    }
    return true;
  }

  edit(change: PositionChange): boolean {
    if (change.move) {
      if (!this.isValidEditing(change.move.from, change.move.to)) {
        return false;
      }
      if (!(change.move.from instanceof Square)) {
        this._hand(change.move.from.color).reduce(change.move.from.type, 1);
        if (change.move.to instanceof Square) {
          this._board.set(change.move.to, change.move.from);
        } else {
          this._hand(change.move.to).add(change.move.from.type, 1);
        }
      } else if (!(change.move.to instanceof Square)) {
        const piece = this._board.remove(change.move.from) as Piece;
        this._hand(change.move.to).add(piece.unpromoted().type, 1);
      } else {
        this._board.swap(change.move.from, change.move.to);
      }
    }
    if (change.rotate) {
      const piece = this._board.at(change.rotate);
      if (piece) {
        this._board.set(change.rotate, piece.rotate());
      }
    }
    return true;
  }

  get sfen(): string {
    return this.getSfen(1);
  }

  getSfen(nextMoveNumber: number): string {
    let ret = `sfen ${this._board.sfen} ${colorToSFEN(this.color)} `;
    ret += Hand.formatSFEN(this._blackHand, this._whiteHand);
    ret += " " + nextMoveNumber;
    return ret;
  }

  resetBySFEN(sfen: string): boolean {
    if (!Position.isValidSFEN(sfen)) {
      return false;
    }
    const sections = sfen.split(" ");
    this._board.resetBySFEN(sections[1]);
    this._color = parseSFENColor(sections[2]);
    const hands = Hand.parseSFEN(sections[3]) as { black: Hand; white: Hand };
    this._blackHand = hands.black;
    this._whiteHand = hands.white;
    return true;
  }

  setColor(color: Color): void {
    this._color = color;
  }

  static isValidSFEN(sfen: string): boolean {
    const sections = sfen.split(" ");
    if (sections.length < 5) {
      return false;
    }
    if (sections[0] !== "sfen") {
      return false;
    }
    if (!Board.isValidSFEN(sections[1])) {
      return false;
    }
    if (!isValidSFENColor(sections[2])) {
      return false;
    }
    if (!Hand.isValidSFEN(sections[3])) {
      return false;
    }
    return true;
  }

  static newBySFEN(sfen: string): Position | null {
    const position = new Position();
    return position.resetBySFEN(sfen) ? position : null;
  }

  private isMovable(from: Square, to: Square): boolean {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const { direction, distance, ok } = vectorToDirectionAndDistance(dx, dy);
    if (!ok) {
      return false;
    }
    const piece = this._board.at(from);
    if (!piece) {
      return false;
    }
    switch (resolveMoveType(piece, direction)) {
      default:
        return false;
      case MoveType.SHORT:
        return distance === 1;
      case MoveType.LONG: {
        const d = directionToDeltaMap[direction];
        for (
          let square = from.neighbor(d.x, d.y);
          square.valid;
          square = square.neighbor(d.x, d.y)
        ) {
          if (square.equals(to)) {
            return true;
          }
          if (this._board.at(square)) {
            return false;
          }
        }
        return false;
      }
    }
  }

  copyFrom(position: Position): void {
    this._board.copyFrom(position._board);
    this._color = position.color;
    this._blackHand.copyFrom(position._blackHand);
    this._whiteHand.copyFrom(position._whiteHand);
  }

  clone(): Position {
    const position = new Position();
    position.copyFrom(this);
    return position;
  }
}
