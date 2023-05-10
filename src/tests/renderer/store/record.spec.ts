import { CommentBehavior } from "@/common/settings/analysis";
import { Color, Move, PieceType, Square } from "@/common/shogi";
import { RecordManager, SearchInfoSenderType } from "@/renderer/store/record";

describe("store/record", () => {
  it("appendComment", () => {
    const recordManager = new RecordManager();
    recordManager.appendComment("aaa", CommentBehavior.INSERT);
    expect(recordManager.record.current.comment).toBe("aaa");
    recordManager.appendComment("aaa", CommentBehavior.NONE);
    expect(recordManager.record.current.comment).toBe("aaa");
    recordManager.appendComment("bbb", CommentBehavior.INSERT);
    expect(recordManager.record.current.comment).toBe("bbb\naaa");
    recordManager.appendComment("ccc", CommentBehavior.APPEND);
    expect(recordManager.record.current.comment).toBe("bbb\naaa\nccc");
    recordManager.appendComment("ddd", CommentBehavior.OVERWRITE);
    expect(recordManager.record.current.comment).toBe("ddd");
    recordManager.appendComment("", CommentBehavior.INSERT);
    expect(recordManager.record.current.comment).toBe("ddd");
  });

  it("appendSearchComment", () => {
    const recordManager = new RecordManager();
    recordManager.appendSearchComment(
      SearchInfoSenderType.RESEARCHER,
      {
        depth: 8,
        score: 158,
        pv: [
          new Move(
            new Square(7, 7),
            new Square(7, 6),
            false,
            Color.BLACK,
            PieceType.PAWN,
            null
          ),
          new Move(
            new Square(3, 3),
            new Square(3, 4),
            false,
            Color.WHITE,
            PieceType.PAWN,
            null
          ),
        ],
      },
      CommentBehavior.INSERT,
      {
        engineName: "Engine01",
      }
    );
    expect(recordManager.record.current.comment).toBe(
      "互角\n#評価値=158\n#読み筋=▲７六歩△３四歩\n#深さ=8\n#エンジン=Engine01\n"
    );
    recordManager.appendSearchComment(
      SearchInfoSenderType.PLAYER,
      {
        depth: 10,
        score: 210,
        pv: [
          new Move(
            new Square(2, 7),
            new Square(2, 6),
            false,
            Color.BLACK,
            PieceType.PAWN,
            null
          ),
          new Move(
            new Square(3, 3),
            new Square(3, 4),
            false,
            Color.WHITE,
            PieceType.PAWN,
            null
          ),
        ],
      },
      CommentBehavior.INSERT
    );
    expect(recordManager.record.current.comment).toBe(
      "先手有望\n*評価値=210\n*読み筋=▲２六歩△３四歩\n*深さ=10\n\n互角\n#評価値=158\n#読み筋=▲７六歩△３四歩\n#深さ=8\n#エンジン=Engine01\n"
    );
  });

  it("appendMovesSilently", () => {
    const recordManager = new RecordManager();
    recordManager.appendMovesSilently([
      new Move(
        new Square(7, 7),
        new Square(7, 6),
        false,
        Color.BLACK,
        PieceType.PAWN,
        null
      ),
      new Move(
        new Square(3, 3),
        new Square(3, 4),
        false,
        Color.WHITE,
        PieceType.PAWN,
        null
      ),
    ]);
    expect(recordManager.record.current.ply).toBe(0);
    expect(recordManager.record.moves).toHaveLength(3);
  });
});
