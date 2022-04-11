<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">検討</div>
      <div class="dialog-form-area">
        <div class="dialog-form-item">
          <div class="dialog-form-item-label">エンジン</div>
          <div class="dialog-form-item-unit">
            <select
              ref="engineSelect"
              class="engine-select"
              size="1"
              :value="defaultValue"
            >
              <option
                v-for="engine in engines"
                :key="engine.uri"
                :value="engine.uri"
              >
                {{ engine.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="onStart()">検討開始</button>
        <button class="dialog-button" @click="onCancel()">キャンセル</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { loadResearchSetting, loadUSIEngineSetting } from "@/ipc/renderer";
import { defaultResearchSetting, ResearchSetting } from "@/settings/research";
import { USIEngineSettings } from "@/settings/usi";
import { Action, Mutation, useStore } from "@/store";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";

export default defineComponent({
  name: "ResearchDialog",
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const engineSelect: Ref = ref(null);
    const researchSetting = ref(defaultResearchSetting());
    const engineSetting = ref(new USIEngineSettings());

    store.commit(Mutation.RETAIN_BUSSY_STATE);

    onMounted(async () => {
      showModalDialog(dialog.value);
      try {
        researchSetting.value = await loadResearchSetting();
        engineSetting.value = await loadUSIEngineSetting();
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
        store.commit(Mutation.CLOSE_DIALOG);
      }
    });

    const onStart = () => {
      const uri = engineSelect.value.value;
      if (!engineSetting.value.hasEngine(uri)) {
        store.commit(Mutation.PUSH_ERROR, "エンジンを選択してください。");
        return;
      }
      const engine = engineSetting.value.getEngine(uri);
      const researchSetting: ResearchSetting = {
        usi: engine,
      };
      store.dispatch(Action.START_RESEARCH, researchSetting);
    };

    const onCancel = () => {
      store.commit(Mutation.CLOSE_DIALOG);
    };

    const engines = computed(() => engineSetting.value.engineList);

    const defaultValue = computed(() => {
      if (researchSetting.value.usi) {
        return researchSetting.value.usi.uri;
      }
      return "";
    });

    return {
      dialog,
      engineSelect,
      engines,
      defaultValue,
      onStart,
      onCancel,
    };
  },
});
</script>

<style scoped>
.engine-select {
  width: 200px;
}
</style>
