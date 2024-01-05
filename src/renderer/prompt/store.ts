import { PromptHistory, PromptTarget, addCommand } from "@/common/advanced/prompt";
import { UnwrapNestedRefs, reactive } from "vue";
import api from "@/renderer/ipc/api";
import { Command, CommandType } from "@/common/advanced/command";

const maxHistoryLength = 2000;

export class Store {
  private _reactive: UnwrapNestedRefs<Store>;
  private _target: PromptTarget;
  private _sessionID: number;
  private _name: string;
  private _history: PromptHistory = {
    discarded: 0,
    commands: [],
  };

  constructor() {
    this._reactive = reactive(this);
    const params = new URL(window.location.toString()).searchParams;
    this._target = params.get("target") as PromptTarget;
    this._sessionID = Number(params.get("session"));
    this._name = params.get("name") || "unknown";
  }

  get reactive(): UnwrapNestedRefs<Store> {
    return this._reactive;
  }

  get target(): PromptTarget {
    return this._target;
  }

  get sessionID(): number {
    return this._sessionID;
  }

  get name(): string {
    return this._name;
  }

  get history(): PromptHistory {
    return this._history;
  }

  async setup(): Promise<void> {
    try {
      this._history = await api.setupPrompt(this.target, this.sessionID);
    } catch (e) {
      this.onError(e);
    }
  }

  onCommand(command: Command): void {
    addCommand(this._history, command, maxHistoryLength);
  }

  onError(e: unknown) {
    const command = {
      type: CommandType.SYSTEM,
      timeMs: Date.now(),
      command: `Failed to load command history: ${this.target}: ${this.sessionID}: ${e}`,
    };
    addCommand(this._history, command, maxHistoryLength);
  }

  invokeCommand(type: CommandType, command: string): void {
    api.invokePromptCommand(this.target, this.sessionID, type, command);
  }
}

export function createStore(): UnwrapNestedRefs<Store> {
  return new Store().reactive;
}

let store: UnwrapNestedRefs<Store>;

export function useStore(): UnwrapNestedRefs<Store> {
  if (!store) {
    store = createStore();
  }
  return store;
}
