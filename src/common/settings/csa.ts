import * as uri from "@/common/uri";
import { PlayerSetting, defaultPlayerSetting, validatePlayerSetting } from "./player";
import { t } from "@/common/i18n";
import {
  USIEngineSettingForCLI,
  exportUSIEngineSettingForCLI,
  importUSIEngineSettingForCLI,
} from "./usi";
import { RecordFileFormat } from "@/common/file/record";
import { AppSetting } from "./app";

export enum CSAProtocolVersion {
  V121 = "v121",
  V121_FLOODGATE = "v121_floodgate",
  V121_X1 = "v121_x1",
}

export type TCPKeepaliveSetting = {
  initialDelay: number;
};

export type BlankLinePingSetting = {
  initialDelay: number;
  interval: number;
};

export type CSAServerSetting = {
  protocolVersion: CSAProtocolVersion;
  host: string;
  port: number;
  id: string;
  password: string;
  tcpKeepalive: TCPKeepaliveSetting;
  blankLinePing?: BlankLinePingSetting;
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
    tcpKeepalive: {
      initialDelay: 10,
    },
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

export function validateCSAServerSetting(setting: CSAServerSetting): Error | undefined {
  if (
    setting.protocolVersion !== CSAProtocolVersion.V121 &&
    setting.protocolVersion !== CSAProtocolVersion.V121_FLOODGATE &&
    setting.protocolVersion !== CSAProtocolVersion.V121_X1
  ) {
    return new Error(t.protocolVersionNotSelected);
  }
  if (setting.host === "") {
    return new Error(t.hostNameIsEmpty);
  }
  if (setting.port < 0 || setting.port > 65535) {
    return new Error(t.invalidPortNumber);
  }
  if (setting.id === "") {
    return new Error(t.idIsEmpty);
  }
  if (setting.id.indexOf(" ") >= 0) {
    return new Error(t.idContainsSpace);
  }
  if (setting.password.indexOf(" ") >= 0) {
    return new Error(t.passwordContainsSpace);
  }
  if (setting.tcpKeepalive.initialDelay <= 0) {
    return new Error(t.tcpKeepaliveInitialDelayMustBePositive);
  }
  if (setting.blankLinePing) {
    if (setting.blankLinePing.initialDelay < 30) {
      return new Error(t.blankLinePingInitialDelayMustBeGreaterThanOrEqualTo30);
    }
    if (setting.blankLinePing.interval < 30) {
      return new Error(t.blankLinePingIntervalMustBeGreaterThanOrEqualTo30);
    }
  }
}

export function validateCSAGameSetting(setting: CSAGameSetting): Error | undefined {
  const playerError = validatePlayerSetting(setting.player);
  if (playerError) {
    return playerError;
  }

  const serverError = validateCSAServerSetting(setting.server);
  if (serverError) {
    return serverError;
  }
  if (
    setting.server.protocolVersion !== CSAProtocolVersion.V121 &&
    setting.server.protocolVersion !== CSAProtocolVersion.V121_FLOODGATE
  ) {
    return new Error("protocolVersion must be v121 or v121_floodgate");
  }

  if (!Number.isInteger(setting.repeat) || setting.repeat < 1) {
    return new Error("repeat must be a positive integer");
  }
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
      server.password !== setting.server.password ||
      server.tcpKeepalive.initialDelay !== setting.server.tcpKeepalive.initialDelay ||
      !server.blankLinePing !== !setting.server.blankLinePing ||
      server.blankLinePing?.initialDelay !== setting.server.blankLinePing?.initialDelay ||
      server.blankLinePing?.interval !== setting.server.blankLinePing?.interval
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
  tcpKeepalive: TCPKeepaliveSetting;
  blankLinePing?: BlankLinePingSetting;
};

export function emptySecureCSAServerSetting(): SecureCSAServerSetting {
  return {
    protocolVersion: CSAProtocolVersion.V121,
    host: "",
    port: 0,
    id: "",
    tcpKeepalive: {
      initialDelay: 10,
    },
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
      tcpKeepalive: setting.tcpKeepalive,
    } as SecureCSAServerSetting;
    if (setting.blankLinePing) {
      entry.blankLinePing = setting.blankLinePing;
    }
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
    const entry = {
      protocolVersion: setting.protocolVersion,
      host: setting.host,
      port: setting.port,
      id: setting.id,
      password:
        decryptor && setting.encryptedPassword
          ? decryptor(setting.encryptedPassword)
          : setting.password || "",
      tcpKeepalive: setting.tcpKeepalive,
    } as CSAServerSetting;
    if (setting.blankLinePing) {
      entry.blankLinePing = setting.blankLinePing;
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

export type CSAGameSettingForCLI = {
  usi: USIEngineSettingForCLI;
  server: CSAServerSetting;
  saveRecordFile: boolean;
  enableComment: boolean;
  recordFileNameTemplate?: string;
  recordFileFormat?: RecordFileFormat;
  repeat: number;
  autoRelogin: boolean;
  restartPlayerEveryGame: boolean;
};

export function exportCSAGameSettingForCLI(
  setting: CSAGameSetting,
  appSetting: AppSetting,
): CSAGameSettingForCLI | Error {
  if (!uri.isUSIEngine(setting.player.uri) || !setting.player.usi) {
    return new Error("player must be USI engine.");
  }
  return {
    usi: exportUSIEngineSettingForCLI(setting.player.usi),
    server: setting.server,
    saveRecordFile: setting.enableAutoSave,
    enableComment: setting.enableComment,
    recordFileNameTemplate: appSetting.recordFileNameTemplate,
    recordFileFormat: appSetting.defaultRecordFileFormat,
    repeat: setting.repeat,
    autoRelogin: setting.autoRelogin,
    restartPlayerEveryGame: setting.restartPlayerEveryGame,
  };
}

export function importCSAGameSettingForCLI(
  setting: CSAGameSettingForCLI,
  playerURI?: string,
): CSAGameSetting {
  const usi = importUSIEngineSettingForCLI(setting.usi, playerURI);
  return {
    player: {
      name: setting.usi.name,
      uri: usi.uri,
      usi,
    },
    server: setting.server,
    autoFlip: true,
    enableComment: setting.enableComment,
    enableAutoSave: setting.saveRecordFile,
    repeat: setting.repeat,
    autoRelogin: setting.autoRelogin,
    restartPlayerEveryGame: setting.restartPlayerEveryGame,
  };
}
