<template>
  <div>
    <div class="frame" :style="layout.frame.style" @click="clickFrame()">
      <div v-if="layout.board.textureImagePath" :style="layout.board.style">
        <img class="full" :src="layout.board.textureImagePath" />
      </div>
      <div :style="layout.board.style">
        <img class="full" :src="layout.board.gridImagePath" />
      </div>
      <div
        class="player-name"
        :class="{ active: position.color == 'black' }"
        :style="layout.blackPlayerName.style"
      >
        <span class="player-name-text">☗{{ blackPlayerName }}</span>
      </div>
      <div
        v-if="layout.blackClock"
        class="clock"
        :class="blackPlayerTimeSeverity"
        :style="layout.blackClock.style"
      >
        <span class="clock-text">{{ blackPlayerTimeText }}</span>
      </div>
      <div
        class="player-name"
        :class="{ active: position.color == 'white' }"
        :style="layout.whitePlayerName.style"
      >
        <span class="player-name-text">☖{{ whitePlayerName }}</span>
      </div>
      <div
        v-if="layout.whiteClock"
        class="clock"
        :class="whitePlayerTimeSeverity"
        :style="layout.whiteClock.style"
      >
        <span class="clock-text">{{ whitePlayerTimeText }}</span>
      </div>
      <div v-for="square in layout.square" :key="square.id" :style="square.backgroundStyle"></div>
      <div v-for="piece in layout.piece" :key="piece.id" :style="piece.style">
        <img class="piece-image" :src="piece.imagePath" />
      </div>
      <div v-for="label in layout.labels" :key="label.id" :style="label.style">
        {{ label.character }}
      </div>
      <div
        v-for="square in layout.square"
        :key="square.id"
        :style="square.style"
        @click.stop.prevent="clickSquare(square.file, square.rank)"
        @contextmenu.stop.prevent="clickSquareR(square.file, square.rank)"
      ></div>
      <div :style="layout.blackHand.backgroundStyle">
        <img
          v-if="layout.blackHand.textureImagePath"
          class="full"
          :src="layout.blackHand.textureImagePath"
        />
      </div>
      <div class="hand" :style="layout.blackHand.style">
        <div
          v-for="pointer in layout.blackHand.pointers"
          :key="pointer.id"
          :style="pointer.backgroundStyle"
        ></div>
        <div v-for="piece in layout.blackHand.pieces" :key="piece.id" :style="piece.style">
          <img class="piece-image" :src="piece.imagePath" />
        </div>
        <div
          v-for="pointer in layout.blackHand.pointers"
          :key="pointer.id"
          :style="pointer.style"
          @click.stop.prevent="clickHand(Color.BLACK, pointer.type)"
        ></div>
      </div>
      <div :style="layout.whiteHand.backgroundStyle">
        <img
          v-if="layout.whiteHand.textureImagePath"
          class="full"
          :src="layout.whiteHand.textureImagePath"
        />
      </div>
      <div class="hand" :style="layout.whiteHand.style">
        <div
          v-for="pointer in layout.whiteHand.pointers"
          :key="pointer.id"
          :style="pointer.backgroundStyle"
        ></div>
        <div v-for="piece in layout.whiteHand.pieces" :key="piece.id" :style="piece.style">
          <img class="piece-image" :src="piece.imagePath" />
        </div>
        <div
          v-for="pointer in layout.whiteHand.pointers"
          :key="pointer.id"
          :style="pointer.style"
          @click.stop.prevent="clickHand(Color.WHITE, pointer.type)"
        ></div>
      </div>
      <div v-if="layout.promotion" class="promotion-selector" :style="layout.promotion.style">
        <div class="select-button promote" @click.stop.prevent="clickPromote()">
          <img class="piece-image" :src="layout.promotion.promoteImagePath" draggable="false" />
        </div>
        <div class="select-button not-promote" @click.stop.prevent="clickNotPromote()">
          <img class="piece-image" :src="layout.promotion.notPromoteImagePath" draggable="false" />
        </div>
      </div>
      <div class="turn" :style="layout.turn.style">{{ nextMoveLabel }}</div>
      <div :style="layout.control.left.style">
        <slot name="left-control"></slot>
      </div>
      <div :style="layout.control.right.style">
        <slot name="right-control"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  PieceType,
  Square,
  Piece,
  Color,
  Move,
  ImmutablePosition,
  PositionChange,
  secondsToHHMMSS,
} from "tsshogi";
import { computed, reactive, watch, PropType } from "vue";
import {
  BoardImageType,
  BoardLabelType,
  KingPieceType,
  PieceStandImageType,
} from "@/common/settings/app";
import { RectSize } from "@/common/assets/geometry";
import LayoutBuilder from "./BoardLayout";

