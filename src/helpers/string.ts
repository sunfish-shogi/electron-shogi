export function appendLine(base: string, newLines: string): string {
  return base + (!base || base.endsWith("\n") ? "" : "\n") + newLines;
}

export function toString(data: unknown): string {
  return data instanceof Object ? JSON.stringify(data) : String(data);
}
