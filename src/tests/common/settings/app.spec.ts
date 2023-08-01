import {
  normalizeAppSetting,
  getPieceImageBaseURL,
  defaultAppSetting,
  PieceImageType,
} from "@/common/settings/app";

describe("settings/csa", () => {
  it("normalize", () => {
    const result = normalizeAppSetting(defaultAppSetting(), {
      returnCode: "\r\n",
      autoSaveDirectory: "/tmp",
    });
    expect(result).toStrictEqual(defaultAppSetting());
  });

  it("pieceImageBaseURL", () => {
    expect(
      getPieceImageBaseURL({
        ...defaultAppSetting(),
        pieceImage: PieceImageType.HITOMOJI,
      }),
    ).toBe("./piece/hitomoji");

    expect(
      getPieceImageBaseURL({
        ...defaultAppSetting(),
        pieceImage: PieceImageType.HITOMOJI_GOTHIC,
      }),
    ).toBe("./piece/hitomoji_gothic");

    expect(
      getPieceImageBaseURL({
        ...defaultAppSetting(),
        pieceImage: PieceImageType.HITOMOJI_DARK,
      }),
    ).toBe("./piece/hitomoji_dark");

    expect(
      getPieceImageBaseURL({
        ...defaultAppSetting(),
        pieceImage: PieceImageType.HITOMOJI_GOTHIC_DARK,
      }),
    ).toBe("./piece/hitomoji_gothic_dark");

    expect(
      getPieceImageBaseURL({
        ...defaultAppSetting(),
        pieceImage: PieceImageType.CUSTOM_IMAGE,
        pieceImageFileURL: "/home/user/pictures/piece.png",
        croppedPieceImageBaseURL: "file:///home/user/.cache/piece",
      }),
    ).toBe("file:///home/user/.cache/piece");
  });
});
