import { t } from "../i18n";
import { ImmutableRecordMetadata, RecordMetadataKey } from "../shogi";

export function getBlackPlayerName(metadata: ImmutableRecordMetadata): string {
  return (
    metadata.getStandardMetadata(RecordMetadataKey.BLACK_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.BLACK_SHORT_NAME) ||
    t.sente
  );
}

export function getWhitePlayerName(metadata: ImmutableRecordMetadata): string {
  return (
    metadata.getStandardMetadata(RecordMetadataKey.WHITE_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.WHITE_SHORT_NAME) ||
    t.gote
  );
}
