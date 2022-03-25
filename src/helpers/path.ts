import { Record, RecordMetadataKey } from "@/shogi";

export function defaultRecordFileName(record: Record): string {
  const date = record.metadata.getStandardMetadata(RecordMetadataKey.DATE);
  if (date) {
    return (
      date.trim().replaceAll(" ", "_").replaceAll("/", "").replaceAll(":", "") +
      ".kif"
    );
  }
  return (
    new Date()
      .toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replaceAll("/", "") + ".kif"
  );
}
