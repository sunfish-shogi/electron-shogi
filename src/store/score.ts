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

export function scoreToPercentage(score: number): number {
  const scale = 600;
  return 100 / (1 + Math.exp(-score / scale));
}

export function getMoveAccuracyText(
  before: number,
  after: number
): string | null {
  const loss = scoreToPercentage(before) - scoreToPercentage(after);
  if (loss >= 50) {
    return "大悪手";
  } else if (loss >= 20) {
    return "悪手";
  } else if (loss >= 10) {
    return "疑問手";
  } else if (loss >= 5) {
    return "緩手";
  }
  return null;
}
