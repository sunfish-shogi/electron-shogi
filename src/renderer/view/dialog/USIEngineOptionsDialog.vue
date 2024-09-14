<template>
  <div>
    <dialog ref="dialog">
      <div class="title">{{ t.manageEngines }}</div>
      <div class="form-group">
        <div class="option-filter">
          <input
            ref="filter"
            class="filter"
            :placeholder="t.filterByOptionName"
            @input="updateFilter"
          />
        </div>
        <div class="column option-list">
          <!-- 名前 -->
          <div class="row option">
            <div class="option-name">{{ t.engineName }}</div>
            <div class="option-unchangeable">{{ engine.defaultName }}</div>
          </div>
          <!-- 作者 -->
          <div v-show="!filterWords.length" class="row option">
            <div class="option-name">{{ t.author }}</div>
            <div class="option-unchangeable">{{ engine.author }}</div>
          </div>
          <!-- 場所 -->
          <div v-show="!filterWords.length" class="row option">
            <div class="option-name">{{ t.enginePath }}</div>
            <div class="option-unchangeable">
              <div>{{ engine.path }}</div>
              <button class="thin" @click="openEngineDir">
                {{ t.openDirectory }}
              </button>
            </div>
          </div>
          <!-- 表示名 -->
          <div v-show="!filterWords.length" class="row option">
            <div class="option-name">{{ t.displayName }}</div>
            <div class="option-value">
              <input ref="engineNameInput" class="option-value-text" type="text" />
            </div>
          </div>
          <!-- オプション -->
          <div
            v-for="option in options"
            v-show="option.visible"
            :key="option.name"
            class="row option"
          >
            <div class="option-name">
              <!-- オプション名 -->
              {{ option.displayName || option.name }}
              <span v-if="option.displayName" class="option-name-original">
                {{ option.name }}
              </span>
            </div>
            <div class="option-value">
              <span class="option-value-control">
                <!-- 数値 (spin) -->
                <input
                  v-if="option.type === 'spin'"
                  :ref="
                    (el) => {
                      inputs[option.name] = el as HTMLInputElement;
                    }
                  "
                  class="option-value-number"
                  type="number"
                  :min="option.min"
                  :max="option.max"
                  step="1"
                  :name="option.name"
                />
                <!-- 文字列 (string) -->
                <input
                  v-if="option.type === 'string'"
                  :ref="
                    (el) => {
                      inputs[option.name] = el as HTMLInputElement;
                    }
                  "
                  class="option-value-text"
                  type="text"
                  :name="option.name"
                />
                <!-- ファイル名 (filename) -->
                <input
                  v-if="option.type === 'filename'"
                  :ref="
                    (el) => {
                      inputs[option.name] = el as HTMLInputElement;
                    }
                  "
                  class="option-value-filename"
                  type="text"
                  :name="option.name"
                />
                <button
                  v-if="option.type === 'filename'"
                  class="thin"
                  @click="selectFile(option.name)"
                >
                  {{ t.select }}
                </button>
                <!-- ブール値 (check) -->
                <HorizontalSelector
                  v-if="option.type === 'check'"
                  :ref="
                    (el: unknown) => {
                      selectors[option.name] = el as InstanceType<typeof HorizontalSelector>;
                    }
                  "
                  value=""
                  :items="
                    option.default
                      ? [
                          { value: 'true', label: 'ON' },
                          { value: 'false', label: 'OFF' },
                        ]
                      : [
                          { value: '', label: t.defaultValue },
                          { value: 'true', label: 'ON' },
                          { value: 'false', label: 'OFF' },
                        ]
                  "
                />
                <!-- 選択 (combo) -->
                <ComboBox
                  v-if="option.type === 'combo'"
                  :ref="
                    (el: unknown) => {
                      selectors[option.name] = el as InstanceType<typeof ComboBox>;
                    }
                  "
                  :options="[
                    { value: '', label: t.defaultValue },
                    ...option.vars.map((v) => ({ value: v, label: v })),
                  ]"
                  :free-text-label="t.freeTextUnsafe"
                />
                <button
                  v-if="option.type === 'button'"
                  class="thin"
                  @click="sendOption(option.name)"
                >
                  {{ t.invoke }}
                </button>
              </span>
              <!-- デフォルト値 -->
              <span
                v-if="option.type !== 'button' && (option.default || option.default === 0)"
                class="option-default-value"
              >
                {{ t.defaultValue }}:
                {{
                  option.type === "check"
                    ? option.default === "true"
                      ? "ON"
                      : "OFF"
                    : option.default
                }}
              </span>
              <!-- 早期 ponder -->
              <div
                v-if="option.name === 'USI_Ponder' && option.type === 'check'"
                class="additional"
              >
                <ToggleButton
                  :label="t.earlyPonder"
                  :value="enableEarlyPonder"
                  @change="
                    (value: boolean) => {
                      enableEarlyPonder = value;
                    }
                  "
                />
                <div v-show="enableEarlyPonder" class="form-group warning">
                  <div class="note">
                    {{ t.earlyPonderFeatureSendsPonderhitCommandWithYaneuraOusNonStandardOptions }}
                    {{ t.ifYourEngineNotSupportTheOptionsItMayCauseUnexpectedBehavior }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button class="wide" @click="reset()">
        {{ t.resetToEngineDefaultValues }}
      </button>
      <div class="main-buttons">
        <button data-hotkey="Enter" autofocus @click="ok()">
          {{ okButtonText }}
        </button>
        <button data-hotkey="Escape" @click="cancel()">
          {{ t.cancel }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { t, usiOptionNameMap } from "@/common/i18n";
import { filter as filterString } from "@/common/helpers/string";
import { showModalDialog } from "@/renderer/helpers/dialog.js";
import { readInputAsNumber } from "@/renderer/helpers/form.js";
import api from "@/renderer/ipc/api";
import { installHotKeyForDialog, uninstallHotKeyForDialog } from "@/renderer/devices/hotkey";
import {
  emptyUSIEngine,
  getUSIEngineOptionCurrentValue,
  mergeUSIEngine,
  USIEngine,
} from "@/common/settings/usi";
import { computed, onBeforeUnmount, onMounted, onUpdated, PropType, ref } from "vue";
import { useAppSettings } from "@/renderer/store/settings";
import HorizontalSelector from "@/renderer/view/primitive/HorizontalSelector.vue";
import ToggleButton from "@/renderer/view/primitive/ToggleButton.vue";
import ComboBox from "@/renderer/view/primitive/ComboBox.vue";
import { useErrorStore } from "@/renderer/store/error";
import { useBusyState } from "@/renderer/store/busy";

const props = defineProps({
  latest: {
    type: Object as PropType<USIEngine>,
    required: true,
  },
  okButtonText: {
    type: String,
    required: false,
    default: "OK",
  },
});
const emit = defineEmits<{
  ok: [engine: USIEngine];
  cancel: [];
}>();

const busyState = useBusyState();
const appSettings = useAppSettings();
const dialog = ref();
const engineNameInput = ref();
const enableEarlyPonder = ref(false);
const filter = ref();
const filterWords = ref([] as string[]);
const inputs = ref({} as { [key: string]: HTMLInputElement | HTMLSelectElement });
const selectors = ref(
  {} as { [key: string]: InstanceType<typeof HorizontalSelector> | InstanceType<typeof ComboBox> },
);
const engine = ref(emptyUSIEngine());
let defaultValueLoaded = false;
let defaultValueApplied = false;
busyState.retain();
onMounted(async () => {
  showModalDialog(dialog.value, cancel);
  installHotKeyForDialog(dialog.value);
  try {
    const timeoutSeconds = appSettings.engineTimeoutSeconds;
    engine.value = await api.getUSIEngineInfo(props.latest.path, timeoutSeconds);
    mergeUSIEngine(engine.value, props.latest);
    engineNameInput.value.value = engine.value.name;
    enableEarlyPonder.value = engine.value.enableEarlyPonder;
    defaultValueLoaded = true;
  } catch (e) {
    useErrorStore().add(e);
    emit("cancel");
  } finally {
    busyState.release();
  }
});
const options = computed(() =>
  Object.values(engine.value.options)
    .sort((a, b): number => (a.order < b.order ? -1 : 1))
    .map((option) => {
      const ret = {
        displayName: "",
        ...option,
        value: getUSIEngineOptionCurrentValue(option),
        visible: true,
      };
      if (appSettings.translateEngineOptionName) {
        ret.displayName = usiOptionNameMap[option.name];
      }
      if (filterWords.value.length > 0) {
        ret.visible =
          (ret.displayName && filterString(ret.displayName, filterWords.value)) ||
          filterString(ret.name, filterWords.value);
      }
      return ret;
    }),
);
onUpdated(() => {
  if (!defaultValueLoaded || defaultValueApplied) {
    return;
  }
  for (const option of options.value) {
    if (option.value === undefined) {
      continue;
    }
    if (option.type === "check" || option.type === "combo") {
      selectors.value[option.name].setValue((option.value as string) || "");
    } else if (inputs.value[option.name]) {
      inputs.value[option.name].value = option.value + "";
    }
  }
  defaultValueApplied = true;
});
onBeforeUnmount(() => {
  uninstallHotKeyForDialog(dialog.value);
});
const updateFilter = () => {
  filterWords.value = String(filter.value.value)
    .trim()
    .split(/ +/)
    .filter((s) => s);
};
const openEngineDir = () => {
  api.openExplorer(engine.value.path);
};
const selectFile = async (name: string) => {
  busyState.retain();
  try {
    const path = await api.showSelectFileDialog();
    const elem = inputs.value[name];
    if (path && elem) {
      elem.value = path;
    }
  } catch (e) {
    useErrorStore().add(e);
  } finally {
    busyState.release();
  }
};
const sendOption = async (name: string) => {
  busyState.retain();
  try {
    const timeoutSeconds = appSettings.engineTimeoutSeconds;
    await api.sendUSISetOption(engine.value.path, name, timeoutSeconds);
  } catch (e) {
    useErrorStore().add(e);
  } finally {
    busyState.release();
  }
};
const reset = () => {
  engineNameInput.value.value = engine.value.defaultName;
  enableEarlyPonder.value = engine.value.enableEarlyPonder;
  Object.values(engine.value.options).forEach((option) => {
    const value =
      option.type !== "button" && option.default !== undefined ? option.default + "" : "";
    if (option.type === "check" || option.type === "combo") {
      selectors.value[option.name].setValue(value);
    } else if (inputs.value[option.name]) {
      inputs.value[option.name].value = value;
    }
  });
};
const ok = () => {
  engine.value.name = engineNameInput.value.value;
  engine.value.enableEarlyPonder = enableEarlyPonder.value;
  Object.values(engine.value.options).forEach((option) => {
    if (option.type === "button") {
      return;
    }
    if (option.type === "check") {
      option.value = (selectors.value[option.name].getValue() as "true" | "false") || undefined;
    } else if (option.type === "combo") {
      option.value = selectors.value[option.name].getValue() || undefined;
    } else if (inputs.value[option.name]) {
      const elem = inputs.value[option.name];
      option.value = !elem.value
        ? undefined
        : option.type === "spin"
          ? readInputAsNumber(elem as HTMLInputElement)
          : elem.value;
    }
  });
  emit("ok", engine.value);
};
const cancel = () => {
  emit("cancel");
};
</script>

<style scoped>
.option-list {
  width: 740px;
  height: calc(100vh - 250px);
  max-height: 800px;
  overflow: auto;
}
.option {
  margin: 5px 5px 0px 5px;
  padding: 5px;
  border-bottom: 1px solid var(--text-separator-color);
}
.option-filter {
  margin: 0px 5px 5px 5px;
}
.filter {
  width: 100%;
}
.option-name {
  width: 290px;
  text-align: left;
  border-right: 1px solid var(--text-separator-color);
  margin-right: 10px;
}
.option-name .option-name-original {
  font-size: 0.7em;
}
.option-unchangeable {
  width: 415px;
  text-align: left;
  white-space: pre-wrap;
  word-break: break-all;
}
.option-value {
  width: 415px;
  text-align: left;
}
.option-value-control {
  margin-right: 10px;
}
.option-value-text {
  width: 380px;
  text-align: left;
}
.option-value-filename {
  width: 250px;
  text-align: left;
}
.option-value-number {
  width: 100px;
  text-align: right;
}
.option button {
  vertical-align: top;
}
.option-default-value {
  font-size: 0.7em;
  white-space: nowrap;
  font-weight: 600;
  opacity: 0.7;
}
.option .additional {
  margin-top: 5px;
}
</style>
