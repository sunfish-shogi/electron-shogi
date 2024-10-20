import { ResearchSettings } from "@/common/settings/research";
import { testUSIEngine } from "./usi";

export const researchSettings: ResearchSettings = {
  usi: testUSIEngine,
  enableMaxSeconds: false,
  maxSeconds: 5,
};

export const researchSettingsMax5Seconds: ResearchSettings = {
  usi: testUSIEngine,
  enableMaxSeconds: true,
  maxSeconds: 5,
};

export const researchSettingsSecondaryEngines: ResearchSettings = {
  usi: testUSIEngine,
  secondaries: [{ usi: testUSIEngine }, { usi: testUSIEngine }],
  enableMaxSeconds: false,
  maxSeconds: 5,
};
