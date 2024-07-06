import { PlayerSettings } from "@/common/settings/player";
import { humanPlayer } from "./human";
import { Player, SearchInfo } from "./player";
import { USIPlayer } from "./usi";
import * as uri from "@/common/uri";

export interface PlayerBuilder {
  build(playerSettings: PlayerSettings, onSearchInfo?: (info: SearchInfo) => void): Promise<Player>;
}

export function defaultPlayerBuilder(engineTimeoutSeconds?: number): PlayerBuilder {
  return {
    async build(
      playerSettings: PlayerSettings,
      onSearchInfo?: (info: SearchInfo) => void,
    ): Promise<Player> {
      if (playerSettings.uri === uri.ES_HUMAN) {
        return humanPlayer;
      } else if (uri.isUSIEngine(playerSettings.uri) && playerSettings.usi) {
        const player = new USIPlayer(playerSettings.usi, engineTimeoutSeconds ?? 10, onSearchInfo);
        await player.launch();
        return player;
      }
      throw new Error(
        "defaultPlayerBuilder#build: 予期せぬプレイヤーURIです: " + playerSettings.uri,
      );
    },
  };
}