type State = {
  pointer: Square | Piece | null;
  reservedMove: Move | null;
};

const props = defineProps({
  boardImageType: {
    type: String as PropType<BoardImageType>,
    required: true,
  },
  pieceImageUrlTemplate: {
    type: String,
    required: true,
  },
  kingPieceType: {
    type: String as PropType<KingPieceType>,
    required: true,
  },
  customBoardImageUrl: {
    type: String,
    required: false,
    default: undefined,
  },
  pieceStandImageType: {
    type: String as PropType<PieceStandImageType>,
    required: true,
  },
  customPieceStandImageUrl: {
    type: String,
    required: false,
    default: undefined,
  },
  boardImageOpacity: {
    type: Number,
    required: false,
    default: 1.0,
  },
  pieceStandImageOpacity: {
    type: Number,
    required: false,
    default: 1.0,
  },
  boardLabelType: {
    type: String as PropType<BoardLabelType>,
    required: true,
  },
  maxSize: {
    type: RectSize,
    required: true,
  },
  position: {
    type: Object as PropType<ImmutablePosition>,
    required: true,
  },
  lastMove: {
    type: Object as PropType<Move | null>,
    required: false,
    default: null,
  },
  flip: {
    type: Boolean,
    required: false,
  },
  hideClock: {
    type: Boolean,
    required: false,
    default: false,
  },
  allowEdit: {
    type: Boolean,
    required: false,
  },
  allowMove: {
    type: Boolean,
    required: false,
  },
  blackPlayerName: {
    type: String,
    required: false,
    default: "先手",
  },
  whitePlayerName: {
    type: String,
    required: false,
    default: "後手",
  },
  blackPlayerTime: {
    type: Number,
    required: false,
    default: undefined,
  },
  blackPlayerByoyomi: {
    type: Number,
    required: false,
    default: undefined,
  },
  whitePlayerTime: {
    type: Number,
    required: false,
    default: undefined,
  },
  whitePlayerByoyomi: {
    type: Number,
    required: false,
    default: undefined,
  },
  nextMoveLabel: {
    type: String,
    required: false,
    default: "手番",
  },
});

const emit = defineEmits<{
  resize: [size: RectSize];
  move: [move: Move];
  edit: [change: PositionChange];
}>();

const state = reactive({
  pointer: null,
  reservedMove: null,
} as State);

const resetState = () => {
  state.pointer = null;
  state.reservedMove = null;
};

watch([() => props.position, () => props.allowEdit, () => props.allowMove], () => {
  resetState();
});

const clickFrame = () => {
  resetState();
};

const updatePointer = (newPointer: Square | Piece, empty: boolean, color: Color | undefined) => {
  const prevPointer = state.pointer;
  resetState();
  if (
    newPointer instanceof Square &&
    prevPointer instanceof Square &&
    newPointer.equals(prevPointer)
  ) {
    return;
  }
  if (
    newPointer instanceof Piece &&
    prevPointer instanceof Piece &&
    newPointer.equals(prevPointer)
  ) {
    return;
  }
  if (prevPointer) {
    const editFrom = prevPointer;
    const editTo = newPointer instanceof Square ? newPointer : newPointer.color;
    if (props.allowEdit && props.position.isValidEditing(editFrom, editTo)) {
      emit("edit", {
        move: {
          from: prevPointer,
          to: editTo,
        },
      });
      return;
    }
    if (props.allowMove && newPointer instanceof Square) {
      const moveFrom = prevPointer instanceof Square ? prevPointer : prevPointer.type;
      const moveTo = newPointer;
      const move = props.position.createMove(moveFrom, moveTo);
      if (!move) {
        return;
      }
      const noProm = props.position.isValidMove(move);
      const prom = props.position.isValidMove(move.withPromote());
      if (noProm && prom) {
        state.reservedMove = move;
        return;
      }
      if (noProm) {
        emit("move", move);
        return;
      }
      if (prom) {
        emit("move", move.withPromote());
        return;
      }
    }
  }
  if ((!props.allowMove && !props.allowEdit) || empty) {
    return;
  }
  if (!props.allowEdit && color !== props.position.color) {
    return;
  }
  state.pointer = newPointer;
};

