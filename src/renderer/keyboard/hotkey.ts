import { install, uninstall } from "@github/hotkey";

function installHotKey(elem: HTMLElement) {
  for (const target of elem.querySelectorAll("[data-hotkey]")) {
    install(target as HTMLElement);
  }
}

function uninstallHotKey(elem: HTMLElement) {
  for (const target of elem.querySelectorAll("[data-hotkey]")) {
    uninstall(target as HTMLElement);
  }
}

const mainWindowElements: HTMLElement[] = [];
const dialogElements: HTMLElement[] = [];

export function installHotKeyForMainWindow(elem: HTMLElement) {
  // ダイアログが表示されていない場合はメイン画面が最前面にあるのでホットキーを有効にする。
  if (dialogElements.length === 0) {
    installHotKey(elem);
  }
  // 対象の要素をリストに保持しておく。
  mainWindowElements.push(elem);
}

export function uninstallHotKeyForMainWindow(elem: HTMLElement) {
  // ダイアログが表示されていない場合はメイン画面が最前面にあるのでホットキーを無効にする。
  if (dialogElements.length === 0) {
    uninstallHotKey(elem);
  }
  // 対象の要素をリストから除外する。
  for (let i = 0; i < mainWindowElements.length; i++) {
    if (mainWindowElements[i] === elem) {
      mainWindowElements.splice(i, 1);
      break;
    }
  }
}

export function installHotKeyForDialog(elem: HTMLElement) {
  // ダイアログが他に無ければメイン画面のホットキーを無効にする。
  // ダイアログが他にあれば、そのダイアログのホットキーを無効にする。
  if (dialogElements.length === 0) {
    for (const e of mainWindowElements) {
      uninstallHotKey(e);
    }
  } else {
    uninstallHotKey(dialogElements[dialogElements.length - 1]);
  }
  // 対象のDOMツリーに含まれる要素のホットキーを有効にする。
  installHotKey(elem);
  // 対象の要素をリストに保持しておく。
  dialogElements.push(elem);
}

export function uninstallHotKeyForDialog(elem: HTMLElement) {
  // 対象の要素をリストから除外する。
  for (let i = 0; i < dialogElements.length; i++) {
    if (dialogElements[i] === elem) {
      dialogElements.splice(i, 1);
      if (i === dialogElements.length) {
        uninstallHotKey(elem);
      }
      break;
    }
  }
  // ダイアログが他に無ければメイン画面のホットキーを有効にする。
  // ダイアログが他にあれば、そのダイアログのホットキーを有効にする。
  if (dialogElements.length === 0) {
    for (const e of mainWindowElements) {
      installHotKey(e);
    }
  } else {
    installHotKey(dialogElements[dialogElements.length - 1]);
  }
}
