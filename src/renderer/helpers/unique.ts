let lastDOMNumber = 0;

export function issueDOMID(): string {
  lastDOMNumber++;
  return `es:incremental:${lastDOMNumber}`;
}
