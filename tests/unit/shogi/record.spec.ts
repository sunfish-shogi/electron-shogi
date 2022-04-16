import {
  Color,
  getNextColorFromUSI,
  importKakinoki,
  Move,
  Record,
  SpecialMove,
  specialMoveToDisplayString,
  Square,
} from "@/shogi";

describe("shogi/record", () => {
  it("displayString", () => {
    expect(specialMoveToDisplayString(SpecialMove.RESIGN)).toBe("投了");
    expect(specialMoveToDisplayString(SpecialMove.TIMEOUT)).toBe("切れ負け");
  });

  it("usi", () => {
    expect(getNextColorFromUSI("position startpos moves ")).toBe(Color.BLACK);
    expect(getNextColorFromUSI("position startpos moves 2g2f 8c8d 2f2e")).toBe(
      Color.WHITE
    );
    expect(
      getNextColorFromUSI(
        "position sfen lnsgkgsnl/1r5b1/p1ppppppp/1p7/7P1/9/PPPPPPP1P/1B5R1/LNSGKGSNL w - 1 moves 8d8e"
      )
    ).toBe(Color.BLACK);
  });

  it("append/goBack/goForward/goto", () => {
    const record = new Record();
    const move = (ff: number, fr: number, tf: number, tr: number): Move => {
      return record.position.createMove(
        new Square(ff, fr),
        new Square(tf, tr)
      ) as Move;
    };
    expect(record.append(move(7, 7, 7, 6))).toBeTruthy();
    expect(record.append(move(3, 3, 3, 4))).toBeTruthy();
    expect(record.append(move(2, 7, 2, 6))).toBeTruthy();
    expect(record.goBack()).toBeTruthy();
    expect(record.goBack()).toBeTruthy();
    expect(record.append(move(8, 3, 8, 4))).toBeTruthy();
    expect(record.append(move(7, 9, 7, 8))).toBeTruthy();

    expect(record.goBack()).toBeTruthy();
    expect(record.goBack()).toBeTruthy();
    expect(record.goBack()).toBeTruthy();
    expect(record.usi).toBe(
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves"
    );
    expect(record.goBack()).toBeFalsy();

    expect(record.goForward()).toBeTruthy();
    record.goto(Number.MAX_SAFE_INTEGER);
    expect(record.usi).toBe(
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 8c8d 7i7h"
    );
    expect(record.goForward()).toBeFalsy();

    record.goto(2);
    expect(record.usi).toBe(
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 8c8d"
    );
    record.switchBranchByIndex(0);
    expect(record.usi).toBe(
      "position sfen lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1 moves 7g7f 3c3d"
    );
  });

  it("repetition", () => {
    const data = `
手合割：平手
手数----指手---------消費時間--
   1 ２六歩(27)        ( 0:00/00:00:00)
   2 ８四歩(83)        ( 0:00/00:00:00)
   3 ７六歩(77)        ( 0:00/00:00:00)
   4 ８五歩(84)        ( 0:00/00:00:00)
   5 ７七角(88)        ( 0:00/00:00:00)
   6 ３四歩(33)        ( 0:00/00:00:00)
   7 ６八銀(79)        ( 0:00/00:00:00)
   8 ３二金(41)        ( 0:00/00:00:00)
   9 ２五歩(26)        ( 0:00/00:00:00)
  10 ７七角成(22)       ( 0:00/00:00:00)
  11 同　銀(68)        ( 0:00/00:00:00)
  12 ２二銀(31)        ( 0:00/00:00:00)
  13 ４八銀(39)        ( 0:00/00:00:00)
  14 ３三銀(22)        ( 0:00/00:00:00)
  15 ４六歩(47)        ( 0:00/00:00:00)
  16 ６二銀(71)        ( 0:00/00:00:00)
  17 ３六歩(37)        ( 0:00/00:00:00)
  18 ４二玉(51)        ( 0:00/00:00:00)
  19 ３七桂(29)        ( 0:00/00:00:00)
  20 ６四歩(63)        ( 0:00/00:00:00)
  21 ６八玉(59)        ( 0:00/00:00:00)
  22 ６三銀(62)        ( 0:00/00:00:00)
  23 ７八金(69)        ( 0:00/00:00:00)
  24 ７四歩(73)        ( 0:00/00:00:00)
  25 ４七銀(48)        ( 0:00/00:00:00)
  26 ７三桂(81)        ( 0:00/00:00:00)
  27 １六歩(17)        ( 0:00/00:00:00)
  28 １四歩(13)        ( 0:00/00:00:00)
  29 ９六歩(97)        ( 0:00/00:00:00)
  30 ９四歩(93)        ( 0:00/00:00:00)
  31 ４八金(49)        ( 0:00/00:00:00)
  32 ８一飛(82)        ( 0:00/00:00:00)
  33 ２九飛(28)        ( 0:00/00:00:00)
  34 ６二金(61)        ( 0:00/00:00:00)
  35 ５六銀(47)        ( 0:00/00:00:00)
  36 ５四銀(63)        ( 0:00/00:00:00)
  37 ６六歩(67)        ( 0:00/00:00:00)
  38 ６三銀(54)        ( 0:00/00:00:00)
  39 ４七銀(56)        ( 0:00/00:00:00)
  40 ５四銀(63)        ( 0:00/00:00:00)
  41 ５六銀(47)        ( 0:00/00:00:00)
  42 ６三銀(54)        ( 0:00/00:00:00)
  43 ４七銀(56)        ( 0:00/00:00:00)
  44 ５四銀(63)        ( 0:00/00:00:00)
  45 ５六銀(47)        ( 0:00/00:00:00)
  46 ６三銀(54)        ( 0:00/00:00:00)
  47 ４七銀(56)        ( 0:00/00:00:00)
  48 ５四銀(63)        ( 0:00/00:00:00)
  49 ５六銀(47)        ( 0:00/00:00:00)
`;
    const record = importKakinoki(data) as Record;
    record.goto(49);
    expect(record.repetition).toBeTruthy();
    expect(record.perpetualCheck).toBeFalsy();
    record.goBack();
    expect(record.repetition).toBeFalsy();
    expect(record.perpetualCheck).toBeFalsy();
  });

  it("perpetualCheck/black", () => {
    const data = `
後手の持駒：金 歩五 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| 龍 ・ ・ ・ ・ ・ ・v桂v香|一
| ・ ・ ・ ・ ・ ・v銀 ・v玉|二
|v歩 ・v桂 ・ ・v銀 ・v銀 ・|三
| ・v金 ・ ・ ・ 角v歩 ・v歩|四
| ・ ・v歩 歩 歩 桂 歩v歩 ・|五
| 玉 歩v銀 ・ ・ 金 ・ ・ 歩|六
| 桂 ・ ・ ・v歩 ・ ・ ・ ・|七
| ・ 金 ・ ・ ・ ・v龍 ・ ・|八
| 香 香 ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：角 香 歩二 
手数----指手---------消費時間--
   1 １三香打           ( 0:00/00:00:00)
   2 同　玉(12)        ( 0:00/00:00:00)
   3 ３一角打           ( 0:00/00:00:00)
   4 ２四玉(13)        ( 0:00/00:00:00)
   5 ４二角成(31)       ( 0:00/00:00:00)
   6 １三玉(24)        ( 0:00/00:00:00)
   7 ３一馬(42)        ( 0:00/00:00:00)
   8 ２四玉(13)        ( 0:00/00:00:00)
   9 ４二馬(31)        ( 0:00/00:00:00)
  10 １三玉(24)        ( 0:00/00:00:00)
  11 ３一馬(42)        ( 0:00/00:00:00)
  12 ２四玉(13)        ( 0:00/00:00:00)
  13 ４二馬(31)        ( 0:00/00:00:00)
  14 １三玉(24)        ( 0:00/00:00:00)
  15 ３一馬(42)        ( 0:00/00:00:00)
  16 ２四玉(13)        ( 0:00/00:00:00)
  17 ４二馬(31)        ( 0:00/00:00:00)
`;
    const record = importKakinoki(data) as Record;
    record.goto(17);
    expect(record.repetition).toBeTruthy();
    expect(record.perpetualCheck).toBe(Color.BLACK);
    record.goBack();
    expect(record.repetition).toBeFalsy();
    expect(record.perpetualCheck).toBeNull();
  });

  it("perpetualCheck/white", () => {
    const data = `
後手の持駒：歩三 
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・v桂 ・ ・ ・ ・ ・v香v香|一
| ・ ・ ・ ・ 飛 ・ ・v金 ・|二
| ・v金 ・ ・ 歩 ・ ・ ・v桂|三
|v歩 ・ ・ ・ ・ ・ 銀v歩v玉|四
| ・ 玉v歩 ・v歩v歩 歩 ・ ・|五
| 歩 ・ 歩v角 ・ ・ ・ 金 ・|六
| ・ 銀 ・ 銀 ・ ・ 桂 ・ 歩|七
| ・ ・ 銀 ・ ・ ・ ・ ・ ・|八
| 香 桂v馬 ・ ・ ・ ・ ・v龍|九
+---------------------------+
先手の持駒：金 香 歩五 
後手番
手数----指手---------消費時間--
   1 ７三桂(81)        ( 0:00/00:00:00)
   2 ８六玉(85)        ( 0:00/00:00:00)
   3 ６八馬(79)        ( 0:00/00:00:00)
   4 ９七玉(86)        ( 0:00/00:00:00)
   5 ７九馬(68)        ( 0:00/00:00:00)
   6 ８六玉(97)        ( 0:00/00:00:00)
   7 ６八馬(79)        ( 0:00/00:00:00)
   8 ９七玉(86)        ( 0:00/00:00:00)
   9 ７九馬(68)        ( 0:00/00:00:00)
  10 ８六玉(97)        ( 0:00/00:00:00)
  11 ６八馬(79)        ( 0:00/00:00:00)
  12 ９七玉(86)        ( 0:00/00:00:00)
  13 ７九馬(68)        ( 0:00/00:00:00)
  14 ８六玉(97)        ( 0:00/00:00:00)
`;
    const record = importKakinoki(data) as Record;
    record.goto(14);
    expect(record.repetition).toBeTruthy();
    expect(record.perpetualCheck).toBe(Color.WHITE);
    record.goBack();
    expect(record.repetition).toBeFalsy();
    expect(record.perpetualCheck).toBeNull();
  });
});
