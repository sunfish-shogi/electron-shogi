import { defaultRecordFileName, dirname, join } from "@/renderer/helpers/path";
import { RecordMetadata, RecordMetadataKey } from "electron-shogi-core";

describe("helpers/path", () => {
  it("dirname", async () => {
    expect(dirname("/home/user/foo/bar.baz")).toBe("/home/user/foo");
    expect(dirname("C:\\\\foo\\bar.baz")).toBe("C:\\\\foo");
    expect(dirname("file:///home/user/foo/bar.baz")).toBe("file:///home/user/foo");
  });

  it("join", async () => {
    expect(join("/home/user/foo", "bar/baz.qux")).toBe("/home/user/foo/bar/baz.qux");
    expect(join("/home/user/foo/", "/bar/baz.qux")).toBe("/home/user/foo/bar/baz.qux");
    expect(join("./foo/", "/bar/baz.qux")).toBe("./foo/bar/baz.qux");
    expect(join("C:\\\\Users\\foo\\", "\\bar\\baz.qux")).toBe("C:\\\\Users\\foo\\bar\\baz.qux");
  });

  it("defaultRecordFileName/emptyMetadata", async () => {
    const meta = new RecordMetadata();
    expect(defaultRecordFileName(meta)).toMatch(/^[0-9]{8}\.kif$/);
  });

  it("defaultRecordFileName/withDate", async () => {
    const meta = new RecordMetadata();
    meta.setStandardMetadata(RecordMetadataKey.DATE, "2022/09/30");
    expect(defaultRecordFileName(meta)).toBe("20220930.kif");
  });

  it("defaultRecordFileName/withStartDateTime", async () => {
    const meta = new RecordMetadata();
    meta.setStandardMetadata(RecordMetadataKey.DATE, "2022/01/01");
    meta.setStandardMetadata(RecordMetadataKey.START_DATETIME, "2022/01/02 11:30");
    expect(defaultRecordFileName(meta)).toBe("20220102_1130.kif");
  });

  it("defaultRecordFileName/withTitle", async () => {
    const meta = new RecordMetadata();
    meta.setStandardMetadata(RecordMetadataKey.DATE, "2022/01/01");
    meta.setStandardMetadata(RecordMetadataKey.START_DATETIME, "2022/01/02 11:30");
    meta.setStandardMetadata(RecordMetadataKey.TITLE, "My New Game");
    expect(defaultRecordFileName(meta)).toBe("20220102_1130_My New Game.kif");
  });

  it("defaultRecordFileName/withTournament", async () => {
    const meta = new RecordMetadata();
    meta.setStandardMetadata(RecordMetadataKey.DATE, "2022/01/01");
    meta.setStandardMetadata(RecordMetadataKey.START_DATETIME, "2022/01/02 11:30");
    meta.setStandardMetadata(RecordMetadataKey.TOURNAMENT, "My Tournament");
    expect(defaultRecordFileName(meta)).toBe("20220102_1130_My Tournament.kif");
  });

  it("defaultRecordFileName/withPlayerName", async () => {
    const meta = new RecordMetadata();
    meta.setStandardMetadata(RecordMetadataKey.DATE, "2022/01/01");
    meta.setStandardMetadata(RecordMetadataKey.BLACK_NAME, "先手の人");
    meta.setStandardMetadata(RecordMetadataKey.WHITE_NAME, "後手の人");
    expect(defaultRecordFileName(meta)).toBe("20220101_先手の人_後手の人.kif");
  });

  it("defaultRecordFileName/withTitleAndPlayerName", async () => {
    const meta = new RecordMetadata();
    meta.setStandardMetadata(RecordMetadataKey.DATE, "2022/01/01");
    meta.setStandardMetadata(RecordMetadataKey.TITLE, "My New Game");
    meta.setStandardMetadata(RecordMetadataKey.BLACK_NAME, "先手の人");
    meta.setStandardMetadata(RecordMetadataKey.WHITE_NAME, "後手の人");
    expect(defaultRecordFileName(meta)).toBe("20220101_My New Game_先手の人_後手の人.kif");
  });

  it("defaultRecordFileName/escape", async () => {
    const meta = new RecordMetadata();
    meta.setStandardMetadata(RecordMetadataKey.DATE, "2022/01/01");
    meta.setStandardMetadata(RecordMetadataKey.BLACK_NAME, "Foo:Bar<Baz");
    meta.setStandardMetadata(RecordMetadataKey.WHITE_NAME, "Qux|Quux>Corge");
    expect(defaultRecordFileName(meta)).toBe("20220101_Foo_Bar_Baz_Qux_Quux_Corge.kif");
  });
});
