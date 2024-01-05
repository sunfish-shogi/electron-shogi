import "@/renderer/css/font.css";
import "@/renderer/css/color.css";
import "@/renderer/css/basic.css";
import "@/renderer/css/control.css";
import { setupPrompt as setupIPC } from "@/renderer/ipc/setup";
import api from "@/renderer/ipc/api";
import { LogLevel } from "@/common/log";
import { useAppSetting } from "@/renderer/store/setting";
import { setLanguage } from "@/common/i18n";
import { createApp } from "vue";
import PromptMain from "@/renderer/view/prompt/PromptMain.vue";
import { useStore } from "./store";

api.log(LogLevel.INFO, `start renderer process (prompt)`);

setupIPC();

const store = useStore();

document.title = `ElectronShogi Prompt - ${store.target} [${store.sessionID}] ${store.name}`;

Promise.allSettled([
  store.setup(),
  useAppSetting()
    .loadAppSetting()
    .catch((e) => {
      store.onError(new Error("アプリ設定の読み込み中にエラーが発生しました: " + e));
    }),
]).finally(() => {
  const language = useAppSetting().language;
  setLanguage(language);
  api.log(LogLevel.INFO, "mount app (prompt)");
  createApp(PromptMain).mount("#app");
});
