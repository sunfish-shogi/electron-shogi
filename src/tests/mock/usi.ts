import { USIEngine } from "@/common/settings/usi";

export const usiEngines: USIEngine = {
  uri: "es://usi/test-engine",
  name: "my usi engine",
  defaultName: "engine",
  author: "author",
  path: "/engines/engines",
  options: {},
  labels: {},
  enableEarlyPonder: false,
};

export const usiEnginesWithPonder: USIEngine = {
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
      value: "true",
    },
  },
  labels: {},
  enableEarlyPonder: false,
};
