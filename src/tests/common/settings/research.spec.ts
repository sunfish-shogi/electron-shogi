import {
  ResearchSetting,
  normalizeResearchSetting,
  validateResearchSetting,
} from "@/common/settings/research";
import * as uri from "@/common/uri";

describe("settings/research", () => {
  it("normalize", () => {
    const setting: ResearchSetting = {
      usi: {
        uri: uri.ES_USI_ENGINE + "test-engine",
        name: "Test Engine",
        defaultName: "test engine",
        author: "test author",
        path: "/path/to/test-engine",
        options: {
          USI_Hash: { name: "USI_Hash", type: "spin", vars: [] },
        },
      },
      secondaries: [],
    };
    const result = normalizeResearchSetting(setting);
    expect(result).toStrictEqual(setting);
  });

  it("validate/ok", () => {
    const setting: ResearchSetting = {
      usi: {
        uri: uri.ES_USI_ENGINE + "test-engine",
        name: "Test Engine",
        defaultName: "test engine",
        author: "test author",
        path: "/path/to/test-engine",
        options: {
          USI_Hash: { name: "USI_Hash", type: "spin", vars: [] },
        },
      },
      secondaries: [],
    };
    expect(validateResearchSetting(setting)).toBeUndefined();
  });

  it("validate/invalidEngine", () => {
    const setting = {
      secondaries: [],
    };
    expect(validateResearchSetting(setting)).toBeInstanceOf(Error);
  });

  it("validate/invalidSecondaryEngine", () => {
    const setting: ResearchSetting = {
      usi: {
        uri: uri.ES_USI_ENGINE + "test-engine",
        name: "Test Engine",
        defaultName: "test engine",
        author: "test author",
        path: "/path/to/test-engine",
        options: {
          USI_Hash: { name: "USI_Hash", type: "spin", vars: [] },
        },
      },
      secondaries: [{}],
    };
    expect(validateResearchSetting(setting)).toBeInstanceOf(Error);
  });
});
