export type ErrorEntry = {
  message: string;
  count: number;
};

export class ErrorStore {
  private errorCounts: { [key: string]: number } = {};

  get errors(): ErrorEntry[] {
    return Object.entries(this.errorCounts)
      .sort(([a], [b]) => {
        return a < b ? -1 : a > b ? 1 : 0;
      })
      .map(([message, count]) => {
        return {
          message,
          count,
        };
      });
  }

  get hasError(): boolean {
    return !!Object.keys(this.errorCounts).length;
  }

  add(e: unknown): void {
    const message = e instanceof Error ? e.message : "" + e;
    const count = this.errorCounts[message] || 0;
    this.errorCounts[message] = count + 1;
  }

  clear(): void {
    this.errorCounts = {};
  }
}
