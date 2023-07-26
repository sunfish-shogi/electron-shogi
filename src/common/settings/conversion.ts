import { RecordFileFormat } from "../file";

export enum FileNameConflictAction {
  OVERWRITE = "overwrite",
  NUMBER_SUFFIX = "numberSuffix",
  SKIP = "skip",
}

export type BatchConversionSetting = {
  source: string;
  sourceFormats: RecordFileFormat[];
  subdirectories: boolean;
  destination: string;
  destinationFormat: RecordFileFormat;
  fileNameConflictAction: FileNameConflictAction;
};

export function defaultBatchConversionSetting(): BatchConversionSetting {
  return {
    source: "",
    sourceFormats: [
      RecordFileFormat.KIF,
      RecordFileFormat.KIFU,
      RecordFileFormat.KI2,
      RecordFileFormat.KI2U,
      RecordFileFormat.CSA,
    ],
    subdirectories: true,
    destination: "",
    destinationFormat: RecordFileFormat.KIF,
    fileNameConflictAction: FileNameConflictAction.NUMBER_SUFFIX,
  };
}
