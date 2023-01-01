import { AnalysisSetting } from "@/common/settings/analysis";
import { USIEngineSetting } from "@/common/settings/usi";
import { CommentBehavior } from "@/common/settings/analysis";

const engine: USIEngineSetting = {
  uri: "es://usi/test-engine",
  name: "my usi engine",
  defaultName: "engine",
  author: "author",
  path: "/engines/engines",
  options: {},
};

export const analysisSetting: AnalysisSetting = {
  usi: engine,
  startCriteria: {
    enableNumber: false,
    number: 0,
  },
  endCriteria: {
    enableNumber: false,
    number: 100,
  },
  perMoveCriteria: {
    maxSeconds: 1,
  },
  commentBehavior: CommentBehavior.APPEND,
};
