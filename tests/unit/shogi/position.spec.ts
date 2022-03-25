import { Color, Move, Piece, Position, Square } from "@/shogi";
import { PieceType } from "@/shogi";

describe("shogi/position", () => {
  it("getters", () => {
    const position = new Position();
    expect(position.color).toBe(Color.BLACK);
    expect(position.board.at(new Square(8, 2))).toStrictEqual(
      new Piece(Color.WHITE, PieceType.ROOK)
    );
    expect(position.hand(Color.BLACK).count(PieceType.PAWN)).toBe(0);
    expect(position.hand(Color.WHITE).count(PieceType.PAWN)).toBe(0);

    position.blackHand.add(PieceType.PAWN, 1);
    position.whiteHand.add(PieceType.PAWN, 2);
    expect(position.hand(Color.BLACK).count(PieceType.PAWN)).toBe(1);
    expect(position.hand(Color.WHITE).count(PieceType.PAWN)).toBe(2);
  });

  it("move", () => {
    const position = new Position();
    const from = new Square(2, 7);
    const to = new Square(2, 6);
    const move = position.createMove(from, to);
    expect(move).toBeInstanceOf(Move);
    expect(move?.color).toBe(Color.BLACK);
    expect(position.isValidMove(move as Move)).toBeTruthy();
    expect(position.doMove(move as Move)).toBeTruthy();
    expect(position.board.at(from)).toBeNull();
    expect(position.board.at(to)).toStrictEqual(
      new Piece(Color.BLACK, PieceType.PAWN)
    );

    // TODO: テストを追加する。
  });

  it("sfen", () => {
    const sfen =
      "sfen l2R2s1+P/4gg1k1/p1+P2lPp1/4p1p+b1/1p3G3/3pP1nS1/PP3KSP1/R8/L4G2+b b NL4Ps2np 1";
    const position = Position.newBySFEN(sfen);
    expect(position).toBeInstanceOf(Position);
    expect(position?.color).toBe(Color.BLACK);
    expect(position?.board.at(new Square(4, 7))).toStrictEqual(
      new Piece(Color.BLACK, PieceType.KING)
    );
    expect(position?.board.at(new Square(4, 3))).toStrictEqual(
      new Piece(Color.WHITE, PieceType.LANCE)
    );
    expect(position?.board.at(new Square(2, 4))).toStrictEqual(
      new Piece(Color.WHITE, PieceType.HORSE)
    );
    expect(position?.blackHand.count(PieceType.PAWN)).toBe(4);
    expect(position?.blackHand.count(PieceType.LANCE)).toBe(1);
    expect(position?.blackHand.count(PieceType.KNIGHT)).toBe(1);
    expect(position?.blackHand.count(PieceType.SILVER)).toBe(0);
    expect(position?.whiteHand.count(PieceType.PAWN)).toBe(1);
    expect(position?.whiteHand.count(PieceType.LANCE)).toBe(0);
    expect(position?.whiteHand.count(PieceType.KNIGHT)).toBe(2);
    expect(position?.whiteHand.count(PieceType.SILVER)).toBe(1);
    expect(position?.sfen).toBe(sfen);
  });
});
