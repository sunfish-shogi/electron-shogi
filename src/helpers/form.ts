export function readInputAsNumber(input: HTMLInputElement): number {
  let value = Number(input.value);
  if (input.max) {
    value = Math.min(value, Number(input.max));
  }
  if (input.min) {
    value = Math.max(value, Number(input.min));
  }
  return value;
}
