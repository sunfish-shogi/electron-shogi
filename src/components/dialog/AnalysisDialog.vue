<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">棋譜解析</div>
      <div class="dialog-form-area">
        <div>エンジン</div>
        <div class="dialog-form-item">
          <select
            ref="engineSelect"
            class="engine-select"
            size="1"
            :value="defaultValues.engineURI"
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
      <div class="dialog-form-area">
        <div>開始条件</div>
        <div class="dialog-form-item">
          <input
            ref="enableStartNumber"
            class="toggle"
            type="checkbox"
            :checked="defaultValues.enableStartNumber"
            @change="updateToggle"
          />
          <input
            ref="startNumber"
            class="small"
            type="number"
            min="1"
            step="1"
            :disabled="!defaultValues.enableStartNumber"
            :value="defaultValues.startNumber"
          />
          <div class="dialog-form-item-unit">手目から</div>
        </div>
      </div>
      <div class="dialog-form-area">
        <div>終了条件</div>
        <div class="dialog-form-item">
          <input
            ref="enableEndNumber"
            class="toggle"
            type="checkbox"
            :checked="defaultValues.enableEndNumber"
            @change="updateToggle"
          />
          <input
            ref="endNumber"
            class="small"
            type="number"
            min="1"
            step="1"
            :disabled="!defaultValues.enableEndNumber"
            :value="defaultValues.endNumber"
          />
          <div class="dialog-form-item-unit">手目まで</div>
        </div>
      </div>
      <div class="dialog-form-area">
        <div>局面ごとの終了条件</div>
        <div class="dialog-form-item">
          <input
            ref="maxSecondsPerMove"
            class="small"
            type="number"
            min="0"
            step="1"
            :value="defaultValues.maxSecondsPerMove"
          />
          <div class="dialog-form-item-unit">秒まで</div>
        </div>
      </div>
      <div class="dialog-form-area">
        <div>出力設定</div>
        <div class="dialog-form-item">
          <div class="dialog-item-label">指し手コメント:</div>
          <select
            ref="commentBehavior"
            size="1"
            :value="defaultValues.commentBehavior"
          >
            <option value="none">出力しない</option>
            <option value="insert">前方に加筆する</option>
            <option value="append">末尾に加筆する</option>
            <option value="overwrite">上書きする</option>
          </select>
        </div>
      </div>
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="onStart()">解析実行</button>
        <button class="dialog-button" @click="onCancel()">キャンセル</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/helpers/dialog";
import { readInputAsNumber } from "@/helpers/form";
import api from "@/ipc/api";
import { AnalysisSetting, defaultAnalysisSetting } from "@/settings/analysis";
import { USIEngineSettings } from "@/settings/usi";
import { useStore } from "@/store";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";

export default defineComponent({
  name: "ResearchDialog",
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const engineSelect: Ref = ref(null);
    const enableStartNumber: Ref = ref(null);
    const startNumber: Ref = ref(null);
    const enableEndNumber: Ref = ref(null);
    const endNumber: Ref = ref(null);
    const maxSecondsPerMove: Ref = ref(null);
    const commentBehavior: Ref = ref(null);
    const analysisSetting = ref(defaultAnalysisSetting());
    const engineSetting = ref(new USIEngineSettings());

    store.retainBussyState();

    onMounted(async () => {
      showModalDialog(dialog.value);
      try {
        analysisSetting.value = await api.loadAnalysisSetting();
        engineSetting.value = await api.loadUSIEngineSetting();
      } catch (e) {
        store.pushError(e);
        store.closeDialog();
      } finally {
        store.releaseBussyState();
      }
    });

    const updateToggle = () => {
      startNumber.value.disabled = !enableStartNumber.value.checked;
      endNumber.value.disabled = !enableEndNumber.value.checked;
    };

    const onStart = () => {
      const uri = engineSelect.value.value;
      if (!engineSetting.value.hasEngine(uri)) {
        store.pushError("エンジンを選択してください。");
        return;
      }
      const engine = engineSetting.value.getEngine(uri);
      const analysisSetting: AnalysisSetting = {
        usi: engine,
        startCriteria: {
          enableNumber: enableStartNumber.value.checked,
          number: readInputAsNumber(startNumber.value),
        },
        endCriteria: {
          enableNumber: enableEndNumber.value.checked,
          number: readInputAsNumber(endNumber.value),
        },
        perMoveCriteria: {
          maxSeconds: readInputAsNumber(maxSecondsPerMove.value),
        },
        commentBehavior: commentBehavior.value.value,
      };
      store.startAnalysis(analysisSetting);
    };

    const onCancel = () => {
      store.closeDialog();
    };

    const engines = computed(() => engineSetting.value.engineList);

    const defaultValues = computed(() => {
      return {
        engineURI: analysisSetting.value.usi
          ? analysisSetting.value.usi.uri
          : "",
        enableStartNumber: analysisSetting.value.startCriteria.enableNumber,
        startNumber: analysisSetting.value.startCriteria.number,
        enableEndNumber: analysisSetting.value.endCriteria.enableNumber,
        endNumber: analysisSetting.value.endCriteria.number,
        maxSecondsPerMove: analysisSetting.value.perMoveCriteria.maxSeconds,
        commentBehavior: analysisSetting.value.commentBehavior,
      };
    });

    return {
      dialog,
      enableStartNumber,
      engineSelect,
      startNumber,
      enableEndNumber,
      endNumber,
      maxSecondsPerMove,
      commentBehavior,
      engines,
      defaultValues,
      updateToggle,
      onStart,
      onCancel,
    };
  },
});
</script>

<style scoped>
.engine-select {
  width: 400px;
}
input.toggle {
  height: 1rem;
  width: 1rem;
  margin-right: 10px;
}
input.small {
  width: 50px;
}
</style>
