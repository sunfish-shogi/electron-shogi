import { RecordFileFormat } from "../file";
import { t } from "../i18n";

export enum DestinationType {
  DIRECTORY = "directory",
  SINGLE_FILE = "singleFile",
}

export enum FileNameConflictAction {
  OVERWRITE = "overwrite",
  NUMBER_SUFFIX = "numberSuffix",
  SKIP = "skip",
}

export type BatchConversionSetting = {
  source: string;
  sourceFormats: RecordFileFormat[];
  subdirectories: boolean;
  destinationType: DestinationType;
  destination: string;
  destinationFormat: RecordFileFormat;
  fileNameConflictAction: FileNameConflictAction;
  singleFileDestination: string;
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
      RecordFileFormat.JKF,
    ],
    subdirectories: true,
    destinationType: DestinationType.DIRECTORY,
    destination: "",
    destinationFormat: RecordFileFormat.KIF,
    fileNameConflictAction: FileNameConflictAction.NUMBER_SUFFIX,
    singleFileDestination: "",
  };
}

export function normalizeBatchConversionSetting(
  setting: BatchConversionSetting,
): BatchConversionSetting {
  return {
    ...defaultBatchConversionSetting(),
    ...setting,
  };
}

export function validateBatchConversionSetting(setting: BatchConversionSetting): Error | undefined {
  if (!setting.source) {
    return new Error(t.sourceDirectoryNotSpecified);
  }
  if (setting.sourceFormats.length === 0) {
    return new Error(t.sourceFormatsNotSpecified);
  }
  switch (setting.destinationType) {
    case DestinationType.DIRECTORY:
      if (!setting.destination) {
        return new Error(t.destinationDirectoryNotSpecified);
      }
      break;
    case DestinationType.SINGLE_FILE:
      if (!setting.singleFileDestination) {
        return new Error(t.destinationFileNotSpecified);
      }
      break;
    default:
      return new Error("Invalid destination type.");
  }
}
