export function appendLine(base: string, newLines: string): string {
  return base + (!base || base.endsWith("\n") ? "" : "\n") + newLines;
}
