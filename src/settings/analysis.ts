import { USIEngineSetting } from "./usi";

type StartCriteria = {
  enableNumber: boolean;
  number: number;
};

type EndCriteria = {
  enableNumber: boolean;
  number: number;
};

type PerMoveCriteria = {
  maxSeconds: number;
};

export enum CommentBehavior {
  NONE = "none",
  INSERT = "insert",
  APPEND = "append",
  OVERWRITE = "overwrite",
}

export type AnalysisSetting = {
  usi?: USIEngineSetting;
  startCriteria: StartCriteria;
  endCriteria: EndCriteria;
  perMoveCriteria: PerMoveCriteria;
  commentBehavior: CommentBehavior;
};

export function defaultAnalysisSetting(): AnalysisSetting {
  return {
    startCriteria: {
      enableNumber: false,
      number: 20,
    },
    endCriteria: {
      enableNumber: false,
      number: 100,
    },
    perMoveCriteria: {
      maxSeconds: 5,
    },
    commentBehavior: CommentBehavior.INSERT,
  };
}
