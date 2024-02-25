import { RecordFileFormat } from "@/common/file/record";
import { CSAGameSummary } from "@/common/game/csa";
import {
  CSAGameSetting,
  CSAGameSettingForCLI,
  CSAGameSettingHistory,
  CSAProtocolVersion,
  CSAServerSetting,
} from "@/common/settings/csa";
import { PlayerSetting } from "@/common/settings/player";
import { defaultRecordFileNameTemplate } from "@/renderer/helpers/path";
import { Color } from "electron-shogi-core";

export const playerURI = "es://usi-engine/test-engine";

const playerSetting: PlayerSetting = {
  name: "my usi engine",
  uri: playerURI,
  usi: {
    uri: playerURI,
    name: "my usi engine",
    defaultName: "engine",
    author: "author01",
    path: "/path/to/engine",
    options: {
      USI_Ponder: {
        name: "USI_Ponder",
        type: "check",
        order: 1,
        default: "true",
        value: "false",
        vars: [],
      },
      USI_Hash: {
        name: "USI_Hash",
        type: "spin",
        order: 2,
        min: 32,
        default: 256,
        value: 1024,
        vars: [],
      },
      BookFile: {
        name: "BookFile",
        type: "string",
        order: 3,
        default: "book.db",
        value: "path/to/book.db",
        vars: [],
      },
    },
    labels: {},
    enableEarlyPonder: false,
  },
};

export const csaServerSetting: CSAServerSetting = {
  protocolVersion: CSAProtocolVersion.V121,
  host: "test-server",
  port: 4081,
  id: "TestPlayer",
  password: "test-password",
  tcpKeepalive: { initialDelay: 10 },
};

export const csaGameSetting: CSAGameSetting = {
  player: playerSetting,
  server: csaServerSetting,
  autoFlip: true,
  enableComment: true,
  enableAutoSave: true,
  repeat: 1,
  autoRelogin: true,
  restartPlayerEveryGame: false,
};

export const emptyCSAGameSettingHistory: CSAGameSettingHistory = {
  player: playerSetting,
  serverHistory: [],
  autoFlip: true,
  enableComment: true,
  enableAutoSave: true,
  repeat: 1,
  autoRelogin: true,
  restartPlayerEveryGame: false,
};

export const singleCSAGameSettingHistory: CSAGameSettingHistory = {
  player: playerSetting,
  serverHistory: [
    {
      protocolVersion: CSAProtocolVersion.V121,
      host: "test-server",
      port: 4081,
      id: "TestPlayer",
      password: "test-password",
      tcpKeepalive: { initialDelay: 10 },
    },
  ],
  autoFlip: true,
  enableComment: true,
  enableAutoSave: true,
  repeat: 1,
  autoRelogin: true,
  restartPlayerEveryGame: false,
};

const initialPosition = `\
P1-KY-KE-GI-KI-OU-KI-GI-KE-KY
P2 * -HI *  *  *  *  * -KA * 
P3-FU-FU-FU-FU-FU-FU-FU-FU-FU
P4 *  *  *  *  *  *  *  *  * 
P5 *  *  *  *  *  *  *  *  * 
P6 *  *  *  *  *  *  *  *  * 
P7+FU+FU+FU+FU+FU+FU+FU+FU+FU
P8 * +KA *  *  *  *  * +HI * 
P9+KY+KE+GI+KI+OU+KI+GI+KE+KY
P+
P-
+`;

export const csaGameSummary: CSAGameSummary = {
  id: "test-game",
  blackPlayerName: "me",
  whitePlayerName: "enemy",
  myColor: Color.BLACK,
  toMove: Color.BLACK,
  position: initialPosition,
  timeUnitMs: 1000,
  totalTime: 600,
  byoyomi: 30,
  delay: 0,
  increment: 0,
};

const invalidPosition = `+2726FU,T12`;

export const csaGameSummaryInvalidPosition: CSAGameSummary = {
  id: "test-game",
  blackPlayerName: "me",
  whitePlayerName: "enemy",
  myColor: Color.BLACK,
  toMove: Color.BLACK,
  position: invalidPosition,
  timeUnitMs: 1000,
  totalTime: 600,
  byoyomi: 30,
  delay: 0,
  increment: 0,
};

export const csaGameSettingForCLI: CSAGameSettingForCLI = {
  usi: {
    name: "my usi engine",
    path: "/path/to/engine",
    options: {
      USI_Ponder: { type: "check", value: false },
      USI_Hash: { type: "spin", value: 1024 },
      BookFile: { type: "string", value: "path/to/book.db" },
    },
    enableEarlyPonder: false,
  },
  server: csaServerSetting,
  saveRecordFile: true,
  enableComment: true,
  recordFileNameTemplate: defaultRecordFileNameTemplate,
  recordFileFormat: RecordFileFormat.KIF,
  repeat: 1,
  autoRelogin: true,
  restartPlayerEveryGame: false,
};
