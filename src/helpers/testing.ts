// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = () => any;

export class TimeoutChain {
  private chain = [] as Callback[];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  next(callback: () => any): TimeoutChain {
    this.chain.push(callback);
    return this;
  }

  invoke(): Promise<void> {
    let promise = Promise.resolve();
    for (const callback of this.chain) {
      promise = promise.then(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            try {
              const ret = callback();
              if (ret instanceof Promise) {
                ret.then(resolve).catch(reject);
              } else {
                resolve();
              }
            } catch (e) {
              reject(e);
            }
          });
        });
      });
    }
    return promise;
  }
}
