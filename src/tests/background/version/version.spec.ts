import { checkUpdates } from "@/background/version/check";
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { Releases, VersionStatus } from "@/background/version/types";
import { getAppPath } from "@/background/proc/env";
import * as electron from "@/background/helpers/electron";

const statusFilePath = path.join(getAppPath("userData"), "version.json");

const lastUpdatedMs = 1000000000;
const time23HoursAfter = lastUpdatedMs + 23 * 60 * 60 * 1000;
const time25HoursAfter = lastUpdatedMs + 25 * 60 * 60 * 1000;

function setup(param: {
  knownStable?: string;
  knownLatest?: string;
  stable: string;
  latest: string;
}) {
  if (param.knownStable && param.knownLatest) {
    const status: VersionStatus = {
      knownReleases: {
        stable: {
          version: param.knownStable,
          tag: `v${param.knownStable}`,
          link: "https://link/to/stable",
        },
        latest: {
          version: param.knownLatest,
          tag: `v${param.knownLatest}`,
          link: "https://link/to/latest",
        },
        downloadedMs: lastUpdatedMs,
      },
      updatedMs: lastUpdatedMs,
    };
    fs.writeFileSync(statusFilePath, JSON.stringify(status));
  }
  const releases: Releases = {
    stable: {
      version: param.stable,
      tag: `v${param.stable}`,
      link: "https://link/to/stable",
    },
    latest: {
      version: param.latest,
      tag: `v${param.latest}`,
      link: "https://link/to/latest",
    },
  };
  const server = {
    accessCount: 0,
    invalidCount: 0,
    close: () => {},
  };
  const s = http.createServer((req, res) => {
    if (req.url === "/release.json") {
      server.accessCount++;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(releases));
      return;
    }
    server.invalidCount++;
    res.writeHead(404);
    res.end("not found");
  });
  s.listen(6173);
  server.close = () => {
    s.close();
  };
  return server;
}

describe("version", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    fs.unlinkSync(statusFilePath);
  });

  it("no_status_file/patch_update/stable", async () => {
    const mockParam = {
      stable: "v1.0.4",
      latest: "v1.1.1",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.0.1");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(1);
      expect(spy.mock.calls[0][0]).toBe("Electron将棋");
      expect(spy.mock.calls[0][1]).toBe("安定版 v1.0.4 がリリースされました！");
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.0.4");
      expect(status.knownReleases?.latest.version).toBe("v1.1.1");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/patch_update/latest", async () => {
    const mockParam = {
      knownStable: "v1.0.3",
      knownLatest: "v1.1.0",
      stable: "v1.0.4",
      latest: "v1.1.1",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.1.0");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(1);
      expect(spy.mock.calls[0][0]).toBe("Electron将棋");
      expect(spy.mock.calls[0][1]).toBe("最新版 v1.1.1 がリリースされました！");
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.0.4");
      expect(status.knownReleases?.latest.version).toBe("v1.1.1");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/known_updates", async () => {
    const mockParam = {
      knownStable: "v1.0.4",
      knownLatest: "v1.1.1",
      stable: "v1.0.4",
      latest: "v1.1.1",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.0.1");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(0);
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.0.4");
      expect(status.knownReleases?.latest.version).toBe("v1.1.1");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/patch_update/alpha_installed", async () => {
    const mockParam = {
      knownStable: "v1.0.3",
      knownLatest: "v1.1.0",
      stable: "v1.0.4",
      latest: "v1.1.1",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.2.0-alpha.1");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(0);
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.0.4");
      expect(status.knownReleases?.latest.version).toBe("v1.1.1");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/skip_download", async () => {
    const mockParam = {
      knownStable: "v1.0.3",
      knownLatest: "v1.1.0",
      stable: "v1.0.4",
      latest: "v1.1.1",
    };
    vi.setSystemTime(time23HoursAfter);
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(0);
      expect(server.accessCount).toBe(0);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.0.3"); // not updated
      expect(status.knownReleases?.latest.version).toBe("v1.1.0"); // not updated
      expect(status.knownReleases?.downloadedMs).toBe(lastUpdatedMs); // not updated
      expect(status.updatedMs).toBe(time23HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/patch_update/only_stable", async () => {
    // 安定版が更新されたが最新版をインストールしているので通知しない。
    const mockParam = {
      knownStable: "v1.0.3",
      knownLatest: "v1.1.1",
      stable: "v1.0.4",
      latest: "v1.1.1",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.1.1");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(0);
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.0.4");
      expect(status.knownReleases?.latest.version).toBe("v1.1.1");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/patch_update/only_latest", async () => {
    // 最新版が更新されたが安定版をインストールしているので通知しない。
    const mockParam = {
      knownStable: "v1.0.3",
      knownLatest: "v1.1.1",
      stable: "v1.0.3",
      latest: "v1.1.2",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.0.2");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(0);
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.0.3");
      expect(status.knownReleases?.latest.version).toBe("v1.1.2");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/minor_update/stable", async () => {
    const mockParam = {
      knownStable: "v1.0.4",
      knownLatest: "v1.1.1",
      stable: "v1.1.1",
      latest: "v1.2.0",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.0.4");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(1);
      expect(spy.mock.calls[0][0]).toBe("Electron将棋");
      expect(spy.mock.calls[0][1]).toBe("安定版 v1.1.1 がリリースされました！");
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.1.1");
      expect(status.knownReleases?.latest.version).toBe("v1.2.0");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/minor_update/latest", async () => {
    const mockParam = {
      knownStable: "v1.0.4",
      knownLatest: "v1.1.1",
      stable: "v1.1.1",
      latest: "v1.2.0",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.1.1");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(1);
      expect(spy.mock.calls[0][0]).toBe("Electron将棋");
      expect(spy.mock.calls[0][1]).toBe("最新版 v1.2.0 がリリースされました！");
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.1.1");
      expect(status.knownReleases?.latest.version).toBe("v1.2.0");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });

  it("status_file_exists/minor_update/alpha_installed", async () => {
    const mockParam = {
      knownStable: "v1.0.3",
      knownLatest: "v1.1.1",
      stable: "v1.1.1",
      latest: "v1.2.0",
    };
    vi.setSystemTime(time25HoursAfter);
    vi.spyOn(electron, "getAppVersion").mockReturnValue("v1.2.0-alpha.1");
    const spy = vi.spyOn(electron, "showNotification").mockImplementation(() => {});
    const server = setup(mockParam);
    try {
      await checkUpdates();
      expect(spy.mock.calls).toHaveLength(1);
      expect(spy.mock.calls[0][0]).toBe("Electron将棋");
      expect(spy.mock.calls[0][1]).toBe("最新版 v1.2.0 がリリースされました！");
      expect(server.accessCount).toBe(1);
      expect(server.invalidCount).toBe(0);
      const status = JSON.parse(fs.readFileSync(statusFilePath, "utf8")) as VersionStatus;
      expect(status.knownReleases?.stable.version).toBe("v1.1.1");
      expect(status.knownReleases?.latest.version).toBe("v1.2.0");
      expect(status.knownReleases?.downloadedMs).toBe(time25HoursAfter);
      expect(status.updatedMs).toBe(time25HoursAfter);
    } finally {
      server.close();
    }
  });
});
