import { USIEngine } from "./usi";

export type MateSearchSettings = {
  usi?: USIEngine;
};

export function defaultMateSearchSettings(): MateSearchSettings {
  return {};
}

export function normalizeMateSearchSettings(settings: MateSearchSettings): MateSearchSettings {
  return {
    ...defaultMateSearchSettings(),
    ...settings,
  };
}
