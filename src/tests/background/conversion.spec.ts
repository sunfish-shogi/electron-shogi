import { convertRecordFiles } from "@/background/conversion";
import { RecordFileFormat } from "@/common/file";
import { FileNameConflictAction } from "@/common/settings/conversion";
import fs from "fs";
import path from "path";
import os from "os";
import { listFiles } from "@/background/helpers/file";

const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), "es-test-conversion-"));

describe("conversion", () => {
  it("all-to-csa/with-subdir", () => {
    const destination = path.join(tmpdir, "all-to-csa/with-subdir");
    const result = convertRecordFiles({
      source: "src/tests/testdata/conversion",
      sourceFormats: [
        RecordFileFormat.KIF,
        RecordFileFormat.KIFU,
        RecordFileFormat.KI2,
        RecordFileFormat.KI2U,
        RecordFileFormat.CSA,
      ],
      subdirectories: true,
      destination: destination,
      destinationFormat: RecordFileFormat.CSA,
      fileNameConflictAction: FileNameConflictAction.OVERWRITE,
    });
    expect(result).toStrictEqual({
      succeededTotal: 8,
      succeeded: {
        ".kif": 4,
        ".kifu": 1,
        ".ki2": 1,
        ".ki2u": 1,
        ".csa": 1,
      },
      failedTotal: 0,
      failed: {},
      skippedTotal: 0,
      skipped: {},
    });
    expect(listFiles(destination, Infinity).sort()).toStrictEqual([
      path.join(destination, "csa-sjis.csa"),
      path.join(destination, "ki2-sjis.csa"),
      path.join(destination, "ki2u-utf8.csa"),
      path.join(destination, "kif-sjis.csa"),
      path.join(destination, "kifu-utf8.csa"),
      path.join(destination, "sub01/kif-sjis.csa"),
      path.join(destination, "sub01/sub0101/kif-sjis.csa"),
      path.join(destination, "sub02/kif-sjis.csa"),
    ]);
  });

  it("all-to-csa/without-subdir", () => {
    const destination = path.join(tmpdir, "all-to-csa/without-subdir");
    const result = convertRecordFiles({
      source: "src/tests/testdata/conversion",
      sourceFormats: [
        RecordFileFormat.KIF,
        RecordFileFormat.KIFU,
        RecordFileFormat.KI2,
        RecordFileFormat.KI2U,
        RecordFileFormat.CSA,
      ],
      subdirectories: false,
      destination: destination,
      destinationFormat: RecordFileFormat.CSA,
      fileNameConflictAction: FileNameConflictAction.OVERWRITE,
    });
    expect(result).toStrictEqual({
      succeededTotal: 5,
      succeeded: {
        ".kif": 1,
        ".kifu": 1,
        ".ki2": 1,
        ".ki2u": 1,
        ".csa": 1,
      },
      failedTotal: 0,
      failed: {},
      skippedTotal: 0,
      skipped: {},
    });
    expect(listFiles(destination, Infinity).sort()).toStrictEqual([
      path.join(destination, "csa-sjis.csa"),
      path.join(destination, "ki2-sjis.csa"),
      path.join(destination, "ki2u-utf8.csa"),
      path.join(destination, "kif-sjis.csa"),
      path.join(destination, "kifu-utf8.csa"),
    ]);
  });

  it("csa-to-ki2", () => {
    const destination = path.join(tmpdir, "csa-to-ki2");
    const result = convertRecordFiles({
      source: "src/tests/testdata/conversion",
      sourceFormats: [RecordFileFormat.CSA],
      subdirectories: false,
      destination: destination,
      destinationFormat: RecordFileFormat.KI2,
      fileNameConflictAction: FileNameConflictAction.OVERWRITE,
    });
    expect(result).toStrictEqual({
      succeededTotal: 1,
      succeeded: { ".csa": 1 },
      failedTotal: 0,
      failed: {},
      skippedTotal: 0,
      skipped: {},
    });
    expect(listFiles(destination, Infinity).sort()).toStrictEqual([
      path.join(destination, "csa-sjis.ki2"),
    ]);
  });

  it("ki2u-to-kifu/overwrite", () => {
    const destination = path.join(tmpdir, "ki2u-to-kifu/overwrite");
    for (let i = 0; i < 3; i++) {
      const result = convertRecordFiles({
        source: "src/tests/testdata/conversion",
        sourceFormats: [RecordFileFormat.KI2U],
        subdirectories: false,
        destination: destination,
        destinationFormat: RecordFileFormat.KIFU,
        fileNameConflictAction: FileNameConflictAction.OVERWRITE,
      });
      expect(result).toStrictEqual({
        succeededTotal: 1,
        succeeded: { ".ki2u": 1 },
        failedTotal: 0,
        failed: {},
        skippedTotal: 0,
        skipped: {},
      });
    }
    expect(listFiles(destination, Infinity).sort()).toStrictEqual([
      path.join(destination, "ki2u-utf8.kifu"),
    ]);
  });

  it("ki2u-to-kifu/number-suffix", () => {
    const destination = path.join(tmpdir, "ki2u-to-kifu/number-suffix");
    for (let i = 0; i < 3; i++) {
      const result = convertRecordFiles({
        source: "src/tests/testdata/conversion",
        sourceFormats: [RecordFileFormat.KI2U],
        subdirectories: false,
        destination: destination,
        destinationFormat: RecordFileFormat.KIFU,
        fileNameConflictAction: FileNameConflictAction.NUMBER_SUFFIX,
      });
      expect(result).toStrictEqual({
        succeededTotal: 1,
        succeeded: { ".ki2u": 1 },
        failedTotal: 0,
        failed: {},
        skippedTotal: 0,
        skipped: {},
      });
    }
    expect(listFiles(destination, Infinity).sort()).toStrictEqual([
      path.join(destination, "ki2u-utf8-2.kifu"),
      path.join(destination, "ki2u-utf8-3.kifu"),
      path.join(destination, "ki2u-utf8.kifu"),
    ]);
  });

  it("ki2u-to-kifu/skip", () => {
    const destination = path.join(tmpdir, "ki2u-to-kifu/skip");
    const setting = {
      source: "src/tests/testdata/conversion",
      sourceFormats: [RecordFileFormat.KI2U],
      subdirectories: false,
      destination: destination,
      destinationFormat: RecordFileFormat.KIFU,
      fileNameConflictAction: FileNameConflictAction.SKIP,
    };
    const result = convertRecordFiles(setting);
    expect(result).toStrictEqual({
      succeededTotal: 1,
      succeeded: { ".ki2u": 1 },
      failedTotal: 0,
      failed: {},
      skippedTotal: 0,
      skipped: {},
    });
    const result2 = convertRecordFiles(setting);
    expect(result2).toStrictEqual({
      succeededTotal: 0,
      succeeded: {},
      failedTotal: 0,
      failed: {},
      skippedTotal: 1,
      skipped: { ".ki2u": 1 },
    });
    expect(listFiles(destination, Infinity).sort()).toStrictEqual([
      path.join(destination, "ki2u-utf8.kifu"),
    ]);
  });
});
