<template>
  <div>
    <div class="frame" :style="layout.frameStyle">
      <div v-if="header" class="header" :style="layout.headerStyle">
        {{ header }}
      </div>
      <div v-if="footer" class="footer" :style="layout.footerStyle">
        {{ footer }}
      </div>
      <div v-if="layout.lastMoveStyle" :style="layout.lastMoveStyle"></div>
      <div class="board-grid" :style="layout.boardStyle">
        <img src="/board/grid_square.svg" :style="layout.boardImageStyle" />
      </div>
      <div v-for="file of layout.files" :key="file.image" :style="file.style">
        <img :src="file.image" :style="layout.fileImageStyle" />
      </div>
      <div v-for="rank of layout.ranks" :key="rank.image" :style="rank.style">
        <img :src="rank.image" :style="layout.rankImageStyle" />
      </div>
      <div v-for="piece of layout.boardPieces" :key="piece.id" :style="piece.style">
        <img :src="piece.image" :style="piece.imageStyle" />
      </div>
      <div :style="layout.blackHandSymbol.style">
        <img :src="layout.blackHandSymbol.image" :style="layout.blackHandImageStyle" />
      </div>
      <div v-for="hand of layout.blackHandPieces" :key="hand.id" :style="hand.style">
        <img :src="hand.image" :style="layout.blackHandImageStyle" />
      </div>
      <div :style="layout.whiteHandSymbol.style">
        <img :src="layout.whiteHandSymbol.image" :style="layout.whiteHandImageStyle" />
      </div>
      <div v-for="hand of layout.whiteHandPieces" :key="hand.id" :style="hand.style">
        <img :src="hand.image" :style="layout.whiteHandImageStyle" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Move, ImmutablePosition, Piece } from "@/common/shogi";
import { computed, PropType } from "vue";
import { RectSize } from "@/common/graphics";

const pieceImageMap = {
  pawn: "./piece/gothic/pawn.png",
  lance: "./piece/gothic/lance.png",
  knight: "./piece/gothic/knight.png",
  silver: "./piece/gothic/silver.png",
  gold: "./piece/gothic/gold.png",
  bishop: "./piece/gothic/bishop.png",
  rook: "./piece/gothic/rook.png",
  king: "./piece/gothic/king2.png",
  promPawn: "./piece/gothic/prom_pawn.png",
  promLance: "./piece/gothic/prom_lance.png",
  promKnight: "./piece/gothic/prom_knight.png",
  promSilver: "./piece/gothic/prom_silver.png",
  horse: "./piece/gothic/horse.png",
  dragon: "./piece/gothic/dragon.png",
};

function buildParams(size: number) {
  return {
    size: size,
    headerX: size * 0.5,
    headerY: size * 0.01,
    footerX: size * 0.01,
    footerY: size * 0.83,
    boardLeft: size * 0.15,
    boardTop: size * 0.12,
    boardSize: size * 0.7,
    boardBorderSize: size * 0.004,
    fileLeft: size * 0.168,
    fileTop: size * 0.078,
    rankLeft: size * 0.85,
    rankTop: size * 0.138,
    labelSize: size * 0.04,
    pieceSize: (size * 0.7) / 9,
    fontSize: size * 0.038,
    handSize: size * 0.053,
    blackHandLeft: size * 0.9,
    blackHandTop: size * 0.12,
    whiteHandLeft: size * (0.1 - 0.053),
    whiteHandTop: size * 0.82,
  };
}

const props = defineProps({
  maxSize: {
    type: RectSize,
    required: true,
  },
  position: {
    type: Object as PropType<ImmutablePosition>,
    required: true,
  },
  header: {
    type: String,
    required: false,
    default: null,
  },
  footer: {
    type: String,
    required: false,
    default: null,
  },
  lastMove: {
    type: Object as PropType<Move | null>,
    required: false,
    default: null,
  },
});