const clickSquare = (file: number, rank: number) => {
  const square = new Square(file, rank);
  const piece = props.position.board.at(square);
  const empty = !piece;
  updatePointer(square, empty, piece?.color);
};

const clickHand = (color: Color, type: PieceType) => {
  const empty = props.position.hand(color).count(type) === 0;
  updatePointer(new Piece(color, type), empty, color);
};

const clickSquareR = (file: number, rank: number) => {
  resetState();
  const square = new Square(file, rank);
  if (props.allowEdit && props.position.board.at(square)) {
    emit("edit", { rotate: square });
  }
};

const clickPromote = () => {
  const move = state.reservedMove;
  resetState();
  if (move && props.position.isValidMove(move.withPromote())) {
    emit("move", move.withPromote());
  }
};

const clickNotPromote = () => {
  const move = state.reservedMove;
  resetState();
  if (move && props.position.isValidMove(move)) {
    emit("move", move);
  }
};

const layoutBuilder = computed(() => {
  const builder = new LayoutBuilder({
    boardImageType: props.boardImageType,
    customBoardImageURL: props.customBoardImageUrl,
    pieceStandImageType: props.pieceStandImageType,
    customPieceStandImageURL: props.customPieceStandImageUrl,
    pieceImageURLTemplate: props.pieceImageUrlTemplate,
    kingPieceType: props.kingPieceType,
  });
  builder.preload();
  return builder;
});

const layout = computed(() => {
  const layout = layoutBuilder.value.build(
    {
      boardImageOpacity: props.boardImageOpacity,
      pieceStandImageOpacity: props.pieceStandImageOpacity,
      boardLabelType: props.boardLabelType,
      upperSizeLimit: props.maxSize,
      flip: props.flip,
      hideClock: props.hideClock,
    },
    props.position,
    props.lastMove,
    state.pointer,
    state.reservedMove,
  );
  emit("resize", layout.frame.size);
  return layout;
});

const formatTime = (time?: number, byoyomi?: number): string => {
  if (time) {
    return secondsToHHMMSS(time);
  } else if (byoyomi !== undefined) {
    return "" + byoyomi;
  }
  return "0:00:00";
};

const timeSeverity = (time?: number, byoyomi?: number) => {
  if (!time && !byoyomi) {
    return "normal";
  }
  const rem = (time || 0) + (byoyomi || 0);
  if (rem <= 5) {
    return "danger";
  } else if (rem <= 10) {
    return "warning";
  }
  return "normal";
};

const blackPlayerTimeText = computed(() => {
  return formatTime(props.blackPlayerTime, props.blackPlayerByoyomi);
});

const blackPlayerTimeSeverity = computed(() => {
  return timeSeverity(props.blackPlayerTime, props.blackPlayerByoyomi);
});

const whitePlayerTimeText = computed(() => {
  return formatTime(props.whitePlayerTime, props.whitePlayerByoyomi);
});

const whitePlayerTimeSeverity = computed(() => {
  return timeSeverity(props.whitePlayerTime, props.whitePlayerByoyomi);
});
</script>

<style scoped>
.frame {
  color: var(--text-color);
  user-select: none;
  position: relative;
}
.frame > * {
  position: absolute;
}
.hand > * {
  position: absolute;
}
.player-name {
  background-color: var(--text-bg-color);
  display: flex;
  justify-content: left;
  align-items: center;
  border: 1px solid black;
  box-sizing: border-box;
}
.player-name-text {
  margin-left: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.clock {
  background-color: var(--text-bg-color);
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid black;
  box-sizing: border-box;
}
.clock.warning {
  background-color: var(--text-bg-color-warning);
}
.clock.danger {
  color: var(--text-color-danger);
  background-color: var(--text-bg-color-danger);
}
.clock-text {
  vertical-align: middle;
}
.promotion-selector {
  overflow: hidden;
}
.select-button {
  float: left;
  width: 50%;
  height: 100%;
}
.promote {
  background-color: var(--promote-bg-color);
}
.not-promote {
  background-color: var(--not-promote-bg-color);
}
.turn {
  color: var(--turn-label-color);
  background-color: var(--turn-label-bg-color);
  border-color: var(--turn-label-border-color);
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}
.piece-image {
  max-width: 100%;
  max-height: 100%;
}
</style>
