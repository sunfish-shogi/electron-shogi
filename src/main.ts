import { createApp } from "vue";
import App from "./App.vue";
import {
  getRecordPathFromProcArg,
  loadAppSetting,
  setup as setupIPC,
} from "./ipc/renderer";
import { useStore } from "./store";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

setupIPC();

const store = useStore();
Promise.allSettled([
  loadAppSetting()
    .then((setting) => {
      store.updateAppSetting(setting);
    })
    .catch((e) => {
      store.pushError(
        new Error("アプリ設定の読み込み中にエラーが発生しました :" + e)
      );
    }),
  (async function (): Promise<void> {
    const path = await getRecordPathFromProcArg();
    if (path) {
      store.openRecord(path);
    }
  })(),
]).finally(() => {
  createApp(App).mount("#app");
});
