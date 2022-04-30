import { issueEngineURI } from "@/uri";

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
  option: USIEngineOption
): string | number | undefined {
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

export class USIEngineSettings {
  private engines: { [uri: string]: USIEngineSetting };

  constructor(json?: string) {
    this.engines = {};
    if (json) {
      const src = JSON.parse(json);
      if (src.engines instanceof Object) {
        this.engines = src.engines;
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

  getEngine(uri: string): USIEngineSetting {
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
}
