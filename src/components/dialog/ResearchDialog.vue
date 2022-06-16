<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">検討</div>
      <div class="dialog-form-area">
        <div class="dialog-form-item">
          <div class="dialog-form-item-label">エンジン</div>
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
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="onStart()">検討開始</button>
        <button class="dialog-button" @click="onCancel()">キャンセル</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import api from "@/ipc/api";
import { defaultResearchSetting, ResearchSetting } from "@/settings/research";
import { USIEngineSettings } from "@/settings/usi";
import { useStore } from "@/store";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";

export default defineComponent({
  name: "ResearchDialog",
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const engineSelect: Ref = ref(null);
    const researchSetting = ref(defaultResearchSetting());
    const engineSetting = ref(new USIEngineSettings());

    store.retainBussyState();

    onMounted(async () => {
      showModalDialog(dialog.value);
      try {
        researchSetting.value = await api.loadResearchSetting();
        engineSetting.value = await api.loadUSIEngineSetting();
      } catch (e) {
        store.pushError(e);
        store.closeDialog();
      } finally {
        store.releaseBussyState();
      }
    });

    const onStart = () => {
      const uri = engineSelect.value.value;
      if (!engineSetting.value.hasEngine(uri)) {
        store.pushError("エンジンを選択してください。");
        return;
      }
      const engine = engineSetting.value.getEngine(uri);
      const researchSetting: ResearchSetting = {
        usi: engine,
      };
      store.startResearch(researchSetting);
    };

    const onCancel = () => {
      store.closeDialog();
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
  width: 250px;
}
</style>
