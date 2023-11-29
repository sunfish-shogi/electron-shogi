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
  fractionDigits: number,
): string {
  if (denominator === 0) {
    return "0%";
  }
  return ((numerator / denominator) * 100).toFixed(fractionDigits) + "%";
}

export function ordinal(n: number): string {
  switch (n % 100) {
    case 11:
    case 12:
    case 13:
      return n + "th";
  }
  switch (n % 10) {
    case 1:
      return n + "st";
    case 2:
      return n + "nd";
    case 3:
      return n + "rd";
    default:
      return n + "th";
  }
}

export function filter(target: string, filters: string[]): boolean {
  const lowerCase = target.toLowerCase();
  return filters.every((filter) => lowerCase.includes(filter.toLowerCase()));
}
