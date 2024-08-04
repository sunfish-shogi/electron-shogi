import { Config } from "./config";
import { Color, ImmutablePosition, reverseColor } from "tsshogi";
import { Frame, Layout, PlayerName, Turn } from "./layout";
import { portraitViewParams } from "./params";
import { RectSize } from "@/common/assets/geometry";

export class PortraitLayoutBuilder {
  constructor(private config: Config) {}

  build(position: ImmutablePosition): Layout {
    let ratio = this.config.upperSizeLimit.width / portraitViewParams.frame.width;
    if (portraitViewParams.frame.height * ratio > this.config.upperSizeLimit.height) {
      ratio = this.config.upperSizeLimit.height / portraitViewParams.frame.height;
    }

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

    return {
      ratio,
      frame: buildFrameLayout(),
      boardStyle: {
        left: portraitViewParams.board.x * ratio + "px",
        top: portraitViewParams.board.y * ratio + "px",
      },
      blackHandStyle: {
        left: portraitViewParams.hand.black.x * ratio + "px",
        top: portraitViewParams.hand.black.y * ratio + "px",
      },
      whiteHandStyle: {
        left: portraitViewParams.hand.white.x * ratio + "px",
        top: portraitViewParams.hand.white.y * ratio + "px",
      },
      turn: buildTurnLayout(),
      blackPlayerName: buildPlayerNameLayout(Color.BLACK),
      whitePlayerName: buildPlayerNameLayout(Color.WHITE),
    };
  }
}
