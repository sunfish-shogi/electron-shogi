import * as uri from "@/uri";
import { PlayerSetting } from "./player";

export type CSAServerSetting = {
  host: string;
  port: number;
  id: string;
  password: string;
};

export type CSAGameSetting = {
  player: PlayerSetting;
  server: CSAServerSetting;
  autoFlip: boolean;
  enableComment: boolean;
  enableAutoSave: boolean;
};

export function defaultCSAServerSetting(): CSAServerSetting {
  return {
    host: "localhost",
    port: 4081,
    id: "",
    password: "",
  };
}

export function defaultCSAGameSetting(): CSAGameSetting {
  return {
    player: {
      name: "人",
      uri: uri.ES_HUMAN,
    },
    server: defaultCSAServerSetting(),
    autoFlip: true,
    enableComment: true,
    enableAutoSave: true,
  };
}

export function validateCSAGameSetting(
  csaGameSetting: CSAGameSetting
): Error | undefined {
  if (csaGameSetting.server.host === "") {
    return new Error("ホスト名が空です。");
  }
  if (csaGameSetting.server.port < 0 || csaGameSetting.server.port > 65535) {
    return new Error("無効なポート番号です。");
  }
  if (csaGameSetting.server.id === "") {
    return new Error("IDが空です。");
  }
  return;
}

export type CSAGameSettingHistory = {
  player: PlayerSetting;
  serverHistory: CSAServerSetting[];
  autoFlip: boolean;
  enableComment: boolean;
  enableAutoSave: boolean;
};

export function defaultCSAGameSettingHistory(): CSAGameSettingHistory {
  return {
    player: {
      name: "人",
      uri: uri.ES_HUMAN,
    },
    serverHistory: [],
    autoFlip: true,
    enableComment: true,
    enableAutoSave: true,
  };
}

export function buildCSAGameSettingByHistory(
  history: CSAGameSettingHistory,
  index: number
): CSAGameSetting {
  return {
    player: history.player,
    server:
      history.serverHistory?.length > index
        ? history.serverHistory[index]
        : defaultCSAServerSetting(),
    autoFlip: history.autoFlip,
    enableComment: history.enableComment,
    enableAutoSave: history.enableAutoSave,
  };
}

export const maxServerHistoryLenght = 10;

export function appendCSAGameSettingHistory(
  history: CSAGameSettingHistory,
  setting: CSAGameSetting
): CSAGameSettingHistory {
  const newServerHistory = [setting.server];
  for (const server of history.serverHistory) {
    if (
      server.host !== setting.server.host ||
      server.port !== setting.server.port ||
      server.id !== setting.server.id ||
      server.password !== setting.server.password
    ) {
      newServerHistory.push(server);
    }
    if (newServerHistory.length === maxServerHistoryLenght) {
      break;
    }
  }
  return {
    player: setting.player,
    serverHistory: newServerHistory,
    autoFlip: setting.autoFlip,
    enableComment: setting.enableComment,
    enableAutoSave: setting.enableAutoSave,
  };
}

export type SecureCSAServerSetting = {
  host: string;
  port: number;
  id: string;
  encryptedPassword: string;
};

export type SecureCSAGameSettingHistory = {
  player: PlayerSetting;
  serverHistory: SecureCSAServerSetting[];
  autoFlip: boolean;
  enableComment: boolean;
  enableAutoSave: boolean;
};

export function defaultSecureCSAGameSettingHistory(): SecureCSAGameSettingHistory {
  return {
    player: {
      name: "人",
      uri: uri.ES_HUMAN,
    },
    serverHistory: [],
    autoFlip: true,
    enableComment: true,
    enableAutoSave: true,
  };
}

export function encryptCSAGameSettingHistory(
  history: CSAGameSettingHistory,
  encryptor: (plainText: string) => string
): SecureCSAGameSettingHistory {
  const serverHistory = [];
  for (const setting of history.serverHistory) {
    serverHistory.push({
      host: setting.host,
      port: setting.port,
      id: setting.id,
      encryptedPassword: encryptor(setting.password),
    });
  }
  return {
    player: history.player,
    serverHistory: serverHistory,
    autoFlip: history.autoFlip,
    enableComment: history.enableComment,
    enableAutoSave: history.enableAutoSave,
  };
}

export function decryptCSAGameSettingHistory(
  history: SecureCSAGameSettingHistory,
  decryptor: (encrypted: string) => string
): CSAGameSettingHistory {
  const serverHistory = [];
  for (const setting of history.serverHistory) {
    serverHistory.push({
      host: setting.host,
      port: setting.port,
      id: setting.id,
      password: decryptor(setting.encryptedPassword),
    });
  }
  return {
    player: history.player,
    serverHistory: serverHistory,
    autoFlip: history.autoFlip,
    enableComment: history.enableComment,
    enableAutoSave: history.enableAutoSave,
  };
}
