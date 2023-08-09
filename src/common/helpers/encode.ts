import { Encoding, convert, detect } from "encoding-japanese";

export function encodeText(data: string, encoding: Encoding): Uint8Array {
  if (encoding === "ASCII" || encoding === "UTF8") {
    return new TextEncoder().encode(data);
  }
  return new Uint8Array(
    convert(data, {
      type: "arraybuffer",
      from: "UNICODE",
      to: encoding,
    }),
  );
}

type DecodeOption = {
  encoding?: Encoding;
  autoDetect?: boolean;
};

export function decodeText(data: Uint8Array, option?: DecodeOption): string {
  const encoding = option?.autoDetect
    ? detectTextEncoding(data, option.encoding)
    : option?.encoding;
  if (encoding === "ASCII" || encoding === "UTF8") {
    return new TextDecoder().decode(data);
  }
  return convert(data, {
    type: "string",
    from: encoding,
    to: "UNICODE",
  });
}

export function detectTextEncoding(data: Uint8Array, defaultEncoding?: Encoding): Encoding {
  const detected = detect(data);
  if (detected) {
    return detected;
  }
  return defaultEncoding || "UTF8";
}
