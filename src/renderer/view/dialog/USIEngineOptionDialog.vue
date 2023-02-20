<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">{{ t.engineSettings }}</div>
      <div class="dialog-form-area">
        <div class="option-filter">
          <input
            ref="filter"
            class="filter"
            :placeholder="t.filterByOptionName"
            @input="updateFilter"
          />
        </div>
        <div class="option-list">
          <!-- 名前 -->
          <div class="option">
            <div class="option-name">{{ t.engineName }}</div>
            <div class="option-unchangeable">{{ engine.defaultName }}</div>
          </div>
          <!-- 作者 -->
          <div class="option" :class="{ hidden: filterWords.length }">
            <div class="option-name">{{ t.author }}</div>
            <div class="option-unchangeable">{{ engine.author }}</div>
          </div>
          <!-- 場所 -->
          <div class="option" :class="{ hidden: filterWords.length }">
            <div class="option-name">{{ t.enginePath }}</div>
            <div class="option-unchangeable">
              <div>{{ engine.path }}</div>
              <button class="dialog-thin-button" @click="openEngineDir">
                {{ t.openDirectory }}
              </button>
            </div>
          </div>
          <!-- 表示名 -->
          <div class="option" :class="{ hidden: filterWords.length }">
            <div class="option-name">{{ t.displayName }}</div>
            <input
              ref="engineNameInput"
              class="option-value-text"
              type="text"
              name="ElectronShogiEngineName"
            />
          </div>
          <!-- オプション -->
          <div
            v-for="option in options"
            :key="option.name"
            class="option"
            :class="{ hidden: !option.visible }"
          >
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
              class="dialog-thin-button"
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
              class="dialog-thin-button"
              @click="sendOption(option.name)"
            >
              {{ t.invoke }}
            </button>
          </div>
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
import { filter as filterString } from "@/common/helpers/string";
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

type Option = USIEngineOption & {
  displayName?: string;
  visible: boolean;
};

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
    const filter: Ref = ref(null);
    const filterWords: Ref<string[]> = ref([]);
    const engine = ref(emptyUSIEngineSetting());

    let defaultValueLoaded = false;
    let defaultValueApplied = false;
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
        defaultValueLoaded = true;
      } catch (e) {
        store.pushError(e);
        context.emit("cancel");
      } finally {
        store.releaseBussyState();
      }
    });

    const options = computed(() =>
      Object.values(engine.value.options)
        .sort((a, b): number => (a.order < b.order ? -1 : 1))
        .map((option) => {
          const enableFilter = filterWords.value.length > 0;
          const ret: Option = {
            ...option,
            value: getUSIEngineOptionCurrentValue(option),
            visible: !enableFilter,
          };
          if (appSetting.translateEngineOptionName) {
            ret.displayName = usiOptionNameMap[option.name];
          }
          if (enableFilter) {
            ret.visible =
              (ret.displayName &&
                filterString(ret.displayName, filterWords.value)) ||
              filterString(ret.name, filterWords.value);
          }
          return ret;
        })
    );

    onUpdated(() => {
      if (!defaultValueLoaded || defaultValueApplied) {
        return;
      }
      for (const option of options.value) {
        const elem = getFormItemByID(inputElementID(option));
        if (elem && option.value !== undefined) {
          elem.value = option.value + "";
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
      filter,
      filterWords,
      options,
      inputElementID,
      updateFilter,
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
  height: calc(100vh - 220px);
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
.option.hidden {
  display: none;
}
.option-filter {
  margin: 0px 5px 5px 5px;
}
.filter {
  width: 100%;
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
  height: 1.167em;
  text-align: left;
}
.option-value-filename {
  width: 250px;
  text-align: left;
}
.option-value-number {
  width: 100px;
  height: 1.167em;
  text-align: right;
}
.option-value-combo {
  height: 1.667em;
  text-align: left;
}
.option-value-check {
  height: 1.667em;
  text-align: left;
}
</style>
