import { Config } from "./config";
import { Color, ImmutablePosition, reverseColor } from "tsshogi";
import { Frame, Layout, PlayerName, Turn } from "./layout";
import { compactViewParams } from "./params";
import { RectSize } from "@/common/assets/geometry";

export class CompactLayoutBuilder {
  constructor(private config: Config) {}

  build(position: ImmutablePosition): Layout {
    let ratio = this.config.upperSizeLimit.width / compactViewParams.frame.width;
    if (compactViewParams.frame.height * ratio > this.config.upperSizeLimit.height) {
      ratio = this.config.upperSizeLimit.height / compactViewParams.frame.height;
    }

    const buildFrameLayout = (): Frame => {
      const height = compactViewParams.frame.height * ratio;
      const width = compactViewParams.frame.width * ratio;
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
      const params = compactViewParams.turn[displayColor];
      return {
        style: {
          left: params.x * ratio - borderWidth + "px",
          top: params.y * ratio - borderWidth + "px",
          width: compactViewParams.turn.width * ratio - borderWidth + "px",
          height: compactViewParams.turn.height * ratio - borderWidth + "px",
          "font-size": compactViewParams.turn.fontSize * ratio + "px",
          "border-radius": compactViewParams.turn.height * ratio * 0.4 + "px",
          "border-width": borderWidth + "px",
          "border-style": "solid",
        },
      };
    };

    const buildPlayerNameLayout = (color: Color): PlayerName => {
      const displayColor = this.config.flip ? reverseColor(color) : color;
      const params = compactViewParams.playerName[displayColor];
      return {
        style: {
          left: params.x * ratio + "px",
          top: params.y * ratio + "px",
          width: compactViewParams.playerName.width * ratio + "px",
          height: compactViewParams.playerName.height * ratio + "px",
          "font-size": compactViewParams.playerName.fontSize * ratio + "px",
        },
      };
    };

    return {
      ratio,
      frame: buildFrameLayout(),
      boardStyle: {
        left: compactViewParams.board.x * ratio + "px",
        top: compactViewParams.board.y * ratio + "px",
      },
      blackHandStyle: {
        left: compactViewParams.hand.black.x * ratio + "px",
        top: compactViewParams.hand.black.y * ratio + "px",
      },
      whiteHandStyle: {
        left: compactViewParams.hand.white.x * ratio + "px",
        top: compactViewParams.hand.white.y * ratio + "px",
      },
      turn: buildTurnLayout(),
      blackPlayerName: buildPlayerNameLayout(Color.BLACK),
      whitePlayerName: buildPlayerNameLayout(Color.WHITE),
    };
  }
}
