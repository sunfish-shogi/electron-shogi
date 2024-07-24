import { Color, ImmutablePosition, reverseColor } from "tsshogi";
import { RectSize } from "@/common/assets/geometry";
import { standardViewParams } from "./params";
import { Config } from "./config";
import { Clock, Control, Frame, Layout, PlayerName, Turn } from "./layout";

export class StandardLayoutBuilder {
  constructor(private config: Config) {}

  build(position: ImmutablePosition): Layout {
    let ratio = this.config.upperSizeLimit.width / standardViewParams.frame.width;
    if (standardViewParams.frame.height * ratio > this.config.upperSizeLimit.height) {
      ratio = this.config.upperSizeLimit.height / standardViewParams.frame.height;
    }

    const buildFrameLayout = (): Frame => {
      const height = standardViewParams.frame.height * ratio;
      const width = standardViewParams.frame.width * ratio;
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
      const params = standardViewParams.turn[displayColor];
      const x = params.x;
      const y = this.config.hideClock ? params.y2 : params.y;
      return {
        style: {
          left: x * ratio - borderWidth + "px",
          top: y * ratio - borderWidth + "px",
          width: standardViewParams.turn.width * ratio - borderWidth + "px",
          height: standardViewParams.turn.height * ratio - borderWidth + "px",
          "font-size": standardViewParams.turn.fontSize * ratio + "px",
          "border-radius": standardViewParams.turn.height * ratio * 0.4 + "px",
          "border-width": borderWidth + "px",
          "border-style": "solid",
        },
      };
    };

    const buildPlayerNameLayout = (color: Color): PlayerName => {
      const displayColor = this.config.flip ? reverseColor(color) : color;
      const params = standardViewParams.playerName[displayColor];
      const x = params.x;
      const y = this.config.hideClock ? params.y2 : params.y;
      return {
        style: {
          left: x * ratio + "px",
          top: y * ratio + "px",
          width: standardViewParams.playerName.width * ratio + "px",
          height: standardViewParams.playerName.height * ratio + "px",
          "font-size": standardViewParams.playerName.fontSize * ratio + "px",
        },
      };
    };

    const buildClockLayout = (color: Color): Clock => {
      const displayColor = this.config.flip ? reverseColor(color) : color;
      return {
        style: {
          left: standardViewParams.clock[displayColor].x * ratio + "px",
          top: standardViewParams.clock[displayColor].y * ratio + "px",
          width: standardViewParams.clock.width * ratio + "px",
          height: standardViewParams.clock.height * ratio + "px",
          "font-size": standardViewParams.clock.fontSize * ratio + "px",
        },
      };
    };

    const buildControlLayout = (): Control => {
      return {
        left: {
          style: {
            left: standardViewParams.control.left.x * ratio + "px",
            top: standardViewParams.control.left.y * ratio + "px",
            width: standardViewParams.control.left.width * ratio + "px",
            height: standardViewParams.control.left.height * ratio + "px",
            "font-size": standardViewParams.control.left.fontSize * ratio + "px",
          },
        },
        right: {
          style: {
            left: standardViewParams.control.right.x * ratio + "px",
            top: standardViewParams.control.right.y * ratio + "px",
            width: standardViewParams.control.right.width * ratio + "px",
            height: standardViewParams.control.right.height * ratio + "px",
            "font-size": standardViewParams.control.right.fontSize * ratio + "px",
          },
        },
      };
    };

    return {
      ratio,
      frame: buildFrameLayout(),
      boardStyle: {
        left: standardViewParams.board.x * ratio + "px",
        top: standardViewParams.board.y * ratio + "px",
      },
      blackHandStyle: {
        left: standardViewParams.hand.black.x * ratio + "px",
        top: standardViewParams.hand.black.y * ratio + "px",
      },
      whiteHandStyle: {
        left: standardViewParams.hand.white.x * ratio + "px",
        top: standardViewParams.hand.white.y * ratio + "px",
      },
      turn: buildTurnLayout(),
      blackPlayerName: buildPlayerNameLayout(Color.BLACK),
      whitePlayerName: buildPlayerNameLayout(Color.WHITE),
      blackClock: this.config.hideClock ? undefined : buildClockLayout(Color.BLACK),
      whiteClock: this.config.hideClock ? undefined : buildClockLayout(Color.WHITE),
      control: buildControlLayout(),
    };
  }
}
