<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">{{ t.engineSettings }}</div>
      <div class="dialog-form-area option-list">
        <div class="option">
          <div class="option-name">{{ t.engineName }}</div>
          <div class="option-unchangeable">{{ engine.defaultName }}</div>
        </div>
        <div class="option">
          <div class="option-name">{{ t.author }}</div>
          <div class="option-unchangeable">{{ engine.author }}</div>
        </div>
        <div class="option">
          <div class="option-name">{{ t.enginePath }}</div>
          <div class="option-unchangeable">
            <div>{{ engine.path }}</div>
            <button class="dialog-button" @click="openEngineDir">
              {{ t.openDirectory }}
            </button>
          </div>
        </div>
        <div class="option">
          <div class="option-name">{{ t.displayName }}</div>
          <input
            ref="engineNameInput"
            class="option-value-text"
            type="text"
            name="ElectronShogiEngineName"
          />
        </div>
        <div v-for="option in options" :key="option.name" class="option">
          <div class="option-name">
            {{ option.displayName || option.name }}
            <span v-if="option.displayName" class="option-name-original">
              {{ option.name }}
            </span>
          </div>
          <input
            v-if="option.type === 'spin'"
            :id="inputElementID(option)"
            class="option-value-number"
            type="number"
            :min="option.min"
            :max="option.max"
            step="1"
            :name="option.name"
          />
          <input
            v-if="option.type === 'string'"
            :id="inputElementID(option)"
            class="option-value-text"
            type="text"
            :name="option.name"
          />
          <input
            v-if="option.type === 'filename'"
            :id="inputElementID(option)"
            class="option-value-filename"
            type="text"
            :name="option.name"
          />
          <button
            v-if="option.type === 'filename'"
            class="dialog-button"
            @click="selectFile(inputElementID(option))"
          >
            {{ t.select }}
          </button>
          <select
            v-if="option.type === 'check'"
            :id="inputElementID(option)"
            class="option-value-check"
          >
            <option value="">{{ t.defaultValue }}</option>
            <option value="true">ON</option>
            <option value="false">OFF</option>
          </select>
          <select
            v-if="option.type === 'combo'"
            :id="inputElementID(option)"
            class="option-value-combo"
          >
            <option value="">{{ t.defaultValue }}</option>
            <option v-for="v in option.vars" :key="v" :value="v">
              {{ v }}
            </option>
          </select>
          <button
            v-if="option.type === 'button'"
            class="dialog-button"
            @click="sendOption(option.name)"
          >
            {{ t.invoke }}
          </button>
        </div>
      </div>
      <button class="dialog-wide-button" @click="reset()">
        {{ t.resetToEngineDefaultValues }}
      </button>
      <div class="dialog-main-buttons">
        <button
          data-hotkey="Enter"
          autofocus
          class="dialog-button"
          @click="ok()"
        >
          {{ okButtonText }}
        </button>
        <button class="dialog-button" data-hotkey="Escape" @click="cancel()">
          {{ t.cancel }}
        </button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { t, usiOptionNameMap } from "@/common/i18n";
import { getFormItemByID, showModalDialog } from "@/renderer/helpers/dialog.js";
import { readInputAsNumber } from "@/renderer/helpers/form.js";
import api from "@/renderer/ipc/api";
import {
  installHotKeyForDialog,
  uninstallHotKeyForDialog,
} from "@/renderer/keyboard/hotkey";
import {
  emptyUSIEngineSetting,
  getUSIEngineOptionCurrentValue,
  mergeUSIEngineSetting,
  USIEngineOption,
  USIEngineSetting,
} from "@/common/settings/usi";
import { useStore } from "@/renderer/store";
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  PropType,
  ref,
  Ref,
} from "vue";
import { useAppSetting } from "@/renderer/store/setting";

function inputElementID(option: USIEngineOption) {
  return `USI_ENGINE_OPTION_DIALOG_OPTION_${option.name}`;
}

