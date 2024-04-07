export const ES_HUMAN = "es://human";
export const ES_USI_ENGINE_PREFIX = "es://usi-engine/";
export const ES_STANDARD_LAYOUT_PROFILE = "es://layout-profile/standard";
export const ES_CUSTOM_LAYOUT_PROFILE_PREFIX = "es://layout-profile/custom/";

export function isUSIEngine(uri: string): boolean {
  return uri.startsWith(ES_USI_ENGINE_PREFIX);
}

export function issueEngineURI(): string {
  const now = Date.now();
  const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  return ES_USI_ENGINE_PREFIX + `${now}/${rand}`;
}

export function issueCustomLayoutProfileURI(): string {
  const now = Date.now();
  const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  return ES_CUSTOM_LAYOUT_PROFILE_PREFIX + `${now}/${rand}`;
}
