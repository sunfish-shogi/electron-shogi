import { USIEngineSetting } from "./usi";

export type MateSearchSetting = {
  usi?: USIEngineSetting;
};

export function defaultMateSearchSetting(): MateSearchSetting {
  return {};
}

export function normalizeMateSearchSetting(
  setting: MateSearchSetting
): MateSearchSetting {
  return {
    ...defaultMateSearchSetting(),
    ...setting,
  };
}
