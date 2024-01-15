type GetValue = () => string;
type GetFlag = () => boolean;

export class ArgumentsParser {
  private valueKeys: string[] = [];
  private flagKeys: string[] = [];
  private values = new Map<string, string>();
  private flags = new Map<string, boolean>();
  private bareArgs: string[] = [];
  private help: string;

  constructor(command: string, args?: string) {
    this.help = `Usage: ${command} [options] ${args}\n\nOPTIONS:\n`;
  }

  value(name: string, description: string, defaultValue: string): GetValue {
    const key = "--" + name;
    this.help += `  ${key} VALUE\n`;
    this.help += `      ${description}\n`;
    this.help += `      (default: ${defaultValue})\n`;
    this.valueKeys.push(key);
    return () => {
      return this.values.get(key) || defaultValue;
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
    for (let i = 2; i < process.argv.length; i++) {
      const arg = process.argv[i];
      if (this.valueKeys.includes(arg)) {
        this.values.set(arg, process.argv[++i]);
      } else if (this.flagKeys.includes(arg)) {
        this.flags.set(arg, true);
      } else if (arg === "--help") {
        this.showHelp();
        process.exit(0);
      } else {
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
}
