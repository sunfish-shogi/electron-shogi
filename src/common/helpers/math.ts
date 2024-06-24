export function formatLargeInteger(value: number, accuracy = 8): string {
  if (value < Math.pow(10, accuracy - (accuracy % 3))) {
    return Math.floor(value).toString();
  }
  const suffixes = ["", "K", "M", "G", "T"];
  let si = 0;
  while (si < suffixes.length - 1 && value >= 1e3) {
    si++;
    value /= 1e3;
  }
  const fractionDigits = accuracy - Math.floor(Math.log10(value)) - 1;
  return `${value.toFixed(fractionDigits)}${suffixes[si]}`;
}
