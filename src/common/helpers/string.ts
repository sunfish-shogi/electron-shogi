export function appendLine(base: string, newLines: string): string {
  return base + (!base || base.endsWith("\n") ? "" : "\n") + newLines;
}

export function toString(data: unknown): string {
  return data instanceof Error
    ? data.message
    : data instanceof Object
    ? JSON.stringify(data)
    : String(data);
}

export function formatPercentage(
  numerator: number,
  denominator: number,
  fractionDigits: number
): string {
  return ((numerator / denominator) * 100).toFixed(fractionDigits) + "%";
}
