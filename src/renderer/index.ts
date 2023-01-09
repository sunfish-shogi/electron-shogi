import { createApp } from "vue";
import App from "@/renderer/App.vue";
import api from "@/renderer/ipc/api";
import { setup as setupIPC } from "@/renderer/ipc/setup";
import { useStore } from "@/renderer/store";
import { Chart, registerables } from "chart.js";
import { LogLevel } from "@/common/log";

api.log(LogLevel.INFO, "start renderer process");

Chart.register(...registerables);

setupIPC();

const store = useStore();
Promise.allSettled([
  store.reloadAppSetting().catch((e) => {
    store.pushError(
      new Error("アプリ設定の読み込み中にエラーが発生しました: " + e)
    );
  }),
  api
    .getRecordPathFromProcArg()
    .then((path) => {
      if (path) {
        store.openRecord(path);
      }
    })
    .catch((e) => {
      store.pushError(new Error("起動パラメーターの取得に失敗しました: " + e));
    }),
]).finally(() => {
  api.log(LogLevel.INFO, "mount app");
  createApp(App).mount("#app");
});
