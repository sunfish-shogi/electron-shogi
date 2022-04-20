import { Record, RecordMetadataKey } from "@/shogi";

export function defaultRecordFileName(record: Record): string {
  let ret = getDateString(record);
  const title =
    record.metadata.getStandardMetadata(RecordMetadataKey.TITLE) ||
    record.metadata.getStandardMetadata(RecordMetadataKey.TOURNAMENT) ||
    record.metadata.getStandardMetadata(RecordMetadataKey.OPUS_NAME) ||
    record.metadata.getStandardMetadata(RecordMetadataKey.OPUS_NO) ||
    record.metadata.getStandardMetadata(RecordMetadataKey.PLACE) ||
    record.metadata.getStandardMetadata(RecordMetadataKey.POSTED_ON) ||
    record.metadata.getStandardMetadata(RecordMetadataKey.AUTHOR);
  if (title) {
    ret += "_" + title;
  }
  const black =
    record.metadata.getStandardMetadata(RecordMetadataKey.BLACK_NAME) ||
    record.metadata.getStandardMetadata(RecordMetadataKey.BLACK_SHORT_NAME);
  if (black) {
    ret += "_" + black;
  }
  const white =
    record.metadata.getStandardMetadata(RecordMetadataKey.WHITE_NAME) ||
    record.metadata.getStandardMetadata(RecordMetadataKey.WHITE_SHORT_NAME);
  if (white) {
    ret += "_" + white;
  }
  return ret + ".kif";
}

function getDateString(record: Record): string {
  const date = record.metadata.getStandardMetadata(RecordMetadataKey.DATE);
  if (date) {
    return date
      .trim()
      .replaceAll(" ", "_")
      .replaceAll("/", "")
      .replaceAll(":", "");
  }
  return new Date()
    .toLocaleDateString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replaceAll("/", "");
}
