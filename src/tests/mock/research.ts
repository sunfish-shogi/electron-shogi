import { ResearchSettings } from "@/common/settings/research";
import { usiEngines } from "./usi";

export const researchSettings: ResearchSettings = {
  usi: usiEngines,
  enableMaxSeconds: false,
  maxSeconds: 5,
};

export const researchSettingsMax5Seconds: ResearchSettings = {
  usi: usiEngines,
  enableMaxSeconds: true,
  maxSeconds: 5,
};

export const researchSettingsSecondaryEngines: ResearchSettings = {
  usi: usiEngines,
  secondaries: [{ usi: usiEngines }, { usi: usiEngines }],
  enableMaxSeconds: false,
  maxSeconds: 5,
};
