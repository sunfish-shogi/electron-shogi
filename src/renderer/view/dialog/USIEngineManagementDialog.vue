<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">エンジン管理</div>
      <div class="dialog-form-area engine-list">
        <div v-if="setting.engineList.length === 0" class="engine">
          エンジンが登録されていません。
        </div>
        <div
          v-for="engine in setting.engineList"
          :key="engine.uri"
          class="engine"
          :value="engine.uri"
        >
          <div class="engine-name">{{ engine.name }}</div>
          <button @click="openOptions(engine.uri)">設定</button>
          <button @click="duplicate(engine.uri)">複製</button>
          <button @click="remove(engine.uri)">削除</button>
        </div>
      </div>
      <button class="dialog-wide-button" @click="add()">追加</button>
      <div class="dialog-main-buttons">
        <button
          data-hotkey="Enter"
          autofocus
          class="dialog-button"
          @click="saveAndClose()"
        >
          保存して閉じる
        </button>
        <button class="dialog-button" data-hotkey="Escape" @click="cancel()">
          キャンセル
        </button>
      </div>
    </dialog>
  </div>
  <USIEngineOptionDialog
    v-if="optionDialog"
    :latest-engine-setting="optionDialog"
    @ok="optionOk"
    @cancel="optionCancel"
  />
</template>

<script lang="ts">
import api from "@/renderer/ipc/api";
import {
  duplicateEngineSetting,
  USIEngineSetting,
  USIEngineSettings,
} from "@/common/settings/usi";
import { useStore } from "@/renderer/store";
import { ref, onMounted, defineComponent, Ref, onBeforeUnmount } from "vue";
import USIEngineOptionDialog from "@/renderer/view/dialog/USIEngineOptionDialog.vue";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";

export default defineComponent({
  name: "USIEngineManagementDialog",
  components: {
    USIEngineOptionDialog,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const optionDialog: Ref<USIEngineSetting | null> = ref(null);
    const setting = ref(new USIEngineSettings());

    store.retainBussyState();

    onMounted(async () => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
      try {
        setting.value = await api.loadUSIEngineSetting();
      } catch (e) {
        store.pushError(e);
        store.destroyModalDialog();
      } finally {
        store.releaseBussyState();
      }
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
    });

    const add = async () => {
      try {
        store.retainBussyState();
        const path = await api.showSelectUSIEngineDialog();
        if (!path) {
          return;
        }
        const timeoutSeconds = store.appSetting.engineTimeoutSeconds;
        setting.value.addEngine(
          await api.getUSIEngineInfo(path, timeoutSeconds)
        );
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const remove = (uri: string) => {
      setting.value.removeEngine(uri);
    };

    const openOptions = (uri: string) => {
      optionDialog.value = setting.value.getEngine(uri) as USIEngineSetting;
    };

    const duplicate = (uri: string) => {
      const src = setting.value.getEngine(uri) as USIEngineSetting;
      const engine = duplicateEngineSetting(src);
      setting.value.addEngine(engine);
    };

    const saveAndClose = async () => {
      try {
        store.retainBussyState();
        await api.saveUSIEngineSetting(setting.value as USIEngineSettings);
        store.destroyModalDialog();
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const cancel = () => {
      store.closeModalDialog();
    };

    const optionOk = (engine: USIEngineSetting) => {
      setting.value.updateEngine(engine);
      optionDialog.value = null;
    };

    const optionCancel = () => {
      optionDialog.value = null;
    };

    return {
      optionDialog,
      dialog,
      setting,
      add,
      remove,
      openOptions,
      duplicate,
      saveAndClose,
      cancel,
      optionOk,
      optionCancel,
    };
  },
});
</script>

<style scoped>
.engine-list {
  width: 720px;
  height: 400px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.engine {
  margin: 0px 5px 0px 5px;
  padding: 5px;
  border-bottom: 1px solid gray;
  display: flex;
  flex-direction: row;
}
.engine-name {
  text-align: left;
  width: 450px;
  margin-top: 5px;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
