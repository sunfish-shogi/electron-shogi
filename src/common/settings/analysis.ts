import { USIEngineSetting } from "./usi";

type StartCriteria = {
  enableNumber: boolean;
  number: number;
};

function defaultStartCriteria(): StartCriteria {
  return {
    enableNumber: false,
    number: 20,
  };
}

type EndCriteria = {
  enableNumber: boolean;
  number: number;
};

function defaultEndCriteria(): EndCriteria {
  return {
    enableNumber: false,
    number: 100,
  };
}

type PerMoveCriteria = {
  maxSeconds: number;
};

function defaultPerMoveCriteria(): PerMoveCriteria {
  return {
    maxSeconds: 5,
  };
}

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
    startCriteria: defaultStartCriteria(),
    endCriteria: defaultEndCriteria(),
    perMoveCriteria: defaultPerMoveCriteria(),
    commentBehavior: CommentBehavior.INSERT,
  };
}

export function normalizeAnalysisSetting(
  setting: AnalysisSetting
): AnalysisSetting {
  return {
    ...defaultAnalysisSetting(),
    ...setting,
    startCriteria: {
      ...defaultStartCriteria(),
      ...setting.startCriteria,
    },
    endCriteria: {
      ...defaultEndCriteria(),
      ...setting.endCriteria,
    },
    perMoveCriteria: {
      ...defaultPerMoveCriteria(),
      ...setting.perMoveCriteria,
    },
  };
}
