import { ImmutableRecordMetadata, RecordMetadataKey } from "@/common/shogi";

export function getBlackPlayerName(
  metadata: ImmutableRecordMetadata
): string | undefined {
  return (
    metadata.getStandardMetadata(RecordMetadataKey.BLACK_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.BLACK_SHORT_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.SHITATE_NAME)
  );
}

export function getWhitePlayerName(
  metadata: ImmutableRecordMetadata
): string | undefined {
  return (
    metadata.getStandardMetadata(RecordMetadataKey.WHITE_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.WHITE_SHORT_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.UWATE_NAME)
  );
}
