export function readInputAsNumber(input: HTMLInputElement): number {
  const value = Number(input.value);
  const max = Number(input.max);
  const min = Number(input.min);
  return Math.min(Math.max(value, min), max);
}
