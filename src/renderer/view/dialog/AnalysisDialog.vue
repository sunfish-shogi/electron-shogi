<template>
  <div>
    <dialog ref="dialog" class="root">
      <div class="dialog-title">棋譜解析</div>
      <div class="dialog-form-area">
        <div>エンジン</div>
        <PlayerSelector
          :player-uri="engineURI"
          :engine-settings="engineSettings"
          :display-thread-state="true"
          :display-multi-pv-state="true"
          @update-engine-setting="onUpdatePlayerSetting"
          @select-player="onSelectPlayer"
        />
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
          <div class="dialog-form-item-label-wide">指し手コメント</div>
          <select
            ref="commentBehavior"
            size="1"
            :value="defaultValues.commentBehavior"
          >
            <option :value="CommentBehavior.NONE">出力しない</option>
            <option :value="CommentBehavior.INSERT">前方に加筆する</option>
            <option :value="CommentBehavior.APPEND">末尾に加筆する</option>
            <option :value="CommentBehavior.OVERWRITE">上書きする</option>
          </select>
        </div>
      </div>
      <div class="dialog-main-buttons">
        <button
          data-hotkey="Enter"
          autofocus
          class="dialog-button"
          @click="onStart()"
        >
          解析実行
        </button>
        <button class="dialog-button" data-hotkey="Escape" @click="onCancel()">
          キャンセル
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { readInputAsNumber } from "@/renderer/helpers/form.js";
import api from "@/renderer/ipc/api";
import {
  AnalysisSetting,
  defaultAnalysisSetting,
} from "@/common/settings/analysis";
import { USIEngineSettings } from "@/common/settings/usi";
import { useStore } from "@/renderer/store";
import { CommentBehavior } from "@/common/settings/analysis";
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
  Ref,
} from "vue";
import PlayerSelector from "@/renderer/view/dialog/PlayerSelector.vue";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";

export default defineComponent({
  name: "ResearchDialog",
  components: {
    PlayerSelector,
  },
  setup() {
    const store = useStore();
    const dialog: Ref = ref(null);
    const enableStartNumber: Ref = ref(null);
    const startNumber: Ref = ref(null);
    const enableEndNumber: Ref = ref(null);
    const endNumber: Ref = ref(null);
    const maxSecondsPerMove: Ref = ref(null);
    const commentBehavior: Ref = ref(null);
    const analysisSetting = ref(defaultAnalysisSetting());
    const engineSettings = ref(new USIEngineSettings());
    const engineURI = ref("");

    store.retainBussyState();

    onMounted(async () => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
      try {
        analysisSetting.value = await api.loadAnalysisSetting();
        engineSettings.value = await api.loadUSIEngineSetting();
        engineURI.value = analysisSetting.value.usi?.uri || "";
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

    const updateToggle = () => {
      startNumber.value.disabled = !enableStartNumber.value.checked;
      endNumber.value.disabled = !enableEndNumber.value.checked;
    };

    const onStart = () => {
      if (
        !engineURI.value ||
        !engineSettings.value.hasEngine(engineURI.value)
      ) {
        store.pushError("エンジンを選択してください。");
        return;
      }
      const engine = engineSettings.value.getEngine(engineURI.value);
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
      store.closeModalDialog();
    };

    const onUpdatePlayerSetting = async (settings: USIEngineSettings) => {
      engineSettings.value = settings;
    };

    const onSelectPlayer = (uri: string) => {
      engineURI.value = uri;
    };

    const defaultValues = computed(() => {
      return {
        enableStartNumber: analysisSetting.value.startCriteria.enableNumber,
        startNumber: analysisSetting.value.startCriteria.number,
        enableEndNumber: analysisSetting.value.endCriteria.enableNumber,
        endNumber: analysisSetting.value.endCriteria.number,
        maxSecondsPerMove: analysisSetting.value.perMoveCriteria.maxSeconds,
        commentBehavior: analysisSetting.value.commentBehavior,
      };
    });

    return {
      CommentBehavior,
      dialog,
      engineSettings,
      engineURI,
      enableStartNumber,
      startNumber,
      enableEndNumber,
      endNumber,
      maxSecondsPerMove,
      commentBehavior,
      defaultValues,
      updateToggle,
      onStart,
      onCancel,
      onUpdatePlayerSetting,
      onSelectPlayer,
    };
  },
});
</script>

<style scoped>
.root {
  width: 420px;
}
input.toggle {
  height: 1em;
  width: 1em;
  margin-right: 10px;
}
input.small {
  width: 50px;
}
</style>
