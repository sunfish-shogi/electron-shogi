import { issueEngineURI } from "@/common/uri";
import * as uri from "@/common/uri";

// reserved option names
export const USIPonder = "USI_Ponder";
export const USIHash = "USI_Hash";
export const USIMultiPV = "USI_MultiPV";

// well-known option names
export const Threads = "Threads";
export const NumberOfThreads = "NumberOfThreads";
export const MultiPV = "MultiPV";

export type USIEngineOptionType =
  | "check"
  | "spin"
  | "combo"
  | "button"
  | "string"
  | "filename";

export type USIEngineOption = {
  name: string;
  type: USIEngineOptionType;
  default?: string | number;
  min?: number;
  max?: number;
  vars: string[];
  value?: string | number;
};

export function getUSIEngineOptionCurrentValue(
  option: USIEngineOption | null | undefined
): string | number | undefined {
  if (!option) {
    return;
  }
  if (option.value !== undefined) {
    return option.value;
  }
  if (option.default !== undefined) {
    if (option.type === "string" && option.default === "<empty>") {
      return "";
    }
    return option.default;
  }
  return;
}

export type USIEngineOptions = { [name: string]: USIEngineOption };

export type USIEngineSetting = {
  uri: string;
  name: string;
  defaultName: string;
  author: string;
  path: string;
  options: { [name: string]: USIEngineOption };
};

export function emptyUSIEngineSetting(): USIEngineSetting {
  return {
    uri: "",
    name: "",
    defaultName: "",
    author: "",
    path: "",
    options: {},
  };
}

export function duplicateEngineSetting(
  src: USIEngineSetting
): USIEngineSetting {
  const engine: USIEngineSetting = JSON.parse(JSON.stringify(src));
  engine.uri = issueEngineURI();
  engine.name += " のコピー";
  return engine;
}

export function mergeUSIEngineSetting(
  engine: USIEngineSetting,
  local: USIEngineSetting
): void {
  engine.uri = local.uri;
  engine.name = local.name;
  Object.keys(local.options).forEach((name) => {
    if (!engine.options[name]) {
      return;
    }
    engine.options[name].value = local.options[name].value;
  });
}

export interface ImmutableUSIEngineSettings {
  hasEngine(uri: string): boolean;
  getEngine(uri: string): USIEngineSetting | undefined;
  get engineList(): USIEngineSetting[];
  get json(): string;
  get jsonWithIndent(): string;
  getClone(): USIEngineSettings;
}

export class USIEngineSettings {
  private engines: { [uri: string]: USIEngineSetting } = {};

  constructor(json?: string) {
    if (json) {
      const src = JSON.parse(json);
      for (const engineURI in src.engines) {
        if (uri.isUSIEngine(engineURI)) {
          this.engines[engineURI] = {
            ...emptyUSIEngineSetting(),
            ...src.engines[engineURI],
            uri: engineURI,
          };
        }
      }
    }
  }

  hasEngine(uri: string): boolean {
    return !!this.engines[uri];
  }

  addEngine(engine: USIEngineSetting): void {
    this.engines[engine.uri] = engine;
  }

  updateEngine(engine: USIEngineSetting): boolean {
    if (!this.engines[engine.uri]) {
      return false;
    }
    this.engines[engine.uri] = engine;
    return true;
  }

  removeEngine(uri: string): boolean {
    if (!this.engines[uri]) {
      return false;
    }
    delete this.engines[uri];
    return true;
  }

  getEngine(uri: string): USIEngineSetting | undefined {
    return this.engines[uri];
  }

  get engineList(): USIEngineSetting[] {
    return Object.values(this.engines).sort((a, b): number => {
      if (a.name !== b.name) {
        return a.name > b.name ? 1 : -1;
      }
      if (a.defaultName !== b.defaultName) {
        return a.defaultName > b.defaultName ? 1 : -1;
      }
      return a.uri > b.uri ? 1 : -1;
    });
  }

  get json(): string {
    return JSON.stringify(this);
  }

  get jsonWithIndent(): string {
    return JSON.stringify(this, undefined, 2);
  }

  getClone(): USIEngineSettings {
    return new USIEngineSettings(this.json);
  }
}