export default defineComponent({
  name: "USIEngineOptionDialog",
  props: {
    latestEngineSetting: {
      type: Object as PropType<USIEngineSetting>,
      required: true,
    },
    okButtonText: {
      type: String,
      required: false,
      default: "OK",
    },
  },
  emits: ["ok", "cancel"],
  setup(props, context) {
    const store = useStore();
    const appSetting = useAppSetting();
    const dialog: Ref = ref(null);
    const engineNameInput: Ref = ref(null);
    const engine = ref(emptyUSIEngineSetting());

    store.retainBussyState();
    onMounted(async () => {
      showModalDialog(dialog.value);
      installHotKeyForDialog(dialog.value);
      try {
        const timeoutSeconds = appSetting.engineTimeoutSeconds;
        engine.value = await api.getUSIEngineInfo(
          props.latestEngineSetting.path,
          timeoutSeconds
        );
        mergeUSIEngineSetting(engine.value, props.latestEngineSetting);
        engineNameInput.value.value = engine.value.name;
      } catch (e) {
        store.pushError(e);
        context.emit("cancel");
      } finally {
        store.releaseBussyState();
      }
    });

    const options = computed(() =>
      Object.values(engine.value.options)
        .sort((a, b): number => {
          return a.order < b.order ? -1 : 1;
        })
        .map((option) => {
          return {
            ...option,
            value: getUSIEngineOptionCurrentValue(option),
            displayName: appSetting.translateEngineOptionName
              ? usiOptionNameMap[option.name]
              : undefined,
          };
        })
    );

    onUpdated(() => {
      for (const option of options.value) {
        const elem = getFormItemByID(inputElementID(option));
        if (elem && option.value !== undefined) {
          elem.value = option.value + "";
        }
      }
    });

    onBeforeUnmount(() => {
      uninstallHotKeyForDialog(dialog.value);
    });

    const openEngineDir = () => {
      api.openExplorer(engine.value.path);
    };

    const selectFile = async (id: string) => {
      store.retainBussyState();
      try {
        const path = await api.showSelectFileDialog();
        const elem = getFormItemByID(id);
        if (path && elem) {
          elem.value = path;
        }
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const sendOption = async (name: string) => {
      store.retainBussyState();
      try {
        const timeoutSeconds = appSetting.engineTimeoutSeconds;
        await api.sendUSISetOption(engine.value.path, name, timeoutSeconds);
      } catch (e) {
        store.pushError(e);
      } finally {
        store.releaseBussyState();
      }
    };

    const reset = () => {
      engineNameInput.value.value = engine.value.defaultName;
      for (const option of options.value) {
        const elem = getFormItemByID(inputElementID(option));
        if (elem) {
          if (engine.value.options[option.name].default !== undefined) {
            elem.value = engine.value.options[option.name].default + "";
          } else {
            elem.value = "";
          }
        }
      }
    };

    const ok = () => {
      engine.value.name = engineNameInput.value.value;
      for (const option of options.value) {
        const elem = getFormItemByID(inputElementID(option));
        if (elem) {
          engine.value.options[option.name].value = !elem.value
            ? undefined
            : option.type === "spin"
            ? readInputAsNumber(elem as HTMLInputElement)
            : elem.value;
        }
      }
      context.emit("ok", engine.value);
    };

    const cancel = () => {
      context.emit("cancel");
    };

    return {
      t,
      engine,
      dialog,
      engineNameInput,
      options,
      inputElementID,
      openEngineDir,
      selectFile,
      sendOption,
      reset,
      ok,
      cancel,
    };
  },
});
</script>

<style scoped>
.option-list {
  width: 640px;
  height: calc(100vh - 200px);
  overflow: auto;
  display: flex;
  flex-direction: column;
}
.option {
  margin: 5px 5px 0px 5px;
  padding: 5px;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid var(--text-separator-color);
}
.option-name {
  width: 240px;
  text-align: left;
  border-right: 1px solid var(--text-separator-color);
  margin-right: 10px;
}
.option-name .option-name-original {
  font-size: 0.7em;
  width: 100%;
}
.option-unchangeable {
  width: 340px;
  text-align: left;
}
.option-value-text {
  width: 340px;
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
</style>
