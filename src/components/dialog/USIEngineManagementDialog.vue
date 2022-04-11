<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">エンジン管理</div>
      <div class="dialog-form-area engine-list">
        <div v-if="engines.length === 0" class="engine">
          エンジンが登録されていません。
        </div>
        <div
          v-for="engine in engines"
          :key="engine.uri"
          class="engine"
          :value="engine.uri"
        >
          <span class="engine-name">{{ engine.name }}</span>
          <button class="dialog-button" @click="openOptions(engine.uri)">
            設定
          </button>
          <button class="dialog-button" @click="remove(engine.uri)">
            削除
          </button>
        </div>
      </div>
      <button class="dialog-wide-button" @click="add()">追加</button>
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="saveAndClose()">
          保存して閉じる
        </button>
        <button class="dialog-button" @click="cancel()">キャンセル</button>
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
import {
  getUSIEngineInfo,
  loadUSIEngineSetting,
  saveUSIEngineSetting,
  showSelectUSIEngineDialog,
} from "@/ipc/renderer";
import { USIEngineSetting, USIEngineSettings } from "@/settings/usi";
import { Mutation, useStore } from "@/store";
import { ref, onMounted, defineComponent, Ref, computed } from "vue";
import USIEngineOptionDialog from "@/components/dialog/USIEngineOptionDialog.vue";
import { showModalDialog } from "@/helpers/dialog";

export default defineComponent({
  name: "USIEngineManagementDialog",
  components: {
    USIEngineOptionDialog,
  },
  setup() {
    const dialog: Ref = ref(null);
    const optionDialog: Ref<USIEngineSetting | null> = ref(null);
    const setting = ref(new USIEngineSettings());
    const store = useStore();

    store.commit(Mutation.RETAIN_BUSSY_STATE);

    onMounted(async () => {
      showModalDialog(dialog.value);
      try {
        setting.value = await loadUSIEngineSetting();
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
        store.commit(Mutation.CLOSE_DIALOG);
      }
    });

    const add = async () => {
      try {
        store.commit(Mutation.RETAIN_BUSSY_STATE);
        const path = await showSelectUSIEngineDialog();
        if (!path) {
          return;
        }
        setting.value.addEngine(await getUSIEngineInfo(path));
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
      } finally {
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      }
    };

    const remove = (uri: string) => {
      setting.value.removeEngine(uri);
    };

    const openOptions = (uri: string) => {
      optionDialog.value = setting.value.getEngine(uri);
    };

    const saveAndClose = async () => {
      try {
        store.commit(Mutation.RETAIN_BUSSY_STATE);
        await saveUSIEngineSetting(setting.value as USIEngineSettings);
        store.commit(Mutation.CLOSE_DIALOG);
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
      } finally {
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      }
    };

    const cancel = () => {
      store.commit(Mutation.CLOSE_DIALOG);
    };

    const optionOk = (engine: USIEngineSetting) => {
      setting.value.updateEngine(engine);
      optionDialog.value = null;
    };

    const optionCancel = () => {
      optionDialog.value = null;
    };

    const engines = computed(() => setting.value.engineList);

    return {
      optionDialog,
      dialog,
      engines,
      add,
      remove,
      openOptions,
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
  width: 600px;
  height: 400px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.engine {
  display: table;
  margin: 5px 5px 0px 5px;
  padding: 5px;
  border-bottom: 1px solid gray;
}
.engine > * {
  display: table-cell;
  vertical-align: middle;
}
.engine-name {
  text-align: left;
  width: 400px;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
