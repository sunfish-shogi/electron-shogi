import "@/renderer/css/font.css";
import "@/renderer/css/color.css";
import "@/renderer/css/basic.css";
import "@/renderer/css/control.css";
import "@/renderer/css/dialog.css";
import { LogLevel } from "@/common/log";
import api from "@/renderer/ipc/api";
import { useAppSettings } from "@/renderer/store/settings";
import { useStore } from "./store";
import { setLanguage } from "@/common/i18n";
import LayoutManager from "@/renderer/view/layout/LayoutManager.vue";
import { createApp } from "vue";

api.log(LogLevel.INFO, `start renderer process (layout manager)`);

const store = useStore();
const appSettings = useAppSettings();

Promise.allSettled([
  store.setup(),
  appSettings.loadAppSettings().catch((e) => {
    api.log(LogLevel.ERROR, "アプリ設定の読み込み中にエラーが発生しました: " + e);
  }),
]).finally(() => {
  const language = useAppSettings().language;
  setLanguage(language);
  api.log(LogLevel.INFO, "mount app (layout manager)");
  createApp(LayoutManager).mount("#app");
});
