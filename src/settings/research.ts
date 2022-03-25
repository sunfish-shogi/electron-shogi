import { USIEngineSetting } from "./usi";

export type ResearchSetting = {
  usi?: USIEngineSetting;
};

export function defaultResearchSetting(): ResearchSetting {
  return {};
}
