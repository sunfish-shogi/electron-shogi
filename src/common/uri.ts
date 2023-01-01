export const ES_HUMAN = "es://human";
export const ES_USI_ENGINE = "es://usi-engine/";

export function isUSIEngine(uri: string): boolean {
  return uri.startsWith(ES_USI_ENGINE);
}

export function issueEngineURI(): string {
  const now = Date.now();
  const rand = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(16);
  return ES_USI_ENGINE + `${now}/${rand}`;
}
