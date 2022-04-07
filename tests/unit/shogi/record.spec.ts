import {
  Color,
  getNextColorFromUSI,
  SpecialMove,
  specialMoveToDisplayString,
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
});