const layout = computed(() => {
  const param = buildParams(Math.min(props.maxSize.width, props.maxSize.height));
  return {
    frameStyle: {
      width: `${param.size}px`,
      height: `${param.size}px`,
    },
    headerStyle: {
      transform: "translate(-50%, 0%)",
      left: `${param.headerX}px`,
      top: `${param.headerY}px`,
      "font-size": `${param.fontSize}px`,
    },
    footerStyle: {
      left: `${param.footerX}px`,
      top: `${param.footerY}px`,
      "font-size": `${param.fontSize}px`,
    },
    boardStyle: {
      left: `${param.boardLeft - param.boardBorderSize}px`,
      top: `${param.boardTop - param.boardBorderSize}px`,
    },
    boardImageStyle: {
      width: `${param.boardSize + param.boardBorderSize * 2}px`,
      height: `${param.boardSize + param.boardBorderSize * 2}px`,
    },
    files: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((file) => {
      return {
        style: {
          left: `${param.fileLeft + param.pieceSize * (9 - file)}px`,
          top: `${param.fileTop}px`,
        },
        image: `./character/arabic_numerals/${file}.png`,
      };
    }),
    fileImageStyle: {
      width: `${param.labelSize}px`,
      height: `${param.labelSize}px`,
    },
    ranks: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((rank) => {
      return {
        style: {
          left: `${param.rankLeft}px`,
          top: `${param.rankTop + param.pieceSize * (rank - 1)}px`,
        },
        image: `./character/numerals/${rank}.png`,
      };
    }),
    rankImageStyle: {
      width: `${param.labelSize}px`,
      height: `${param.labelSize}px`,
    },
    lastMoveStyle: (function () {
      if (!props.lastMove) {
        return null;
      }
      const square = props.lastMove.to;
      return {
        "background-color": "gold",
        left: `${param.boardLeft + (param.boardSize * square.x) / 9}px`,
        top: `${param.boardTop + (param.boardSize * square.y) / 9}px`,
        width: `${param.pieceSize}px`,
        height: `${param.pieceSize}px`,
      };
    })(),
    boardPieces: props.position.board.listNonEmptySquares().map((square) => {
      const piece = props.position.board.at(square) as Piece;
      return {
        id: `${square.x},${square.y}`,
        style: {
          left: `${param.boardLeft + (param.boardSize * square.x) / 9}px`,
          top: `${param.boardTop + (param.boardSize * square.y) / 9}px`,
        },
        imageStyle: {
          width: `${param.pieceSize}px`,
          height: `${param.pieceSize}px`,
          transform: piece.color === "white" ? "rotate(180deg)" : undefined,
        },
        image: pieceImageMap[piece.type],
      };
    }),
    blackHandImageStyle: {
      width: `${param.handSize}px`,
      height: "auto",
    },
    blackHandSymbol: {
      style: {
        left: `${param.blackHandLeft}px`,
        top: `${param.blackHandTop}px`,
      },
      image: "./character/turns/black.png",
    },
    blackHandPieces: (function () {
      const list = [];
      for (const { type, count } of props.position.blackHand.counts) {
        if (count === 0) {
          continue;
        }
        list.push({
          id: type,
          style: {
            left: `${param.blackHandLeft}px`,
            top: `${param.blackHandTop + param.handSize * (list.length + 1)}px`,
          },
          image: `./piece/gothic/${type}.png`,
        });
        if (count === 1) {
          continue;
        }
        list.push({
          id: `${type}-number`,
          style: {
            left: `${param.blackHandLeft}px`,
            top: `${param.blackHandTop + param.handSize * (list.length + 1)}px`,
          },
          image: `./character/numerals/${count}.png`,
        });
      }
      if (list.length === 0) {
        return [
          {
            id: "empty",
            style: {
              left: `${param.blackHandLeft}px`,
              top: `${param.blackHandTop + param.handSize}px`,
            },
            image: "./character/hand/nashi.png",
          },
        ];
      }
      return list;
    })(),
    whiteHandImageStyle: {
      width: `${param.handSize}px`,
      height: "auto",
      transform: "rotate(180deg)",
    },
    whiteHandSymbol: {
      style: {
        left: `${param.whiteHandLeft}px`,
        top: `${param.whiteHandTop}px`,
        transform: "translate(0%, -100%)",
      },
      image: "./character/turns/white.png",
    },
    whiteHandPieces: (function () {
      const list = [];
      for (const { type, count } of props.position.whiteHand.counts) {
        if (count === 0) {
          continue;
        }
        list.push({
          id: type,
          style: {
            left: `${param.whiteHandLeft}px`,
            top: `${param.whiteHandTop - param.handSize * (list.length + 1)}px`,
            transform: "translate(0%, -100%)",
          },
          image: `./piece/gothic/${type}.png`,
        });
        if (count === 1) {
          continue;
        }
        list.push({
          id: `${type}-number`,
          style: {
            left: `${param.whiteHandLeft}px`,
            top: `${param.whiteHandTop - param.handSize * (list.length + 1)}px`,
            transform: "translate(0%, -100%)",
          },
          image: `./character/numerals/${count}.png`,
        });
      }
      if (list.length === 0) {
        return [
          {
            id: "empty",
            style: {
              left: `${param.whiteHandLeft}px`,
              top: `${param.whiteHandTop - param.handSize}px`,
              transform: "translate(0%, -100%)",
            },
            image: "./character/hand/nashi.png",
          },
        ];
      }
      return list;
    })(),
  };
});
</script>

<style scoped>
.frame {
  color: black;
  background-color: white;
  user-select: none;
  position: relative;
  overflow: hidden;
}
.frame > * {
  position: absolute;
}
.header {
  white-space: nowrap;
}
.footer {
  white-space: pre-wrap;
  text-align: left;
}
</style>
