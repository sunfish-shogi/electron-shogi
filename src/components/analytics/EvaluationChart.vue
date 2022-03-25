<template>
  <div>
    <div class="root">
      <canvas
        ref="canvas"
        :width="size.width.toFixed(0)"
        :height="size.height.toFixed(0)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { RectSize } from "@/layout/types";
import { Action, useStore } from "@/store";
import { MAX_SCORE, MIN_SCORE, RecordEntryCustomData } from "@/store/record";
import { defineComponent, onMounted, onUnmounted, ref, Ref, watch } from "vue";
import { ActiveElement, Chart, ChartEvent, Color } from "chart.js";
import { stringifyUSIInfoSender, USIInfoSender } from "@/usi/info";
import { Record } from "@/shogi";

export default defineComponent({
  name: "EvaluationChart",
  props: {
    size: {
      type: RectSize,
      required: true,
    },
  },
  setup(props) {
    const canvasRef: Ref = ref(null);
    const store = useStore();
    let chart: Chart;

    const buildDataset = (
      borderColor: Color,
      sender: USIInfoSender,
      record: Record
    ) => {
      const dataPoints: { x: number; y: number }[] = [];
      record.moves.forEach((entry) => {
        const data = new RecordEntryCustomData(entry.customData);
        const value = data.evaluation && data.evaluation[sender];
        if (value) {
          dataPoints.push({
            x: entry.number,
            y: value,
          });
        }
      });
      return {
        label: stringifyUSIInfoSender(sender),
        borderColor,
        data: dataPoints,
        showLine: true,
      };
    };

    const verticalLine = (record: Record) => {
      return {
        label: "現在の局面",
        borderColor: "red",
        data: [
          { x: record.current.number, y: MAX_SCORE },
          { x: record.current.number, y: MIN_SCORE },
        ],
        showLine: true,
        pointBorderWidth: 0,
        pointRadius: 0,
      };
    };

    const buildDatasets = (record: Record) => {
      return [
        verticalLine(record),
        buildDataset("royalblue", USIInfoSender.BLACK_PLAYER, record),
        buildDataset("darkorange", USIInfoSender.WHITE_PLAYER, record),
        buildDataset("darkgreen", USIInfoSender.RESEARCHER, record),
      ];
    };

    const buildScalesOption = (record: Record) => {
      return {
        x: {
          min: 0,
          max: record.length + 10,
        },
        y: {
          min: MIN_SCORE,
          max: MAX_SCORE,
        },
      };
    };

    const onClick = (event: ChartEvent, _: ActiveElement[], chart: Chart) => {
      if (event.x === null) {
        return;
      }
      const width = chart.scales.x.max - chart.scales.x.min;
      const displayWidth = chart.scales.x.right - chart.scales.x.left;
      const x =
        ((event.x - chart.scales.x.left) / displayWidth) * width +
        chart.scales.x.min;
      const number = Math.round(x);
      store.dispatch(Action.CHANGE_MOVE_NUMBER, number);
    };

    onMounted(() => {
      const canvas = canvasRef.value as HTMLCanvasElement;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      chart = new Chart(context, {
        type: "scatter",
        data: {
          datasets: buildDatasets(store.state.record),
        },
        options: {
          color: "black",
          animation: {
            duration: 0,
          },
          maintainAspectRatio: false,
          events: ["click"],
          onClick,
        },
      });
      chart.draw();
    });

    onUnmounted(() => {
      chart.destroy();
    });

    watch(
      () => [store.state.record],
      ([record]) => {
        chart.data.datasets = buildDatasets(record);
        chart.options.scales = buildScalesOption(record);
        chart.update();
      },
      { deep: true }
    );

    watch(
      () => [props.size],
      ([size]) => {
        chart.resize(size.width, size.height);
      },
      { deep: true }
    );

    return {
      canvas: canvasRef,
    };
  },
});
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  background-color: white;
}
canvas {
  width: 100%;
  height: 100%;
}
</style>
