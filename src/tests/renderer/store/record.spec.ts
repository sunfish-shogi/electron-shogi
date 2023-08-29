import { CommentBehavior } from "@/common/settings/analysis";
import {
  Color,
  InitialPositionSFEN,
  InitialPositionType,
  Move,
  PieceType,
  RecordFormatType,
  SpecialMoveType,
  Square,
  specialMove,
} from "@/common/shogi";
import { SCORE_MATE_INFINITE } from "@/common/usi";
import { RecordManager, SearchInfoSenderType } from "@/renderer/store/record";

describe("store/record", () => {
  it("unsaved", () => {
    const recordManager = new RecordManager();
    expect(recordManager.unsaved).toBeFalsy();
  });

  it("reset", () => {
    const recordManager = new RecordManager();
    recordManager.appendMove({ move: specialMove(SpecialMoveType.RESIGN) });
    expect(recordManager.record.moves).toHaveLength(2);
    expect(recordManager.unsaved).toBeTruthy();

    // 指定した局面 (SFEN) で初期化する。
    recordManager.resetBySFEN(InitialPositionSFEN.HANDICAP_4PIECES);
    expect(recordManager.record.position.sfen).toBe(InitialPositionSFEN.HANDICAP_4PIECES);
    expect(recordManager.record.moves).toHaveLength(1);
    expect(recordManager.unsaved).toBeFalsy();

    // 1 手追加する。
    recordManager.appendMove({ move: specialMove(SpecialMoveType.RESIGN) });
    expect(recordManager.record.moves).toHaveLength(2);
    expect(recordManager.unsaved).toBeTruthy();

    // 指定した局面で初期化する。
    recordManager.resetByInitialPositionType(InitialPositionType.HANDICAP_ROOK);
    expect(recordManager.record.position.sfen).toBe(InitialPositionSFEN.HANDICAP_ROOK);
    expect(recordManager.record.moves).toHaveLength(1);
    expect(recordManager.unsaved).toBeFalsy();

    // 1 手追加する。
    recordManager.appendMove({
      move: new Move(new Square(3, 3), new Square(3, 4), false, Color.WHITE, PieceType.PAWN, null),
    });
    expect(recordManager.record.moves).toHaveLength(2);
    expect(recordManager.record.current.ply).toBe(1);
    expect(recordManager.unsaved).toBeTruthy();

    // 指し手をすべて削除する。
    recordManager.reset();
    expect(recordManager.record.position.sfen).toBe(InitialPositionSFEN.HANDICAP_ROOK);
    expect(recordManager.record.moves).toHaveLength(1);
    expect(recordManager.unsaved).toBeFalsy();

    // 1 手追加する。
    recordManager.appendMove({
      move: new Move(new Square(3, 3), new Square(3, 4), false, Color.WHITE, PieceType.PAWN, null),
    });
    expect(recordManager.record.moves).toHaveLength(2);
    expect(recordManager.record.current.ply).toBe(1);
    expect(recordManager.unsaved).toBeTruthy();

    // 現在の局面で初期化する。
    recordManager.resetByCurrentPosition();
    expect(recordManager.record.position.sfen).toBe(
      "lnsgkgsnl/7b1/pppppp1pp/6p2/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    expect(recordManager.record.moves).toHaveLength(1);
    expect(recordManager.unsaved).toBeFalsy();
  });

  it("appendComment", () => {
    const recordManager = new RecordManager();
    recordManager.appendComment("aaa", CommentBehavior.INSERT);
    expect(recordManager.record.current.comment).toBe("aaa");
    expect(recordManager.unsaved).toBeTruthy();
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
          new Move(new Square(7, 7), new Square(7, 6), false, Color.BLACK, PieceType.PAWN, null),
          new Move(new Square(3, 3), new Square(3, 4), false, Color.WHITE, PieceType.PAWN, null),
        ],
      },
      CommentBehavior.INSERT,
      {
        engineName: "Engine01",
      },
    );
    recordManager.appendSearchComment(
      SearchInfoSenderType.PLAYER,
      {
        depth: 10,
        score: 210,
        pv: [
          new Move(new Square(2, 7), new Square(2, 6), false, Color.BLACK, PieceType.PAWN, null),
          new Move(new Square(3, 3), new Square(3, 4), false, Color.WHITE, PieceType.PAWN, null),
        ],
      },
      CommentBehavior.INSERT,
    );
    expect(recordManager.record.current.comment).toBe(
      "先手有望\n*評価値=210\n*読み筋=▲２六歩△３四歩\n*深さ=10\n\n互角\n#評価値=158\n#読み筋=▲７六歩△３四歩\n#深さ=8\n#エンジン=Engine01\n",
    );
    expect(recordManager.unsaved).toBeTruthy();
  });

  it("appendSearchComment/mate", () => {
    const recordManager = new RecordManager();
    recordManager.appendSearchComment(
      SearchInfoSenderType.PLAYER,
      { mate: 15 },
      CommentBehavior.APPEND,
      { engineName: "Engine01" },
    );
    recordManager.appendSearchComment(
      SearchInfoSenderType.RESEARCHER,
      { mate: -SCORE_MATE_INFINITE },
      CommentBehavior.APPEND,
      { engineName: "Engine02" },
    );
    expect(recordManager.record.current.comment).toBe(
      "*詰み=先手勝ち:15手\n*エンジン=Engine01\n\n#詰み=後手勝ち\n#エンジン=Engine02\n",
    );
    expect(recordManager.unsaved).toBeTruthy();
  });

  it("appendMovesSilently", () => {
    const recordManager = new RecordManager();
    recordManager.appendMovesSilently([
      new Move(new Square(7, 7), new Square(7, 6), false, Color.BLACK, PieceType.PAWN, null),
      new Move(new Square(3, 3), new Square(3, 4), false, Color.WHITE, PieceType.PAWN, null),
    ]);
    expect(recordManager.record.current.ply).toBe(0);
    expect(recordManager.record.moves).toHaveLength(3);
    expect(recordManager.unsaved).toBeTruthy();
  });

  it("importRecord", () => {
    const recordManager = new RecordManager();
    expect(
      recordManager.importRecord(`手合割：平手
手数----指手---------消費時間--
   1 ２六歩(27)   ( 0:00/00:00:00)
   2 ８四歩(83)   ( 0:00/00:00:00)
**評価値=80
*
*#評価値=-60
   3 ７六歩(77)   ( 0:00/00:00:00)
**詰み=先手勝ち
*
*#詰み=後手勝ち
   4 ８五歩(84)   ( 0:00/00:00:00)
**詰み=先手勝ち:15手
*
*#詰み=後手勝ち:8手
`),
    ).toBeUndefined();
    recordManager.changePly(2);
    expect(recordManager.record.current.customData).toStrictEqual({
      playerSearchInfo: { score: 80 },
      researchInfo: { score: -60 },
    });
    recordManager.changePly(3);
    expect(recordManager.record.current.customData).toStrictEqual({
      playerSearchInfo: { mate: SCORE_MATE_INFINITE },
      researchInfo: { mate: -SCORE_MATE_INFINITE },
    });
    recordManager.changePly(4);
    expect(recordManager.record.current.customData).toStrictEqual({
      playerSearchInfo: { mate: 15 },
      researchInfo: { mate: -8 },
    });
    expect(recordManager.unsaved).toBeTruthy();

    expect(recordManager.importRecord(InitialPositionSFEN.TSUME_SHOGI)).toBeUndefined();
    expect(recordManager.record.position.sfen).toBe(InitialPositionSFEN.TSUME_SHOGI);
    expect(recordManager.record.moves).toHaveLength(1);
    expect(recordManager.unsaved).toBeTruthy();

    expect(
      recordManager.importRecord(
        `手合割：平手
1 ２六歩(27)
2 ８四歩(83)
3 ２五歩(26)`,
        { markAsSaved: false },
      ),
    ).toBeUndefined();
    expect(recordManager.record.position.sfen).toBe(InitialPositionSFEN.STANDARD);
    expect(recordManager.record.moves).toHaveLength(4);
    expect(recordManager.unsaved).toBeTruthy();

    expect(
      recordManager.importRecord(
        `手合割：平手
▲５八飛    △８四歩    ▲７六歩    △８五歩    ▲７七角`,
        { markAsSaved: true },
      ),
    ).toBeUndefined();
    expect(recordManager.record.position.sfen).toBe(InitialPositionSFEN.STANDARD);
    expect(recordManager.record.moves).toHaveLength(6);
    expect(recordManager.unsaved).toBeFalsy();

    expect(
      recordManager.importRecord(`手合割：平手`, { type: RecordFormatType.SFEN }),
    ).toBeInstanceOf(Error);
  });
});
