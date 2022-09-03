import { PlayerSetting } from "@/settings/player";
import { humanPlayer } from "./human";
import { Player } from "./player";
import { USIPlayer } from "./usi";
import * as uri from "@/uri";

export interface PlayerBuilder {
  build(playerSetting: PlayerSetting): Promise<Player>;
}

export const defaultPlayerBuilder: PlayerBuilder = {
  async build(playerSetting: PlayerSetting): Promise<Player> {
    if (playerSetting.uri === uri.ES_HUMAN) {
      return humanPlayer;
    } else if (uri.isUSIEngine(playerSetting.uri) && playerSetting.usi) {
      const player = new USIPlayer(playerSetting.usi);
      await player.launch();
      return player;
    }
    throw new Error(
      "defaultPlayerBuilder#build: 予期せぬプレイヤーURIです: " +
        playerSetting.uri
    );
  },
};
