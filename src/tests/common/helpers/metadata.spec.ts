import {
  getBlackPlayerName,
  getBlackPlayerNamePreferShort,
  getWhitePlayerName,
  getWhitePlayerNamePreferShort,
} from "@/common/helpers/metadata";
import { Record, RecordMetadataKey } from "@/common/shogi";

describe("helpers/metadata", () => {
  it("getBlackPlayerName", () => {
    const record = new Record();
    record.metadata.setStandardMetadata(RecordMetadataKey.SHITATE_NAME, "羽生結弦");
    expect(getBlackPlayerName(record.metadata)).toBe("羽生結弦");
    expect(getBlackPlayerNamePreferShort(record.metadata)).toBe("羽生結弦");
    record.metadata.setStandardMetadata(RecordMetadataKey.BLACK_SHORT_NAME, "羽生");
    expect(getBlackPlayerName(record.metadata)).toBe("羽生");
    expect(getBlackPlayerNamePreferShort(record.metadata)).toBe("羽生");
    record.metadata.setStandardMetadata(RecordMetadataKey.BLACK_NAME, "羽生善治");
    expect(getBlackPlayerName(record.metadata)).toBe("羽生善治");
    expect(getBlackPlayerNamePreferShort(record.metadata)).toBe("羽生");
  });

  it("getWhitePlayerName", async () => {
    const record = new Record();
    record.metadata.setStandardMetadata(RecordMetadataKey.UWATE_NAME, "羽生結弦");
    expect(getWhitePlayerName(record.metadata)).toBe("羽生結弦");
    expect(getWhitePlayerNamePreferShort(record.metadata)).toBe("羽生結弦");
    record.metadata.setStandardMetadata(RecordMetadataKey.WHITE_SHORT_NAME, "羽生");
    expect(getWhitePlayerName(record.metadata)).toBe("羽生");
    expect(getWhitePlayerNamePreferShort(record.metadata)).toBe("羽生");
    record.metadata.setStandardMetadata(RecordMetadataKey.WHITE_NAME, "羽生善治");
    expect(getWhitePlayerName(record.metadata)).toBe("羽生善治");
    expect(getWhitePlayerNamePreferShort(record.metadata)).toBe("羽生");
  });
});
