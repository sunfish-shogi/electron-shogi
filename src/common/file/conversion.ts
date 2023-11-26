import { RecordFileFormat } from "./record";

export type BatchConversionResult = {
  succeeded: { [format in RecordFileFormat]?: number };
  succeededTotal: number;
  failed: { [format in RecordFileFormat]?: number };
  failedTotal: number;
  skipped: { [format in RecordFileFormat]?: number };
  skippedTotal: number;
};
