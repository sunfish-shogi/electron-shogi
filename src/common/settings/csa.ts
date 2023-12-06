import * as uri from "@/common/uri";
import { PlayerSetting, defaultPlayerSetting } from "./player";
import { t } from "@/common/i18n";

export enum CSAProtocolVersion {
  V121 = "v121",
  V121_FLOODGATE = "v121_floodgate",
}

export type CSAServerSetting = {
  protocolVersion: CSAProtocolVersion;
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
  repeat: number;
  autoRelogin: boolean;
  restartPlayerEveryGame: boolean;
};

export function defaultCSAServerSetting(): CSAServerSetting {
  return {
    protocolVersion: CSAProtocolVersion.V121,
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
    repeat: 1,
    autoRelogin: true,
    restartPlayerEveryGame: false,
  };
}

export function validateCSAGameSetting(csaGameSetting: CSAGameSetting): Error | undefined {
  if (
    csaGameSetting.server.protocolVersion !== CSAProtocolVersion.V121 &&
    csaGameSetting.server.protocolVersion !== CSAProtocolVersion.V121_FLOODGATE
  ) {
    return new Error(t.protocolVersionNotSelected);
  }
  if (csaGameSetting.server.host === "") {
    return new Error(t.hostNameIsEmpty);
  }
  if (csaGameSetting.server.port < 0 || csaGameSetting.server.port > 65535) {
    return new Error(t.invalidPortNumber);
  }
  if (csaGameSetting.server.id === "") {
    return new Error(t.idIsEmpty);
  }
  return;
}

export type CSAGameSettingHistory = {
  player: PlayerSetting;
  serverHistory: CSAServerSetting[];
  autoFlip: boolean;
  enableComment: boolean;
  enableAutoSave: boolean;
  repeat: number;
  autoRelogin: boolean;
  restartPlayerEveryGame: boolean;
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
    repeat: 1,
    autoRelogin: true,
    restartPlayerEveryGame: false,
  };
}

export function buildCSAGameSettingByHistory(
  history: CSAGameSettingHistory,
  index: number,
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
    repeat: history.repeat,
    autoRelogin: history.autoRelogin,
    restartPlayerEveryGame: history.restartPlayerEveryGame,
  };
}

export const maxServerHistoryLength = 10;

export function appendCSAGameSettingHistory(
  history: CSAGameSettingHistory,
  setting: CSAGameSetting,
): CSAGameSettingHistory {
  const newServerHistory = [setting.server];
  for (const server of history.serverHistory) {
    if (
      server.protocolVersion !== setting.server.protocolVersion ||
      server.host !== setting.server.host ||
      server.port !== setting.server.port ||
      server.id !== setting.server.id ||
      server.password !== setting.server.password
    ) {
      newServerHistory.push(server);
    }
    if (newServerHistory.length === maxServerHistoryLength) {
      break;
    }
  }
  return {
    player: setting.player,
    serverHistory: newServerHistory,
    autoFlip: setting.autoFlip,
    enableComment: setting.enableComment,
    enableAutoSave: setting.enableAutoSave,
    repeat: setting.repeat,
    autoRelogin: setting.autoRelogin,
    restartPlayerEveryGame: setting.restartPlayerEveryGame,
  };
}

export type SecureCSAServerSetting = {
  protocolVersion: CSAProtocolVersion;
  host: string;
  port: number;
  id: string;
  encryptedPassword?: string;
  password?: string;
};

export function emptySecureCSAServerSetting(): SecureCSAServerSetting {
  return {
    protocolVersion: CSAProtocolVersion.V121,
    host: "",
    port: 0,
    id: "",
  };
}

export type SecureCSAGameSettingHistory = {
  player: PlayerSetting;
  serverHistory: SecureCSAServerSetting[];
  autoFlip: boolean;
  enableComment: boolean;
  enableAutoSave: boolean;
  repeat: number;
  autoRelogin: boolean;
  restartPlayerEveryGame: boolean;
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
    repeat: 1,
    autoRelogin: true,
    restartPlayerEveryGame: false,
  };
}

export function normalizeSecureCSAGameSettingHistory(
  history: SecureCSAGameSettingHistory,
): SecureCSAGameSettingHistory {
  const serverHistory = [] as SecureCSAServerSetting[];
  for (const setting of history.serverHistory) {
    serverHistory.push({
      ...emptySecureCSAServerSetting(),
      ...setting,
    });
  }
  return {
    ...defaultSecureCSAGameSettingHistory(),
    ...history,
    player: {
      ...defaultPlayerSetting(),
      ...history.player,
    },
    serverHistory: serverHistory,
  };
}

export function encryptCSAGameSettingHistory(
  history: CSAGameSettingHistory,
  encryptor?: (plainText: string) => string,
): SecureCSAGameSettingHistory {
  const serverHistory = [] as SecureCSAServerSetting[];
  for (const setting of history.serverHistory) {
    const entry = {
      protocolVersion: setting.protocolVersion,
      host: setting.host,
      port: setting.port,
      id: setting.id,
    } as SecureCSAServerSetting;
    if (encryptor) {
      entry.encryptedPassword = encryptor(setting.password);
    } else {
      entry.password = setting.password;
    }
    serverHistory.push(entry);
  }
  return {
    player: history.player,
    serverHistory: serverHistory,
    autoFlip: history.autoFlip,
    enableComment: history.enableComment,
    enableAutoSave: history.enableAutoSave,
    repeat: history.repeat,
    autoRelogin: history.autoRelogin,
    restartPlayerEveryGame: history.restartPlayerEveryGame,
  };
}

export function decryptCSAGameSettingHistory(
  history: SecureCSAGameSettingHistory,
  decryptor?: (encrypted: string) => string,
): CSAGameSettingHistory {
  const serverHistory = [] as CSAServerSetting[];
  for (const setting of history.serverHistory) {
    serverHistory.push({
      protocolVersion: setting.protocolVersion,
      host: setting.host,
      port: setting.port,
      id: setting.id,
      password:
        decryptor && setting.encryptedPassword
          ? decryptor(setting.encryptedPassword)
          : setting.password || "",
    });
  }
  return {
    player: history.player,
    serverHistory: serverHistory,
    autoFlip: history.autoFlip,
    enableComment: history.enableComment,
    enableAutoSave: history.enableAutoSave,
    repeat: history.repeat,
    autoRelogin: history.autoRelogin,
    restartPlayerEveryGame: history.restartPlayerEveryGame,
  };
}
