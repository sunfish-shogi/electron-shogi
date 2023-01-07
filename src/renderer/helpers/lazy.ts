export class Lazy {
  private func?: () => void;
  private timeout?: NodeJS.Timeout;

  after(func: () => void, ms: number): void {
    this.func = func;
    if (this.timeout) {
      return;
    }
    this.timeout = setTimeout(this.invoke.bind(this), ms);
  }

  private invoke(): void {
    if (this.func) {
      this.func();
    }
    this.clear();
  }

  clear(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }
    this.func = undefined;
  }
}
