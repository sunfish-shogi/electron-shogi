import { AppSetting } from "@/settings/app";

export function getSituationText(score: number): string {
  if (score >= 1500) {
    return "先手勝勢";
  } else if (score >= 600) {
    return "先手優勢";
  } else if (score >= 400) {
    return "先手有利";
  } else if (score >= 200) {
    return "先手有望";
  } else if (score >= -200) {
    return "互角";
  } else if (score >= -400) {
    return "後手有望";
  } else if (score >= -600) {
    return "後手有利";
  } else if (score >= -1500) {
    return "後手優勢";
  } else {
    return "後手勝勢";
  }
}

export function scoreToPercentage(
  score: number,
  appSetting: AppSetting
): number {
  return 100 / (1 + Math.exp(-score / appSetting.coefficientInSigmoid));
}

export function getMoveAccuracyText(
  before: number,
  after: number,
  appSetting: AppSetting
): string | null {
  const loss =
    scoreToPercentage(before, appSetting) -
    scoreToPercentage(after, appSetting);
  if (loss >= appSetting.badMoveLevelThreshold4) {
    return "大悪手";
  } else if (loss >= appSetting.badMoveLevelThreshold3) {
    return "悪手";
  } else if (loss >= appSetting.badMoveLevelThreshold2) {
    return "疑問手";
  } else if (loss >= appSetting.badMoveLevelThreshold1) {
    return "緩手";
  }
  return null;
}
