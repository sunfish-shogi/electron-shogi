import {
  Move,
  Record,
  SpecialMove,
  getMoveDisplayText,
  getSpecialMoveDisplayString,
  importKakinoki,
} from "@/common/shogi";

describe("shogi/record", () => {
  it("getSpecialMoveDisplayString", () => {
    expect(getSpecialMoveDisplayString(SpecialMove.RESIGN)).toBe("投了");
    expect(getSpecialMoveDisplayString(SpecialMove.TIMEOUT)).toBe("切れ負け");
  });

  it("getMoveDisplayText/black", () => {
    const record = importKakinoki(`
後手の持駒：
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ ・ ・ ・|一
| ・ 銀 ・ ・ ・ ・ 金 ・ ・|二
| ・ ・ ・ ・ ・ ・ ・ ・ ・|三
| ・ 銀 ・ 銀 ・ 金 ・ 金 ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
| 馬 馬 ・vと とvと ・ ・ ・|六
| ・ ・ ・ とvと と ・ ・ ・|七
| 龍 龍 ・ と とvと 桂 ・ 桂|八
| ・ ・ ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：金桂二
先手番`) as Record;
    const position = record.position;
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("3b2b") as Move)
    ).toBe("☗２二金");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("3b3c") as Move)
    ).toBe("☗３三金引");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("2d3c") as Move)
    ).toBe("☗３三金右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("4d3c") as Move)
    ).toBe("☗３三金左");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("G*3c") as Move)
    ).toBe("☗３三金打");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8b7a") as Move)
    ).toBe("☗７一銀不成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8b7a+") as Move)
    ).toBe("☗７一銀成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8b7c") as Move)
    ).toBe("☗７三銀引不成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8b7c+") as Move)
    ).toBe("☗７三銀引成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8d7c") as Move)
    ).toBe("☗７三銀左上不成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8d7c+") as Move)
    ).toBe("☗７三銀左上成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6d7c") as Move)
    ).toBe("☗７三銀右不成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6d7c+") as Move)
    ).toBe("☗７三銀右成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6d7e") as Move)
    ).toBe("☗７五銀右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("1h2f") as Move)
    ).toBe("☗２六桂右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("3h2f") as Move)
    ).toBe("☗２六桂左");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("N*2f") as Move)
    ).toBe("☗２六桂打");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("N*1f") as Move)
    ).toBe("☗１六桂");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("3h4f") as Move)
    ).toBe("☗４六桂");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("5f5g") as Move)
    ).toBe("☗５七と引");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("5h5g") as Move)
    ).toBe("☗５七と直");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("4g5g") as Move)
    ).toBe("☗５七と右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6g5g") as Move)
    ).toBe("☗５七と左寄");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6h5g") as Move)
    ).toBe("☗５七と左上");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6g7g") as Move)
    ).toBe("☗７七と寄");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6h7g") as Move)
    ).toBe("☗７七と上");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8f8g") as Move)
    ).toBe("☗８七馬右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("9f8g") as Move)
    ).toBe("☗８七馬左");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8h8g") as Move)
    ).toBe("☗８七龍右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("9h8g") as Move)
    ).toBe("☗８七龍左");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("9h8g") as Move, {
        prev: position.createMoveByUSI("9h8g") as Move,
      })
    ).toBe("☗同　龍左");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("9h8g") as Move, {
        compatible: true,
      })
    ).toBe("▲８七龍左");
  });

  it("getMoveDisplayText/black", () => {
    const record = importKakinoki(`
後手の持駒：
  ９ ８ ７ ６ ５ ４ ３ ２ １
+---------------------------+
| ・ ・ ・ ・ ・ ・ ・ ・ ・|一
| ・ ・v金 ・ ・ ・ ・ ・ ・|二
| ・ ・ ・ ・ ・ ・ ・ ・ ・|三
| ・v金 ・ ・ ・v銀 ・ ・ ・|四
| ・ ・ ・ ・ ・ ・ ・ ・ ・|五
|v馬 ・ ・v銀 ・ ・ ・v圭v圭|六
| ・ ・ ・ ・ ・ ・ ・ ・ ・|七
| ・ ・ ・v馬 ・ ・ ・ ・v圭|八
| ・ ・ ・ ・ ・ ・ ・ ・ ・|九
+---------------------------+
先手の持駒：
後手番`) as Record;
    const position = record.position;
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6h6i") as Move)
    ).toBe("☖６九馬左");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("9f6i") as Move)
    ).toBe("☖６九馬右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6h9e") as Move)
    ).toBe("☖９五馬左");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("9f9e") as Move)
    ).toBe("☖９五馬右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6f5g+") as Move)
    ).toBe("☖５七銀成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6f5g") as Move)
    ).toBe("☖５七銀不成");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("6f5e") as Move)
    ).toBe("☖５五銀引");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("4d5e") as Move)
    ).toBe("☖５五銀上");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("1h1g") as Move)
    ).toBe("☖１七成桂引");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("1f1g") as Move)
    ).toBe("☖１七成桂直");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("2f1g") as Move)
    ).toBe("☖１七成桂右");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("7b8c") as Move)
    ).toBe("☖８三金上");
    expect(
      getMoveDisplayText(position, position.createMoveByUSI("8d8c") as Move)
    ).toBe("☖８三金引");
  });
});
