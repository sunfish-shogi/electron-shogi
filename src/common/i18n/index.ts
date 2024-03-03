import { Language } from "./languages";
import * as translate from "./translation_table";
import * as usi from "./usi";

export * from "./languages";
export { t } from "./translation_table";
export * from "./errors";
export * from "./record";
export { usiOptionNameMap } from "./usi";

export function setLanguage(lang: Language) {
  translate.setLanguage(lang);
  usi.setLanguage(lang);
}
