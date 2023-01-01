import { PlayerSetting } from "@/common/settings/player";
import { humanPlayer } from "./human";
import { Player, SearchInfo } from "./player";
import { USIPlayer } from "./usi";
import * as uri from "@/common/uri";

export interface PlayerBuilder {
  build(
    playerSetting: PlayerSetting,
    onSearchInfo?: (info: SearchInfo) => void
  ): Promise<Player>;
}

export function defaultPlayerBuilder(
  engineTimeoutSeconds?: number
): PlayerBuilder {
  return {
    async build(
      playerSetting: PlayerSetting,
      onSearchInfo?: (info: SearchInfo) => void
    ): Promise<Player> {
      if (playerSetting.uri === uri.ES_HUMAN) {
        return humanPlayer;
      } else if (uri.isUSIEngine(playerSetting.uri) && playerSetting.usi) {
        const player = new USIPlayer(
          playerSetting.usi,
          engineTimeoutSeconds ?? 10,
          onSearchInfo
        );
        await player.launch();
        return player;
      }
      throw new Error(
        "defaultPlayerBuilder#build: 予期せぬプレイヤーURIです: " +
          playerSetting.uri
      );
    },
  };
}
