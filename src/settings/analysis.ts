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

export function appendAnalysisComment(
  org: string,
  add: string,
  behavior: CommentBehavior
): string {
  const sep = org ? "\n" : "";
  switch (behavior) {
    case CommentBehavior.NONE:
      return org;
    case CommentBehavior.INSERT:
      return add + sep + org;
    case CommentBehavior.APPEND:
      return org + sep + add;
    case CommentBehavior.OVERWRITE:
      return add;
  }
}
