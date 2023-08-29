// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _en from "dayjs/locale/en";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _ja from "dayjs/locale/ja";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _zh_tw from "dayjs/locale/zh-tw";

import("dayjs/locale/en");
import("dayjs/locale/ja");
import("dayjs/locale/zh-tw");

export enum Language {
  // ISO 639-1
  JA = "ja",
  EN = "en",
  ZH_TW = "zh_tw",
}
