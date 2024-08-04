import "./css/font.css";
import "./css/color.css";
import "./css/basic.css";
import "./css/control.css";
import "./css/dialog.css";
import { createApp, watch } from "vue";
import App from "@/renderer/App.vue";
import api, { appInfo, isMobileWebApp } from "@/renderer/ipc/api";
import { setup as setupIPC } from "@/renderer/ipc/setup";
import { useStore } from "@/renderer/store";
import { Chart, registerables } from "chart.js";
import { LogLevel } from "@/common/log";
import { useAppSettings } from "./store/settings";
import { setLanguage, t } from "@/common/i18n";
import { default as dayjs } from "dayjs";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _en from "dayjs/locale/en";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _ja from "dayjs/locale/ja";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as _zh_tw from "dayjs/locale/zh-tw";
import relativeTime from "dayjs/plugin/relativeTime";
import { useErrorStore } from "@/renderer/store/error";
import { exportKIF } from "tsshogi";

api.log(LogLevel.INFO, `start renderer process: APP_VERSION=${appInfo.appVersion}`);

// setup libraries
import("dayjs/locale/en");
import("dayjs/locale/ja");
import("dayjs/locale/zh-tw");
dayjs.extend(relativeTime);
Chart.register(...registerables);

setupIPC();

function updateTitle(path: string | undefined, unsaved: boolean) {
  if (!document) {
    return;
  }
  const appName = t.shogiHome;
  const appVersion = appInfo.appVersion;
  if (path || unsaved) {
    const unsavedMaker = unsaved ? `${t.unsaved}: ` : "";
    const name = path ? path : t.newRecord;
    document.title = `${appName} Version ${appVersion} - ${unsavedMaker}${name}`;
  } else {
    document.title = `${appName} Version ${appVersion}`;
  }
}

const store = useStore();
watch([() => store.recordFilePath, () => store.isRecordFileUnsaved], ([path, unsaved]) => {
  updateTitle(path, unsaved);
});

if (isMobileWebApp()) {
  // Web アプリの場合は Local Storage に棋譜を保存する。
  const storageKey = "mobile:record";
  const data = localStorage.getItem(storageKey);
  if (data) {
    store.pasteRecord(data);
    store.changePly(Number.MAX_SAFE_INTEGER);
  }
  const saveRecord = () => {
    const data = exportKIF(store.record);
    if (data) {
      localStorage.setItem(storageKey, data);
    }
  };
  store.addEventListener("resetRecord", saveRecord);
  store.addEventListener("changePosition", saveRecord);
  store.addEventListener("updateCustomData", saveRecord);
  store.addEventListener("updateFollowingMoves", saveRecord);
  store.addEventListener("updateRecordTree", saveRecord);
}

Promise.allSettled([
  useAppSettings()
    .loadAppSettings()
    .catch((e) => {
      useErrorStore().add(new Error("アプリ設定の読み込み中にエラーが発生しました: " + e));
    }),
  api
    .fetchInitialRecordFileRequest()
    .then((request) => {
      if (request) {
        store.openRecord(request.path, {
          ply: request.ply,
        });
      }
    })
    .catch((e) => {
      useErrorStore().add(new Error("起動パラメーターの取得に失敗しました: " + e));
    }),
]).finally(() => {
  const language = useAppSettings().language;
  api.log(LogLevel.INFO, `set language: ${language}`);
  setLanguage(language);
  updateTitle(store.recordFilePath, store.isRecordFileUnsaved);
  api.log(LogLevel.INFO, "mount app");
  createApp(App).mount("#app");
});
