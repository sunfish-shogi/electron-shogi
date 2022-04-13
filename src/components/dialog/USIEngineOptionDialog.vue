<template>
  <div>
    <dialog ref="dialog">
      <div class="dialog-title">エンジン設定</div>
      <div class="dialog-form-area option-list">
        <div class="option">
          <div class="option-name">エンジン名</div>
          <div class="option-unchangeable">{{ engine.defaultName }}</div>
        </div>
        <div class="option">
          <div class="option-name">作者</div>
          <div class="option-unchangeable">{{ engine.author }}</div>
        </div>
        <div class="option">
          <div class="option-name">場所</div>
          <div class="option-unchangeable">{{ engine.path }}</div>
        </div>
        <div class="option">
          <div class="option-name">表示名</div>
          <input
            ref="engineNameInput"
            class="option-value-text"
            type="text"
            name="ElectronShogiEngineName"
          />
        </div>
        <div v-for="option in options" :key="option.name" class="option">
          <div class="option-name">{{ option.name }}</div>
          <input
            v-if="option.type === 'spin'"
            :id="option.inputId"
            class="option-value-number"
            type="number"
            :min="option.min"
            :max="option.max"
            step="1"
            :name="option.name"
          />
          <input
            v-if="option.type === 'string'"
            :id="option.inputId"
            class="option-value-text"
            type="text"
            :name="option.name"
          />
          <input
            v-if="option.type === 'filename'"
            :id="option.inputId"
            class="option-value-filename"
            type="text"
            :name="option.name"
          />
          <button
            v-if="option.type === 'filename'"
            class="dialog-button"
            @click="selectFile(option.inputId)"
          >
            選択
          </button>
          <select
            v-if="option.type === 'check'"
            :id="option.inputId"
            class="option-value-check"
          >
            <option value="">既定値</option>
            <option value="true">ON</option>
            <option value="false">OFF</option>
          </select>
          <select
            v-if="option.type === 'combo'"
            :id="option.inputId"
            class="option-value-combo"
          >
            <option value="">既定値</option>
            <option v-for="v in option.vars" :key="v" :value="v">
              {{ v }}
            </option>
          </select>
          <button
            v-if="option.type === 'button'"
            class="dialog-button"
            @click="sendOption(option.name)"
          >
            実行
          </button>
        </div>
      </div>
      <button class="dialog-wide-button" @click="reset()">
        エンジンの既定値に戻す
      </button>
      <div class="dialog-main-buttons">
        <button class="dialog-button" @click="ok()">OK</button>
        <button class="dialog-button" @click="cancel()">キャンセル</button>
      </div>
    </dialog>
  </div>
</template>

<script lang="ts">
import { getFormItemByID, showModalDialog } from "@/helpers/dialog";
import {
  getUSIEngineInfo,
  sendUSISetOption,
  showSelectFileDialog,
} from "@/ipc/renderer";
import {
  getUSIEngineOptionCurrentValue,
  mergeUSIEngineSetting,
  USIEngineSetting,
} from "@/settings/usi";
import { Mutation, useStore } from "@/store";
import { computed, defineComponent, onMounted, PropType, ref, Ref } from "vue";

export default defineComponent({
  name: "USIEngineOptionDialog",
  props: {
    latestEngineSetting: {
      type: Object as PropType<USIEngineSetting>,
      required: true,
    },
  },
  emits: ["ok", "cancel"],
  setup(props, context) {
    const dialog: Ref = ref(null);
    const engineNameInput: Ref = ref(null);
    const store = useStore();
    const latest = props.latestEngineSetting as USIEngineSetting;
    let engine = ref(latest);

    const options = computed(() => {
      return Object.values(engine.value.options)
        .sort((a, b): number => {
          const aIsUSI = a.name.startsWith("USI_");
          const bIsUSI = b.name.startsWith("USI_");
          if (aIsUSI !== bIsUSI) {
            return aIsUSI ? -1 : 1;
          }
          return a.name < b.name ? -1 : 1;
        })
        .map((option, index) => {
          return {
            ...option,
            inputId: "usiEngineOptionDialogOption" + index,
            value: getUSIEngineOptionCurrentValue(option),
          };
        });
    });

    store.commit(Mutation.RETAIN_BUSSY_STATE);
    onMounted(async () => {
      showModalDialog(dialog.value);
      try {
        engine.value = await getUSIEngineInfo(latest.path);
        mergeUSIEngineSetting(engine.value, latest);
        engineNameInput.value.value = engine.value.name;
        for (const option of options.value) {
          const elem = getFormItemByID(option.inputId);
          if (elem && option.value !== undefined) {
            elem.value = option.value + "";
          }
        }
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
      } finally {
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      }
    });

    const selectFile = async (id: string) => {
      store.commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        const path = await showSelectFileDialog();
        const elem = getFormItemByID(id);
        if (path && elem) {
          elem.value = path;
        }
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
      } finally {
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      }
    };

    const sendOption = async (name: string) => {
      store.commit(Mutation.RETAIN_BUSSY_STATE);
      try {
        await sendUSISetOption(engine.value.path, name);
      } catch (e) {
        store.commit(Mutation.PUSH_ERROR, e);
      } finally {
        store.commit(Mutation.RELEASE_BUSSY_STATE);
      }
    };

    const reset = () => {
      engineNameInput.value.value = engine.value.defaultName;
      for (const option of options.value) {
        const elem = getFormItemByID(option.inputId);
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
        const elem = getFormItemByID(option.inputId);
        if (elem) {
          engine.value.options[option.name].value = !elem.value
            ? undefined
            : option.type === "spin"
            ? Number(elem.value)
            : elem.value;
        }
      }
      context.emit("ok", engine.value);
    };

    const cancel = () => {
      context.emit("cancel");
    };

    return {
      engine,
      dialog,
      engineNameInput,
      options,
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
  border-bottom: 1px solid gray;
}
.option-name {
  width: 240px;
  text-align: left;
  border-right: 1px solid gray;
  margin-right: 10px;
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
