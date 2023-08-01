import { decodeText, encodeText } from "./helpers/encode";
import {
  Record,
  exportCSA,
  exportKI2,
  exportKIF,
  importCSA,
  importKI2,
  importKIF,
} from "./shogi";

export enum RecordFileFormat {
  KIF = ".kif",
  KIFU = ".kifu",
  KI2 = ".ki2",
  KI2U = ".ki2u",
  CSA = ".csa",
}

export function detectRecordFileFormatByPath(
  path: string,
): RecordFileFormat | undefined {
  for (const ext of Object.values(RecordFileFormat)) {
    if (path.toLowerCase().endsWith(ext)) {
      return ext;
    }
  }
}

function getRecommendedEncodingByFileFormat(
  format: RecordFileFormat,
): "UTF8" | "SJIS" {
  switch (format) {
    default:
      return "UTF8";
    case RecordFileFormat.KIF:
    case RecordFileFormat.KI2:
      return "SJIS";
  }
}

export function importRecordFromBuffer(
  data: Uint8Array,
  format: RecordFileFormat,
  option?: { autoDetect?: boolean },
): Record | Error {
  const text = decodeText(data, {
    encoding: getRecommendedEncodingByFileFormat(format),
    autoDetect: option?.autoDetect,
  });
  switch (format) {
    case RecordFileFormat.KIF:
    case RecordFileFormat.KIFU:
      return importKIF(text);
    case RecordFileFormat.KI2:
    case RecordFileFormat.KI2U:
      return importKI2(text);
    case RecordFileFormat.CSA:
      return importCSA(text);
  }
}

export type ExportOptions = {
  returnCode?: string;
  detectGarbled?: boolean;
};

export type ExportResult = {
  data: Uint8Array;
  garbled: boolean;
};

export function exportRecordAsBuffer(
  record: Record,
  format: RecordFileFormat,
  opt: ExportOptions,
): ExportResult {
  const encoding = getRecommendedEncodingByFileFormat(format);
  let str: string;
  switch (format) {
    case RecordFileFormat.KIF:
    case RecordFileFormat.KIFU:
      str = exportKIF(record, opt);
      break;
    case RecordFileFormat.KI2:
    case RecordFileFormat.KI2U:
      str = exportKI2(record, opt);
      break;
    case RecordFileFormat.CSA:
      str = exportCSA(record, opt);
      break;
  }
  const data = encodeText(str, encoding);
  let garbled = false;
  if (encoding === "SJIS" && opt.detectGarbled) {
    const restored = decodeText(data, { encoding: "SJIS" });
    if (restored !== str) {
      garbled = true;
    }
  }
  return { data, garbled };
}
