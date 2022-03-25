import { createApp } from "vue";
import App from "./App.vue";
import {
  getRecordPathFromProcArg,
  loadAppSetting,
  setup as setupIPC,
} from "./ipc/renderer";
import { store, key, Mutation, Action } from "./store";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

setupIPC(store);

Promise.allSettled([
  loadAppSetting()
    .then((setting) => {
      store.commit(Mutation.UPDATE_APP_SETTING, setting);
    })
    .catch((e) => {
      store.commit(
        Mutation.PUSH_ERROR,
        new Error("アプリ設定の読み込み中にエラーが発生しました :" + e)
      );
    }),
  (async function (): Promise<void> {
    const path = await getRecordPathFromProcArg();
    if (path) {
      await store.dispatch(Action.OPEN_RECORD, path);
    }
  })(),
]).finally(() => {
  createApp(App).use(store, key).mount("#app");
});
