import { RecordMetadataKey } from "@/common/shogi";
import { ImmutableRecordMetadata } from "@/common/shogi/record";
import { getDateString } from "@/common/helpers/datetime";
import {
  getBlackPlayerName,
  getWhitePlayerName,
} from "@/common/helpers/metadata";

export function dirname(path: string): string {
  return path.substring(
    0,
    Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"))
  );
}

function trimEnd(path: string): string {
  return path.endsWith("/") || path.endsWith("\\")
    ? path.substring(0, path.length - 1)
    : path;
}

function detectSeperator(path: string): string {
  return path.indexOf("/") >= 0 ? "/" : "\\";
}

export function join(path: string, ...paths: string[]): string {
  const sep = detectSeperator(path);
  let result = trimEnd(path);
  for (const path of paths) {
    result += path.startsWith("/") || path.startsWith("\\") ? path : sep + path;
    result = trimEnd(result);
  }
  return result;
}

function escapePath(path: string): string {
  return path.replaceAll(/[<>:"/\\|?*]/g, "_");
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

export function defaultRecordFileName(
  metadata: ImmutableRecordMetadata,
  extension?: string
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
  const black = getBlackPlayerName(metadata);
  if (black) {
    ret += "_" + black;
  }
  const white = getWhitePlayerName(metadata);
  if (white) {
    ret += "_" + white;
  }
  return (
    escapePath(ret.trim()) +
    (extension
      ? extension.startsWith(".")
        ? extension
        : "." + extension
      : ".kif")
  );
}
