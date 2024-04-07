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
        uri: uri.ES_USI_ENGINE_PREFIX + "test-engine",
        name: "Test Engine",
        defaultName: "test engine",
        author: "test author",
        path: "/path/to/test-engine",
        options: {
          USI_Hash: { name: "USI_Hash", type: "spin", order: 1 },
        },
        labels: {},
        enableEarlyPonder: false,
      },
      secondaries: [],
      enableMaxSeconds: false,
      maxSeconds: 10,
    };
    const result = normalizeResearchSetting(setting);
    expect(result).toStrictEqual(setting);
  });

  it("validate/ok", () => {
    const setting: ResearchSetting = {
      usi: {
        uri: uri.ES_USI_ENGINE_PREFIX + "test-engine",
        name: "Test Engine",
        defaultName: "test engine",
        author: "test author",
        path: "/path/to/test-engine",
        options: {
          USI_Hash: { name: "USI_Hash", type: "spin", order: 1 },
        },
        labels: {},
        enableEarlyPonder: false,
      },
      secondaries: [],
      enableMaxSeconds: false,
      maxSeconds: 10,
    };
    expect(validateResearchSetting(setting)).toBeUndefined();
  });

  it("validate/invalidEngine", () => {
    const setting: ResearchSetting = {
      secondaries: [],
      enableMaxSeconds: false,
      maxSeconds: 10,
    };
    expect(validateResearchSetting(setting)).toBeInstanceOf(Error);
  });

  it("validate/invalidSecondaryEngine", () => {
    const setting: ResearchSetting = {
      usi: {
        uri: uri.ES_USI_ENGINE_PREFIX + "test-engine",
        name: "Test Engine",
        defaultName: "test engine",
        author: "test author",
        path: "/path/to/test-engine",
        options: {
          USI_Hash: { name: "USI_Hash", type: "spin", order: 1 },
        },
        labels: {},
        enableEarlyPonder: false,
      },
      secondaries: [{}],
      enableMaxSeconds: false,
      maxSeconds: 10,
    };
    expect(validateResearchSetting(setting)).toBeInstanceOf(Error);
  });
});
