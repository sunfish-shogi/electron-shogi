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
import { RectSize } from "@/renderer/view/primitive/Types";
import { useStore } from "@/renderer/store";
import { RecordCustomData } from "@/renderer/store/record";
import {
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  ref,
  Ref,
  watch,
} from "vue";
import {
  ActiveElement,
  Chart,
  ChartEvent,
  Color as ChartColor,
} from "chart.js";
import { Color, ImmutableNode, ImmutableRecord } from "@/common/shogi";
import { scoreToPercentage } from "@/renderer/store/score";
import { AppSetting, Thema } from "@/common/settings/app";
import { SearchInfo } from "@/renderer/players/player";

const MATE_SCORE = 1000000;
const MAX_SCORE = 2000;
const MIN_SCORE = -MAX_SCORE;

enum Series {
  BLACK_PLAYER,
  WHITE_PLAYER,
  RESEARCHER,
  RESEARCHER_2,
  RESEARCHER_3,
  RESEARCHER_4,
}

function getSeriesName(series: Series): string {
  switch (series) {
    case Series.BLACK_PLAYER:
      return "先手";
    case Series.WHITE_PLAYER:
      return "後手";
    case Series.RESEARCHER:
      return "検討";
    case Series.RESEARCHER_2:
      return "検討2";
    case Series.RESEARCHER_3:
      return "検討3";
    case Series.RESEARCHER_4:
      return "検討4";
  }
}

function getSearchInfo(
  node: ImmutableNode,
  series: Series
): SearchInfo | undefined {
  const data = node.customData as RecordCustomData;
  if (!data) {
    return;
  }
  switch (series) {
    case Series.BLACK_PLAYER:
      if (node.nextColor === Color.BLACK) {
        return;
      }
      return data.playerSearchInfo;
    case Series.WHITE_PLAYER:
      if (node.nextColor === Color.WHITE) {
        return;
      }
      return data.playerSearchInfo;
    case Series.RESEARCHER:
      return data.researchInfo;
    case Series.RESEARCHER_2:
      return data.researchInfo2;
    case Series.RESEARCHER_3:
      return data.researchInfo3;
    case Series.RESEARCHER_4:
      return data.researchInfo4;
  }
}

function getScore(
  searchInfo: SearchInfo,
  type: EvaluationChartType,
  coefficientInSigmoid: number
): number | undefined {
  const score =
    searchInfo.score !== undefined
      ? searchInfo.score
      : searchInfo.mate !== undefined
      ? searchInfo.mate > 0
        ? MATE_SCORE
        : -MATE_SCORE
      : undefined;
  if (score === undefined) {
    return;
  }
  switch (type) {
    case EvaluationChartType.RAW:
      return Math.min(Math.max(score, MIN_SCORE), MAX_SCORE);
    case EvaluationChartType.WIN_RATE:
      return scoreToPercentage(score, coefficientInSigmoid);
  }
}

type ColorPalette = {
  main: string;
  ticks: string;
  grid: string;
  head: string;
  blackPlayer: string;
  whitePlayer: string;
  researcher: string;
  researcher2: string;
  researcher3: string;
  researcher4: string;
};

