type TimeoutEntry = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: () => any;
  ms: number;
};

export class TimeoutChain {
  private chain: TimeoutEntry[];

  constructor() {
    this.chain = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  next(callback: () => any, ms?: number): TimeoutChain {
    this.chain.push({ callback, ms: ms || 0 });
    return this;
  }

  invoke(): Promise<void> {
    let promise = Promise.resolve();
    for (const entry of this.chain) {
      promise = promise.then(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const ret = entry.callback();
              if (ret instanceof Promise) {
                ret.then(resolve).catch(reject);
              } else {
                resolve();
              }
            } catch (e) {
              reject(e);
            }
          }, entry.ms);
        });
      });
    }
    return promise;
  }
}
