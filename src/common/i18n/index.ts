import { Language } from "./language";
import * as translate from "./translate";
import * as usi from "./usi";

export * from "./language";
export * from "./translate";
export * from "./errors";
export * from "./record";
export * from "./usi";

export function setLanguage(lang: Language) {
  translate.setLanguage(lang);
  usi.setLanguage(lang);
}