function getColorPalette(thema: Thema): ColorPalette {
  switch (thema) {
    default:
      return {
        main: "black",
        ticks: "dimgray",
        grid: "lightgray",
        head: "red",
        blackPlayer: "#1480C9",
        whitePlayer: "#FB7D00",
        researcher: "#349393",
        researcher2: "#FF1F4E",
        researcher3: "#6C22FF",
        researcher4: "#FFB912",
      };
    case Thema.DARK:
      return {
        main: "white",
        ticks: "darkgray",
        grid: "dimgray",
        head: "red",
        blackPlayer: "#36A2EB",
        whitePlayer: "#FF9F40",
        researcher: "#4BC0C0",
        researcher2: "#FF6384",
        researcher3: "#9966FF",
        researcher4: "#FFCD56",
      };
  }
}

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
      borderColor: ChartColor,
      series: Series,
      record: ImmutableRecord,
      appSetting: AppSetting
    ) => {
      const dataPoints: { x: number; y: number }[] = [];
      const nodes = record.moves;
      for (const node of nodes) {
        const searchInfo = getSearchInfo(node, series);
        if (!searchInfo) {
          continue;
        }
        const score = getScore(
          searchInfo,
          props.type,
          appSetting.coefficientInSigmoid
        );
        if (score !== undefined) {
          dataPoints.push({
            x: node.number,
            y: score,
          });
        }
      }
      const lastNode = nodes[nodes.length - 1];
      if (
        (series === Series.BLACK_PLAYER &&
          lastNode.nextColor === Color.BLACK) ||
        (series === Series.WHITE_PLAYER && lastNode.nextColor === Color.WHITE)
      ) {
        const data = lastNode.customData as RecordCustomData;
        if (data && data.enemySearchInfo) {
          const score = getScore(
            data.enemySearchInfo,
            props.type,
            appSetting.coefficientInSigmoid
          );
          if (score !== undefined) {
            dataPoints.push({
              x: lastNode.number + 1,
              y: score,
            });
          }
        }
      }
      return {
        label: getSeriesName(series),
        borderColor,
        data: dataPoints,
        showLine: true,
      };
    };

    const verticalLine = (record: ImmutableRecord, palette: ColorPalette) => {
      return {
        label: "現在の局面",
        borderColor: palette.head,
        data: [
          { x: record.current.number, y: maxScore },
          { x: record.current.number, y: minScore },
        ],
        showLine: true,
        pointBorderWidth: 0,
        pointRadius: 0,
      };
    };

    const buildDatasets = (
      record: ImmutableRecord,
      appSetting: AppSetting,
      palette: ColorPalette
    ) => {
      return [
        verticalLine(record, palette),
        buildDataset(
          palette.blackPlayer,
          Series.BLACK_PLAYER,
          record,
          appSetting
        ),
        buildDataset(
          palette.whitePlayer,
          Series.WHITE_PLAYER,
          record,
          appSetting
        ),
        buildDataset(palette.researcher, Series.RESEARCHER, record, appSetting),
        buildDataset(
          palette.researcher2,
          Series.RESEARCHER_2,
          record,
          appSetting
        ),
        buildDataset(
          palette.researcher3,
          Series.RESEARCHER_3,
          record,
          appSetting
        ),
        buildDataset(
          palette.researcher4,
          Series.RESEARCHER_4,
          record,
          appSetting
        ),
      ];
    };

    const buildScalesOption = (
      record: ImmutableRecord,
      palette: ColorPalette
    ) => {
      return {
        x: {
          min: 0,
          max: record.length + 10,
          ticks: { color: palette.ticks },
          grid: { color: palette.grid },
        },
        y: {
          min: minScore,
          max: maxScore,
          ticks: { color: palette.ticks },
          grid: { color: palette.grid },
        },
      };
    };

    const updateChart = (record: ImmutableRecord, appSetting: AppSetting) => {
      const palette = getColorPalette(appSetting.thema);
      chart.data.datasets = buildDatasets(record, appSetting, palette);
      chart.options.color = palette.main;
      chart.options.scales = buildScalesOption(record, palette);
      chart.update();
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
      const ply = Math.round(x);
      store.changePly(ply);
    };

    onMounted(() => {
      const canvas = canvasRef.value as HTMLCanvasElement;
      const context = canvas.getContext("2d") as CanvasRenderingContext2D;
      chart = new Chart(context, {
        type: "scatter",
        data: {
          datasets: [],
        },
        options: {
          animation: {
            duration: 0,
          },
          maintainAspectRatio: false,
          events: ["click"],
          onClick,
        },
      });
      chart.draw();
      updateChart(store.record, store.appSetting);

      watch(
        () => [store.record, store.appSetting],
        ([record, appSetting]) =>
          updateChart(record as ImmutableRecord, appSetting as AppSetting),
        { deep: true }
      );

      watch(
        () => [props.size],
        ([size]) => {
          chart.resize(size.width, size.height);
        },
        { deep: true }
      );
    });

    onUnmounted(() => {
      chart.destroy();
    });

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
  background-color: var(--chart-bg-color);
}
canvas {
  width: 100%;
  height: 100%;
}
</style>
