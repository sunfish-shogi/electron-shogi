export function promisedTimeout(
  fn: () => void,
  timeout?: number
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      try {
        fn();
        resolve();
      } catch (e) {
        reject(e);
      }
    }, timeout);
  });
}
