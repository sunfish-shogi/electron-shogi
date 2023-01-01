import { RecordMetadataKey } from "@/common/shogi";
import { ImmutableRecordMetadata } from "@/common/shogi/record";
import { getDateString } from "../../common/helpers/datetime";

export function defaultRecordFileName(
  metadata: ImmutableRecordMetadata
): string {
  let ret = getDateStringByMeta(metadata);
  const title =
    metadata.getStandardMetadata(RecordMetadataKey.TITLE) ||
    metadata.getStandardMetadata(RecordMetadataKey.TOURNAMENT) ||
    metadata.getStandardMetadata(RecordMetadataKey.OPUS_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.OPUS_NO) ||
    metadata.getStandardMetadata(RecordMetadataKey.PLACE) ||
    metadata.getStandardMetadata(RecordMetadataKey.POSTED_ON) ||
    metadata.getStandardMetadata(RecordMetadataKey.AUTHOR);
  if (title) {
    ret += "_" + title;
  }
  const black =
    metadata.getStandardMetadata(RecordMetadataKey.BLACK_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.BLACK_SHORT_NAME);
  if (black) {
    ret += "_" + black;
  }
  const white =
    metadata.getStandardMetadata(RecordMetadataKey.WHITE_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.WHITE_SHORT_NAME);
  if (white) {
    ret += "_" + white;
  }
  return ret.trim().replaceAll("/", "_").replaceAll("\\", "_") + ".kif";
}

function getDateStringByMeta(metadata: ImmutableRecordMetadata): string {
  const date =
    metadata.getStandardMetadata(RecordMetadataKey.START_DATETIME) ||
    metadata.getStandardMetadata(RecordMetadataKey.DATE);
  if (date) {
    return date
      .trim()
      .replaceAll(" ", "_")
      .replaceAll("/", "")
      .replaceAll(":", "");
  }
  return getDateString().replaceAll("/", "");
}
