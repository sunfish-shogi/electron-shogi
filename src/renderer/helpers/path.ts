import {
  RecordMetadataKey,
  getBlackPlayerName,
  getWhitePlayerName,
  ImmutableRecordMetadata,
} from "tsshogi";
import { getDateString } from "@/common/helpers/datetime";

export function dirname(path: string): string {
  return path.substring(0, Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")));
}

function trimEnd(path: string): string {
  return path.endsWith("/") || path.endsWith("\\") ? path.substring(0, path.length - 1) : path;
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
  const datetime =
    metadata.getStandardMetadata(RecordMetadataKey.START_DATETIME) ||
    metadata.getStandardMetadata(RecordMetadataKey.DATE);
  if (datetime) {
    return datetime.trim().replaceAll(" ", "_").replaceAll("/", "").replaceAll(":", "");
  }
  return getDateString().replaceAll("/", "");
}

export const defaultRecordFileNameTemplate = "{datetime}{_title}{_sente}{_gote}";

export function generateRecordFileName(
  metadata: ImmutableRecordMetadata,
  template?: string,
  extension?: string,
): string {
  // get metadata
  const datetime = getDateStringByMeta(metadata);
  const title =
    metadata.getStandardMetadata(RecordMetadataKey.TITLE) ||
    metadata.getStandardMetadata(RecordMetadataKey.TOURNAMENT) ||
    metadata.getStandardMetadata(RecordMetadataKey.OPUS_NAME) ||
    metadata.getStandardMetadata(RecordMetadataKey.OPUS_NO) ||
    metadata.getStandardMetadata(RecordMetadataKey.PLACE) ||
    metadata.getStandardMetadata(RecordMetadataKey.POSTED_ON) ||
    metadata.getStandardMetadata(RecordMetadataKey.AUTHOR);
  const sente = getBlackPlayerName(metadata);
  const gote = getWhitePlayerName(metadata);
  const hex5 = Math.floor(Math.random() * 0x100000)
    .toString(16)
    .toUpperCase()
    .padStart(5, "0");

  // build parameter map
  const params: { [key: string]: string } = {
    datetime,
    title: title || "",
    sente: sente || "",
    gote: gote || "",
    hex5,
  };
  for (const key in params) {
    const value = params[key];
    params["_" + key] = value ? "_" + value : "";
    params[key + "_"] = value ? value + "_" : "";
  }

  // generate file name
  let ret = template || defaultRecordFileNameTemplate;
  ret = escapePath(ret);
  for (const key in params) {
    const value = params[key];
    ret = escapePath(ret.replaceAll("{" + key + "}", value));
  }
  ret = ret.trim();
  if (extension) {
    ret = ret + (extension.startsWith(".") ? extension : "." + extension);
  } else {
    ret = ret + ".kif";
  }
  return ret;
}
