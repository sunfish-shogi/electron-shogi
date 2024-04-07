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

export function inputEventToString(event: Event): string {
  const target = event.target as HTMLInputElement;
  return target.value;
}

export function inputEventToNumber(event: Event): number {
  const target = event.target as HTMLInputElement;
  return readInputAsNumber(target);
}
