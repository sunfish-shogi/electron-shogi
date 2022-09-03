import * as uri from "@/uri";
import {
  appendCSAGameSettingHistory,
  decryptCSAGameSettingHistory,
  encryptCSAGameSettingHistory,
  validateCSAGameSetting,
} from "@/settings/csa";
import { csaGameSetting, emptyCSAGameSettingHistory } from "../mock/csa";

describe("settings/csa", () => {
  it("validate/noError", () => {
    const result = validateCSAGameSetting({
      player: {
        name: "人",
        uri: uri.ES_HUMAN,
      },
      server: {
        host: "localhost",
        port: 4081,
        id: "TestUser",
        password: "test0123",
      },
      autoFlip: true,
      enableComment: true,
    });
    expect(result).toBeUndefined();
  });

  it("validate/noHost", () => {
    const result = validateCSAGameSetting({
      player: {
        name: "人",
        uri: uri.ES_HUMAN,
      },
      server: {
        host: "",
        port: 4081,
        id: "TestUser",
        password: "test0123",
      },
      autoFlip: true,
      enableComment: true,
    });
    expect(result).toBeInstanceOf(Error);
  });

  it("validate/invalidPortNumber", () => {
    const result = validateCSAGameSetting({
      player: {
        name: "人",
        uri: uri.ES_HUMAN,
      },
      server: {
        host: "localhost",
        port: 100000,
        id: "TestUser",
        password: "test0123",
      },
      autoFlip: true,
      enableComment: true,
    });
    expect(result).toBeInstanceOf(Error);
  });

  it("validate/noID", () => {
    const result = validateCSAGameSetting({
      player: {
        name: "人",
        uri: uri.ES_HUMAN,
      },
      server: {
        host: "localhost",
        port: 4081,
        id: "",
        password: "test0123",
      },
      autoFlip: true,
      enableComment: true,
    });
    expect(result).toBeInstanceOf(Error);
  });

  it("appendCSAGameSettingHistory", () => {
    const buildSetting = (n: number) => {
      return {
        player: {
          name: `Player ${n}`,
          uri: uri.ES_HUMAN,
        },
        server: {
          ...csaGameSetting.server,
          id: `TestPlayer${n}`,
        },
        autoFlip: true,
        enableComment: true,
      };
    };
    let history = emptyCSAGameSettingHistory;
    // 異なる設定を追加している間は件数が増える。
    for (let i = 0; i < 5; i++) {
      expect(history.serverHistory).toHaveLength(i);
      history = appendCSAGameSettingHistory(history, buildSetting(i));
      expect(history.player.name).toBe(`Player ${i}`);
    }
    expect(history.serverHistory[0].id).toBe("TestPlayer4");
    expect(history.serverHistory[1].id).toBe("TestPlayer3");
    expect(history.serverHistory[2].id).toBe("TestPlayer2");
    expect(history.serverHistory[3].id).toBe("TestPlayer1");
    expect(history.serverHistory[4].id).toBe("TestPlayer0");
    // 重複する設定を追加すると順序のみが入れ替わる。
    history = appendCSAGameSettingHistory(history, buildSetting(2));
    expect(history.serverHistory).toHaveLength(5);
    expect(history.serverHistory[0].id).toBe("TestPlayer2");
    expect(history.serverHistory[1].id).toBe("TestPlayer4");
    expect(history.serverHistory[2].id).toBe("TestPlayer3");
    expect(history.serverHistory[3].id).toBe("TestPlayer1");
    expect(history.serverHistory[4].id).toBe("TestPlayer0");
    // 異なる設定を追加している間は件数が増える。
    for (let i = 5; i < 10; i++) {
      expect(history.serverHistory).toHaveLength(i);
      history = appendCSAGameSettingHistory(history, buildSetting(i));
      expect(history.player.name).toBe(`Player ${i}`);
    }
    // 上限を超えると古いものが削除される。
    history = appendCSAGameSettingHistory(history, buildSetting(10));
    expect(history.serverHistory).toHaveLength(10);
    expect(history.serverHistory[0].id).toBe("TestPlayer10");
    expect(history.serverHistory[9].id).toBe("TestPlayer1");
  });

  it("encrypt", () => {
    const raw = {
      player: {
        name: "人",
        uri: uri.ES_HUMAN,
      },
      serverHistory: [
        {
          host: "test-server01",
          port: 4081,
          id: "user01",
          password: "test01",
        },
        {
          host: "test-server02",
          port: 4081,
          id: "user02",
          password: "test02",
        },
      ],
      autoFlip: true,
      enableComment: true,
    };
    const secure = encryptCSAGameSettingHistory(raw, (src) => {
      return (
        {
          test01: "xyz01",
          test02: "xyz02",
        }[src] || ""
      );
    });
    expect(secure).toStrictEqual({
      ...raw,
      serverHistory: [
        {
          host: "test-server01",
          port: 4081,
          id: "user01",
          encryptedPassword: "xyz01",
        },
        {
          host: "test-server02",
          port: 4081,
          id: "user02",
          encryptedPassword: "xyz02",
        },
      ],
    });
  });

  it("decrypt", () => {
    const secure = {
      player: {
        name: "人",
        uri: uri.ES_HUMAN,
      },
      serverHistory: [
        {
          host: "test-server01",
          port: 4081,
          id: "user01",
          encryptedPassword: "xyz01",
        },
        {
          host: "test-server02",
          port: 4081,
          id: "user02",
          encryptedPassword: "xyz02",
        },
      ],
      autoFlip: true,
      enableComment: true,
    };
    const raw = decryptCSAGameSettingHistory(secure, (src) => {
      return (
        {
          xyz01: "test01",
          xyz02: "test02",
        }[src] || ""
      );
    });
    expect(raw).toStrictEqual({
      ...secure,
      serverHistory: [
        {
          host: "test-server01",
          port: 4081,
          id: "user01",
          password: "test01",
        },
        {
          host: "test-server02",
          port: 4081,
          id: "user02",
          password: "test02",
        },
      ],
    });
  });
});
