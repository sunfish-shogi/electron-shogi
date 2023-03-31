<template>
  <div>
    <div class="full column">
      <textarea
        ref="textarea"
        class="text"
        :value="comment"
        :readonly="readonly"
        @input="change"
      />
      <div v-if="pvs.length !== 0" class="row play-buttons">
        <button
          v-for="(pv, index) of pvs"
          :key="index"
          class="play"
          @click="play(pv)"
        >
          <Icon :icon="IconType.PLAY" />
          <span>{{ t.pv }}{{ pvs.length >= 2 ? " " + (index + 1) : "" }}</span>
        </button>
      </div>
    </div>
    <PVPreviewDialog
      v-if="preview"
      :position="preview.position"
      :pv="preview.pv"
      @close="closePreview"
    />
  </div>
</template>

<script lang="ts">
import { t } from "@/common/i18n";
import { useStore } from "@/renderer/store";
import { AppState } from "@/common/control/state.js";
import { computed, defineComponent, onMounted, ref, Ref } from "vue";
import Icon from "@/renderer/view/primitive/Icon.vue";
import PVPreviewDialog from "@/renderer/view/dialog/PVPreviewDialog.vue";
import { IconType } from "@/renderer/assets/icons";
import { Move } from "@/common/shogi";

type Preview = {
  position: string;
  pv: string[];
};

export default defineComponent({
  name: "RecordComment",
  components: {
    Icon,
    PVPreviewDialog,
  },
  setup() {
    const store = useStore();
    const readonly = computed(
      () =>
        store.appState != AppState.NORMAL && store.appState != AppState.RESEARCH
    );
    const textarea: Ref = ref(null);
    const comment = computed(() => store.record.current.comment);
    const pvs = computed(() => store.inCommentPVs);
    const preview = ref<Preview | null>(null);

    const change = (event: Event) => {
      const comment = (event.target as HTMLTextAreaElement).value;
      store.updateRecordComment(comment);
    };

    const play = (pv: Move[]) => {
      preview.value = {
        position: store.record.position.sfen,
        pv: pv.map((move) => move.usi),
      };
    };

    const closePreview = () => {
      preview.value = null;
    };

    onMounted(() => {
      textarea.value.addEventListener("copy", (event: ClipboardEvent) => {
        event.stopPropagation();
      });
      textarea.value.addEventListener("paste", (event: ClipboardEvent) => {
        event.stopPropagation();
      });
    });

    return {
      t,
      IconType,
      comment,
      pvs,
      textarea,
      readonly,
      preview,
      change,
      play,
      closePreview,
    };
  },
});
</script>

<style scoped>
.text {
  width: 100%;
  flex-grow: 1;
  resize: none;
  box-sizing: border-box;
}
.play-buttons {
  height: 28px;
}
button.play {
  height: 27px;
  line-height: 25px;
  font-size: 16px;
  padding-left: 5px;
  padding-right: 5px;
}
</style>
