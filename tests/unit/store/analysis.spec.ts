import { CommentBehavior } from "@/settings/analysis";
import { appendAnalysisComment } from "@/store/analysis";

describe("store/analysis", () => {
  it("appendAnalysisComment", () => {
    expect(appendAnalysisComment("aaa", "bbb", CommentBehavior.NONE)).toBe(
      "aaa"
    );
    expect(appendAnalysisComment("aaa", "bbb", CommentBehavior.INSERT)).toBe(
      "bbb\naaa"
    );
    expect(appendAnalysisComment("aaa", "bbb", CommentBehavior.APPEND)).toBe(
      "aaa\nbbb"
    );
    expect(appendAnalysisComment("aaa", "bbb", CommentBehavior.OVERWRITE)).toBe(
      "bbb"
    );
  });
});
