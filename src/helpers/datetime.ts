export function getDateString(date?: Date): string {
  return (date || new Date()).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getDateTimeString(date?: Date): string {
  return (date || new Date()).toLocaleTimeString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
