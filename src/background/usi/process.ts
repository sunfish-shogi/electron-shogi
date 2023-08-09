import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { createInterface as readline, Interface as Readline } from "readline";
import path from "path";

export class ChildProcess {
  private handle: ChildProcessWithoutNullStreams;
  private readline: Readline | null = null;
  private _lastSended: string | null = null;

  constructor(cmd: string) {
    this.handle = spawn(cmd, {
      cwd: path.dirname(cmd),
    }).on("close", this.onClose.bind(this));
  }

  get lastSended(): string | null {
    return this._lastSended;
  }

  on(event: "receive", listener: (line: string) => void): this;
  on(event: "error", listener: (err: Error) => void): this;
  on(event: "close", listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, listener: (...args: any[]) => void): this {
    switch (event) {
      case "receive":
        if (this.readline === null) {
          this.readline = readline(this.handle.stdout);
        }
        this.readline.on("line", listener);
        break;
      case "close":
        this.handle.on("close", (code, signal) => {
          this.onClose();
          listener(code, signal);
        });
        break;
      default:
        this.handle.on(event, listener);
        break;
    }
    return this;
  }

  send(line: string): void {
    this.handle.stdin.write(line + "\n");
    this._lastSended = line;
  }

  kill(): void {
    this.onClose();
    this.handle.kill();
  }

  private onClose() {
    if (this.readline !== null) {
      this.readline.close();
    }
  }
}
