import { USIEngineSetting } from "./usi";
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
