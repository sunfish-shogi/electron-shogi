import { USIEngineSetting } from "@/common/settings/usi";

export const usiEngineSetting: USIEngineSetting = {
  uri: "es://usi/test-engine",
  name: "my usi engine",
  defaultName: "engine",
  author: "author",
  path: "/engines/engines",
  options: {},
  labels: {},
  enableEarlyPonder: false,
};

export const usiEngineSettingWithPonder: USIEngineSetting = {
  uri: "es://usi/test-engine",
  name: "my usi engine",
  defaultName: "engine",
  author: "author",
  path: "/engines/engines",
  options: {
    USI_Ponder: {
      name: "USI_Ponder",
      type: "check",
      order: 2,
      vars: [],
      value: "true",
    },
  },
  labels: {},
  enableEarlyPonder: false,
};
