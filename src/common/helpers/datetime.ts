export function getDateString(date = new Date()): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function getDateTimeString(date = new Date()): string {
  return date.toLocaleTimeString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function getDateTimeStringMs(date = new Date()): string {
  return getDateTimeString(date) + "." + String(date.getTime() % 1000).padStart(3, "0");
}
