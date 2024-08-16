import { exists } from "@/background/helpers/file";
import { iconSourceMap } from "@/renderer/assets/icons";

describe("assets/icons", () => {
  describe("checkIconFilePaths", () => {
    Object.values(iconSourceMap).forEach((source) => {
      it(`shouldExists:${source}`, async () => {
        expect(await exists(`public/${source}`)).toBeTruthy();
      });
    });
  });
});
