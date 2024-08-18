export function urlSafeBase64Encode(text: string): string {
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
