import { USIEngineSetting } from "./usi";

export type SecondaryResearchSetting = {
  usi?: USIEngineSetting;
};

export type ResearchSetting = {
  usi?: USIEngineSetting;
  secondaries?: SecondaryResearchSetting[];
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
    secondaries: setting.secondaries?.filter((secondary) => !!secondary.usi),
  };
}

export function validateResearchSetting(
  setting: ResearchSetting
): Error | undefined {
  if (!setting.usi) {
    return new Error("エンジンが選択されていません。");
  }
  for (const secondary of setting.secondaries || []) {
    if (!secondary.usi) {
      return new Error("エンジンが選択されていません。");
    }
  }
}
