import { ResearchSetting } from "@/common/settings/research";
import { usiEngineSetting } from "./usi";

export const researchSetting: ResearchSetting = {
  usi: usiEngineSetting,
  enableMaxSeconds: false,
  maxSeconds: 5,
};

export const researchSettingMax5Seconds: ResearchSetting = {
  usi: usiEngineSetting,
  enableMaxSeconds: true,
  maxSeconds: 5,
};

export const researchSettingSecondaryEngines: ResearchSetting = {
  usi: usiEngineSetting,
  secondaries: [{ usi: usiEngineSetting }, { usi: usiEngineSetting }],
  enableMaxSeconds: false,
  maxSeconds: 5,
};
