export function appendLine(base: string, newLine: string): string {
  return (
    (base ? appendReturnIfNotExists(base) : "") +
    appendReturnIfNotExists(newLine)
  );
}

export function appendReturnIfNotExists(str: string): string {
  return str + (str.endsWith("\n") ? "" : "\n");
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
