import { USIEngineSetting } from "./usi";

export type ResearchSetting = {
  usi?: USIEngineSetting;
};

export function defaultResearchSetting(): ResearchSetting {
  return {};
}

export function normalizeResearchSetting(
  setting: ResearchSetting
): ResearchSetting {
  return {
    ...defaultResearchSetting(),
    ...setting,
  };
}
