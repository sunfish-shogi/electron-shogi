import api, { API } from "@/renderer/ipc/api";
import { CommandType } from "@/common/advanced/command";
import { Store } from "@/renderer/prompt/store";
import { Mocked } from "vitest";
import { PromptTarget } from "@/common/advanced/prompt";

vi.mock("@/renderer/ipc/api");

const mockAPI = api as Mocked<API>;

describe("prompt/store", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        toString: () => "file://foo/bar/?target=csa&session=123&name=test-server%3A4081",
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("getters", () => {
    const store = new Store();
    expect(store.target).toBe(PromptTarget.CSA);
    expect(store.sessionID).toBe(123);
    expect(store.name).toBe("test-server:4081");
  });

  it("history", async () => {
    mockAPI.setupPrompt.mockResolvedValueOnce({
      discarded: 3,
      commands: [
        { id: 111, type: CommandType.SEND, command: "foo", timeMs: 100 },
        { id: 222, type: CommandType.RECEIVE, command: "bar", timeMs: 200 },
        { id: 333, type: CommandType.SEND, command: "baz", timeMs: 300 },
      ],
    });
    const store = new Store();
    await store.setup();
    expect(mockAPI.setupPrompt).nthCalledWith(1, PromptTarget.CSA, 123);

    vi.stubGlobal("Math", {
      random: vi.fn().mockReturnValue(0),
      floor: vi.fn().mockReturnValueOnce(444).mockReturnValueOnce(555).mockReturnValueOnce(666),
    });
    store.onCommand({ type: CommandType.RECEIVE, command: "qux", timeMs: 400 });
    store.onCommand({ type: CommandType.RECEIVE, command: "quux", timeMs: 500 });
    store.onCommand({ type: CommandType.SEND, command: "corge", timeMs: 600 });
    expect(store.history).toStrictEqual({
      discarded: 3,
      commands: [
        { id: 111, type: CommandType.SEND, command: "foo", timeMs: 100 },
        { id: 222, type: CommandType.RECEIVE, command: "bar", timeMs: 200 },
        { id: 333, type: CommandType.SEND, command: "baz", timeMs: 300 },
        { id: 444, type: CommandType.RECEIVE, command: "qux", timeMs: 400 },
        { id: 555, type: CommandType.RECEIVE, command: "quux", timeMs: 500 },
        { id: 666, type: CommandType.SEND, command: "corge", timeMs: 600 },
      ],
    });
  });

  it("invokeCommand", () => {
    mockAPI.invokePromptCommand.mockResolvedValueOnce();
    const store = new Store();
    store.invokeCommand(CommandType.SEND, "foo");
    expect(mockAPI.invokePromptCommand).nthCalledWith(
      1,
      PromptTarget.CSA,
      123,
      CommandType.SEND,
      "foo",
    );
  });
});
