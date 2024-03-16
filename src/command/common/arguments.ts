type GetValue = () => string;
type GetValueOrNull = () => string | null;
type GetNumber = () => number;
type GetNumberOrNull = () => number | null;
type GetFlag = () => boolean;

type StringRestriction = string[];

type NumberRestriction = {
  min?: number;
  max?: number;
};

export class ArgumentsParser {
  private valueKeys: string[] = [];
  private stringRestrictions = new Map<string, StringRestriction>();
  private numberKeys: string[] = [];
  private numberRestrictions = new Map<string, NumberRestriction>();
  private flagKeys: string[] = [];
  private values = new Map<string, string>();
  private numbers = new Map<string, number>();
  private flags = new Map<string, boolean>();
  private bareArgs: string[] = [];
  public help: string;

  constructor(commandName: string, bareArgFormats?: string | string[]) {
    if (typeof bareArgFormats === "string") {
      bareArgFormats = [bareArgFormats];
    }
    this.help = "Usage:\n";
    for (const format of bareArgFormats || [""]) {
      this.help += `  ${commandName} [options] ${format}\n`;
    }
    this.help += `\nOptions:\n`;
  }

  value(
    name: string,
    description: string,
    defaultValue: string,
    restriction?: StringRestriction,
  ): GetValue {
    const key = "--" + name;
    this.help += `  ${key} VALUE\n`;
    this.help += `      ${description}\n`;
    this.help += `      (default: ${defaultValue})\n`;
    this.valueKeys.push(key);
    if (restriction) {
      this.stringRestrictions.set(key, restriction);
    }
    return () => {
      const value = this.values.get(key);
      return value !== undefined ? value : defaultValue;
    };
  }

  valueOrNull(name: string, description: string, restriction?: StringRestriction): GetValueOrNull {
    const key = "--" + name;
    this.help += `  ${key} VALUE\n`;
    this.help += `      ${description}\n`;
    this.valueKeys.push(key);
    if (restriction) {
      this.stringRestrictions.set(key, restriction);
    }
    return () => {
      const value = this.values.get(key);
      return value !== undefined ? value : null;
    };
  }

  number(
    name: string,
    description: string,
    defaultValue: number,
    restriction?: NumberRestriction,
  ): GetNumber {
    const key = "--" + name;
    this.help += `  ${key} VALUE\n`;
    this.help += `      ${description}\n`;
    this.help += `      (default: ${defaultValue})\n`;
    this.numberKeys.push(key);
    if (restriction) {
      this.numberRestrictions.set(key, restriction);
    }
    return () => {
      const value = this.numbers.get(key);
      return value !== undefined ? value : defaultValue;
    };
  }

  numberOrNull(
    name: string,
    description: string,
    restriction?: NumberRestriction,
  ): GetNumberOrNull {
    const key = "--" + name;
    this.help += `  ${key} VALUE\n`;
    this.help += `      ${description}\n`;
    this.numberKeys.push(key);
    if (restriction) {
      this.numberRestrictions.set(key, restriction);
    }
    return () => {
      const value = this.numbers.get(key);
      return value !== undefined ? value : null;
    };
  }

  flag(name: string, description: string): GetFlag {
    const key = "--" + name;
    this.help += `  ${key}\n`;
    this.help += `      ${description}\n`;
    this.flagKeys.push(key);
    return () => {
      return this.flags.get(key) || false;
    };
  }

  parse(): void {
    let bareArgIndex = 0;
    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (i === bareArgIndex) {
        // bare arg (follows "--")
        this.bareArgs.push(arg);
      } else if (this.valueKeys.includes(arg)) {
        // string
        const value = process.argv[++i];
        const restriction = this.stringRestrictions.get(arg);
        if (restriction) {
          if (!restriction.includes(value)) {
            this.onError(`${arg} option must be one of: ${restriction.join(", ")}`);
          }
        }
        this.values.set(arg, value);
      } else if (this.numberKeys.includes(arg)) {
        // number
        const value = Number(process.argv[++i]);
        if (Number.isNaN(value)) {
          this.onError(`${arg} option must be a number: ${process.argv[i]}`);
        }
        const restriction = this.numberRestrictions.get(arg);
        if (restriction?.min && value < restriction.min) {
          this.onError(`${arg} option must be greater than or equal to ${restriction.min}`);
        }
        if (restriction?.max && value > restriction.max) {
          this.onError(`${arg} option must be less than or equal to ${restriction.max}`);
        }
        this.numbers.set(arg, value);
      } else if (this.flagKeys.includes(arg)) {
        // boolean
        this.flags.set(arg, true);
      } else if (arg === "--") {
        // next arg is bare
        bareArgIndex = i + 1;
      } else if (arg === "--help") {
        // show help
        this.showHelp();
        process.exit(0);
      } else if (arg.startsWith("-")) {
        // unknown option
        this.onError(`Unknown option: ${arg}`);
      } else {
        // bare arg
        this.bareArgs.push(arg);
      }
    }
  }

  get args(): string[] {
    return this.bareArgs;
  }

  showHelp(): void {
    // eslint-disable-next-line no-console
    console.log(this.help);
  }

  private onError(message: string): void {
    // eslint-disable-next-line no-console
    console.error(message);
    process.exit(1);
  }
}
