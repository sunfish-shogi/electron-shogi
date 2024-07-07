import { defaultPlayerBuilder } from "@/renderer/players/builder";
import { HumanPlayer } from "@/renderer/players/human";
import { USIPlayer } from "@/renderer/players/usi";
import api, { API } from "@/renderer/ipc/api";
import * as uri from "@/common/uri";
import { Mocked } from "vitest";

vi.mock("@/renderer/ipc/api");

const mockAPI = api as Mocked<API>;

describe("builder", () => {
  it("human", async () => {
    const player = await defaultPlayerBuilder().build({
      name: "人",
      uri: uri.ES_HUMAN,
    });
    expect(player).toBeInstanceOf(HumanPlayer);
  });

  it("usi", async () => {
    mockAPI.usiLaunch.mockResolvedValue(123);
    const settings = {
      name: "USI Engine",
      uri: "es://usi-engine/test",
      usi: {
        uri: "es://usi-engine/test",
        name: "Engine Test",
        defaultName: "engine-test",
        author: "author-test",
        path: "path-test",
        options: {},
        labels: {},
        enableEarlyPonder: false,
      },
    };
    const player = await defaultPlayerBuilder().build(settings);
    expect(player).toBeInstanceOf(USIPlayer);
    expect(mockAPI.usiLaunch).toBeCalledWith(settings.usi, 10);
  });
});
