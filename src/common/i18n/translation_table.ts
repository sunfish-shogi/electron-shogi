import { Language } from "./languages";
import { en } from "./locales/en";
import { ja } from "./locales/ja";
import { zh_tw } from "./locales/zh_tw";
import { Texts } from "./text_template";

export const t = ja;

function getTranslationTable(language: Language): Texts {
  switch (language) {
    case Language.JA:
      return ja;
    case Language.EN:
      return en;
    case Language.ZH_TW:
      return zh_tw;
    default:
      return ja;
  }
}

export function setLanguage(lang: Language) {
  Object.entries(getTranslationTable(lang)).forEach(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t as any)[key] = value;
  });
}
