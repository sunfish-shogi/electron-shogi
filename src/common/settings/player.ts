import { USIEngine, validateUSIEngine } from "./usi";
import * as uri from "@/common/uri";

export type PlayerSettings = {
  name: string;
  uri: string;
  usi?: USIEngine;
};

export function defaultPlayerSettings(): PlayerSettings {
  return {
    name: "人",
    uri: uri.ES_HUMAN,
  };
}

export function validatePlayerSettings(settings: PlayerSettings): Error | undefined {
  if (!settings.name) {
    return new Error("player name is required");
  }
  if (!settings.uri) {
    return new Error("player URI is required");
  }
  if (uri.isUSIEngine(settings.uri)) {
    if (!settings.usi) {
      return new Error("USI is required");
    }
    const usiError = validateUSIEngine(settings.usi);
    if (usiError) {
      return usiError;
    }
  }
}
