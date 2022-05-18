<template>
  <div>
    <div class="root">
      <canvas
        ref="canvas"
        :width="size.width.toFixed(0)"
        :height="size.height.toFixed(0)"
      >
      </canvas>
    </div>
  </div>
</template>

<script lang="ts">
import { RectSize } from "@/components/primitive/Types";
import { useStore } from "@/store";
import { RecordEntryCustomData } from "@/store/record";
import {
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  Ref,
  watch,
} from "vue";
import { ActiveElement, Chart, ChartEvent, Color } from "chart.js";
import { stringifyUSIInfoSender, USIInfoSender } from "@/store/usi";
import { ImmutableRecord } from "@/shogi";
import { scoreToPercentage } from "@/store/score";
import { AppSetting } from "@/settings/app";

const MAX_SCORE = 2000;
const MIN_SCORE = -MAX_SCORE;

export enum EvaluationChartType {
  RAW = "raw",
  WIN_RATE = "winRate",
}

export default defineComponent({
  name: "EvaluationChart",
  props: {
    size: {
      type: RectSize,
      required: true,
    },
    type: {
      type: String as PropType<EvaluationChartType>,
      required: true,
    },
  },
  setup(props) {
    const canvasRef: Ref = ref(null);
    const store = useStore();
    let chart: Chart;
    let maxScore = MAX_SCORE;
    let minScore = MIN_SCORE;
    if (props.type === EvaluationChartType.WIN_RATE) {
      maxScore = 100;
      minScore = 0;
    }

    const buildDataset = (
      borderColor: Color,
      sender: USIInfoSender,
      record: ImmutableRecord,
      appSetting: AppSetting
    ) => {
      const dataPoints: { x: number; y: number }[] = [];
      record.moves.forEach((entry) => {
        const data = new RecordEntryCustomData(entry.customData);
        let value = data.evaluation && data.evaluation[sender];
        if (value !== undefined) {
          switch (props.type) {
            case EvaluationChartType.RAW:
              value = Math.min(Math.max(value, MIN_SCORE), MAX_SCORE);
              break;
            case EvaluationChartType.WIN_RATE:
              value = scoreToPercentage(value, appSetting);
              break;
          }
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

    const verticalLine = (record: ImmutableRecord) => {
      return {
        label: "現在の局面",
        borderColor: "red",
        data: [
          { x: record.current.number, y: maxScore },
          { x: record.current.number, y: minScore },
        ],
        showLine: true,
        pointBorderWidth: 0,
        pointRadius: 0,
      };
    };

    const buildDatasets = (record: ImmutableRecord, appSetting: AppSetting) => {
      return [
        verticalLine(record),
        buildDataset(
          "royalblue",
          USIInfoSender.BLACK_PLAYER,
          record,
          appSetting
        ),
        buildDataset(
          "darkorange",
          USIInfoSender.WHITE_PLAYER,
          record,
          appSetting
        ),
        buildDataset("darkgreen", USIInfoSender.RESEARCHER, record, appSetting),
      ];
    };

    const buildScalesOption = (record: ImmutableRecord) => {
      return {
        x: {
          min: 0,
          max: record.length + 10,
        },
        y: {
          min: minScore,
          max: maxScore,
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
      store.changeMoveNumber(number);
    };

    onMounted(() => {
      const canvas = canvasRef.value as HTMLCanvasElement;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      const record = store.record;
      chart = new Chart(context, {
        type: "scatter",
        data: {
          datasets: buildDatasets(record, store.appSetting),
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
      () => [store.record, store.appSetting],
      ([record, appSetting]) => {
        chart.data.datasets = buildDatasets(
          record as ImmutableRecord,
          appSetting as AppSetting
        );
        chart.options.scales = buildScalesOption(record as ImmutableRecord);
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
