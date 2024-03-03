/**
 * GUI アプリと CLI ツールでコードを共有するために Electron を遅延読み込みします。
 * Electron が存在しない場合は例外が投げられます。
 */
export function requireElectron() {
  return require("electron");
}

/**
 * GUI アプリと CLI ツールでコードを共有するために Electron を遅延読み込みします。
 * Electron が存在しない場合は null を返します。
 */
export function getElectron() {
  try {
    return requireElectron();
  } catch {
    return null;
  }
}
