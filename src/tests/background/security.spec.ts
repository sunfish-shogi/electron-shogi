import { validateHTTPRequest, validateIPCSender } from "@/background/security";

/* eslint-disable @typescript-eslint/no-explicit-any */
describe("security", () => {
  it("validateIPCSender/allowed", () => {
    validateIPCSender({ url: "http://localhost:1234/foo/bar.baz" } as any);
    validateIPCSender({
      url: "file:///home/shogi/apps/electron-shogi/assets.asr",
    } as any);
  });

  it("validateIPCSender/notAllowed", () => {
    // unknown hostname
    expect(() =>
      validateIPCSender({ url: "http://foo.bar/baz/qux.quux" } as any)
    ).toThrow();
    // https will not used with localhost
    expect(() =>
      validateIPCSender({ url: "https://localhost:1234/foo/bar.baz" } as any)
    ).toThrow();
  });

  it("validateHTTPRequest/allowed", () => {
    validateHTTPRequest("GET", "http://localhost:1234/foo/bar.baz");
    validateHTTPRequest("GET", "ws://localhost:1234/foo/bar.baz");
    validateHTTPRequest(
      "GET",
      "file:///home/shogi/apps/electron-shogi/assets.asr"
    );
    validateHTTPRequest("GET", "devtools://devtools/bundled/index.html");
  });

  it("validateHTTPRequest/notAllowed", () => {
    // unknown hostname
    expect(() =>
      validateHTTPRequest("GET", "http://foo.bar/baz/qux.quux")
    ).toThrow();
    // https will not used with localhost
    expect(() =>
      validateHTTPRequest("GET", "https://localhost:1234/foo/bar.baz")
    ).toThrow();
    // unexpected devtools URL
    expect(() =>
      validateHTTPRequest("GET", "devtools://foo/bar/baz.qux")
    ).toThrow();
  });
});
