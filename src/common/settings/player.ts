import { USIEngineSetting, validateUSIEngineSetting } from "./usi";
import * as uri from "@/common/uri";

export type PlayerSetting = {
  name: string;
  uri: string;
  usi?: USIEngineSetting;
};

export function defaultPlayerSetting(): PlayerSetting {
  return {
    name: "人",
    uri: uri.ES_HUMAN,
  };
}

export function validatePlayerSetting(setting: PlayerSetting): Error | undefined {
  if (!setting.name) {
    return new Error("player name is required");
  }
  if (!setting.uri) {
    return new Error("player URI is required");
  }
  if (uri.isUSIEngine(setting.uri)) {
    if (!setting.usi) {
      return new Error("USI is required");
    }
    const usiError = validateUSIEngineSetting(setting.usi);
    if (usiError) {
      return usiError;
    }
  }
}
