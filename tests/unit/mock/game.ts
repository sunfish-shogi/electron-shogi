import { GameSetting } from "@/settings/game";

export const playerURI01 = "es://usi/test-engine-01";
export const playerURI02 = "es://usi/test-engine-02";

const blackPlayerSetting = {
  name: "USI Engine 01",
  uri: playerURI01,
  usi: {
    uri: playerURI01,
    name: "my usi engine 01",
    defaultName: "engine 01",
    author: "author01",
    path: "/engines/engines01",
    options: {},
  },
};

const whitePlayerSetting02 = {
  name: "USI Engine 02",
  uri: playerURI02,
  usi: {
    uri: playerURI02,
    name: "my usi engine 02",
    defaultName: "engine 02",
    author: "author02",
    path: "/engines/engines02",
    options: {},
  },
};

export const gameSetting10m30s: GameSetting = {
  black: blackPlayerSetting,
  white: whitePlayerSetting02,
  timeLimit: {
    timeSeconds: 600,
    byoyomi: 30,
    increment: 0,
  },
  enableEngineTimeout: false,
  humanIsFront: false,
  enableComment: true,
};
