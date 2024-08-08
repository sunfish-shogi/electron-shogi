import { Config } from "./config";
import { Color, ImmutablePosition, reverseColor } from "tsshogi";
import { Frame, Layout, PlayerName, Turn } from "./layout";
import { portraitViewParams } from "./params";
import { Point, RectSize } from "@/common/assets/geometry";

export class PortraitLayoutBuilder {
  constructor(private config: Config) {}

  get ratio(): number {
    let ratio = this.config.upperSizeLimit.width / portraitViewParams.frame.width;
    if (portraitViewParams.frame.height * ratio > this.config.upperSizeLimit.height) {
      ratio = this.config.upperSizeLimit.height / portraitViewParams.frame.height;
    }
    return ratio;
  }

  get boardBasePoint(): Point {
    return new Point(portraitViewParams.board.x, portraitViewParams.board.y).multiply(this.ratio);
  }

  get blackHandBasePoint(): Point {
    const params = this.config.flip ? portraitViewParams.hand.white : portraitViewParams.hand.black;
    return new Point(params.x, params.y).multiply(this.ratio);
  }

  get whiteHandBasePoint(): Point {
    const params = this.config.flip ? portraitViewParams.hand.black : portraitViewParams.hand.white;
    return new Point(params.x, params.y).multiply(this.ratio);
  }

  build(position: ImmutablePosition): Layout {
    const ratio = this.ratio;

    const buildFrameLayout = (): Frame => {
      const height = portraitViewParams.frame.height * ratio;
      const width = portraitViewParams.frame.width * ratio;
      return {
        style: {
          height: height + "px",
          width: width + "px",
        },
        size: new RectSize(width, height),
      };
    };

    const buildTurnLayout = (): Turn => {
      const color = position.color;
      const displayColor = this.config.flip ? reverseColor(color) : color;
      const borderWidth = 2;
      const params = portraitViewParams.turn[displayColor];
      return {
        style: {
          left: params.x * ratio - borderWidth + "px",
          top: params.y * ratio - borderWidth + "px",
          width: portraitViewParams.turn.width * ratio - borderWidth + "px",
          height: portraitViewParams.turn.height * ratio - borderWidth + "px",
          "font-size": portraitViewParams.turn.fontSize * ratio + "px",
          "border-radius": portraitViewParams.turn.height * ratio * 0.4 + "px",
          "border-width": borderWidth + "px",
          "border-style": "solid",
        },
      };
    };

    const buildPlayerNameLayout = (color: Color): PlayerName => {
      const displayColor = this.config.flip ? reverseColor(color) : color;
      const params = portraitViewParams.playerName[displayColor];
      return {
        style: {
          left: params.x * ratio + "px",
          top: params.y * ratio + "px",
          width: portraitViewParams.playerName.width * ratio + "px",
          height: portraitViewParams.playerName.height * ratio + "px",
          "font-size": portraitViewParams.playerName.fontSize * ratio + "px",
        },
      };
    };

    const boardBasePoint = this.boardBasePoint;
    const blackHandBasePoint = this.blackHandBasePoint;
    const whiteHandBasePoint = this.whiteHandBasePoint;

    return {
      ratio,
      frame: buildFrameLayout(),
      boardStyle: {
        left: boardBasePoint.x + "px",
        top: boardBasePoint.y + "px",
      },
      blackHandStyle: {
        left: blackHandBasePoint.x + "px",
        top: blackHandBasePoint.y + "px",
      },
      whiteHandStyle: {
        left: whiteHandBasePoint.x + "px",
        top: whiteHandBasePoint.y + "px",
      },
      turn: buildTurnLayout(),
      blackPlayerName: buildPlayerNameLayout(Color.BLACK),
      whitePlayerName: buildPlayerNameLayout(Color.WHITE),
    };
  }
}
