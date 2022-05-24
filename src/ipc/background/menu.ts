import { app, Menu, MenuItem, MenuItemConstructorOptions } from "electron";
import { openSettingsDirectory } from "@/ipc/background/settings";
import { onMenuEvent } from "@/ipc/background";
import { MenuEvent } from "@/ipc/menu";
import { Mode } from "@/store/mode";

const isMac = process.platform === "darwin";

const stateChangeCallbacks: ((mode: Mode, bussy: boolean) => void)[] = [];

function menuItem(
  label: string,
  event: MenuEvent,
  modes: Mode[] | null,
  accelerator?: string
): MenuItemConstructorOptions {
  const index = stateChangeCallbacks.length;
  const id = "menuItem" + index;
  stateChangeCallbacks.push((mode: Mode, bussy: boolean) => {
    const menu = Menu.getApplicationMenu();
    if (!menu) {
      return;
    }
    const item = menu.getMenuItemById(id);
    if (!item) {
      return;
    }
    item.enabled = bussy
      ? false
      : !modes || modes.length === 0
      ? true
      : !!modes.find((value) => value === mode);
  });
  return {
    id,
    label,
    accelerator,
    click: () => onMenuEvent(event),
  };
}

const menuTemplate: Array<MenuItemConstructorOptions | MenuItem> = [
  {
    label: "ファイル",
    submenu: [
      menuItem("新規棋譜", MenuEvent.NEW_RECORD, [Mode.NORMAL]),
      menuItem(
        "棋譜を開く",
        MenuEvent.OPEN_RECORD,
        [Mode.NORMAL],
        "CmdOrCtrl+O"
      ),
      menuItem(
        "棋譜を上書き保存",
        MenuEvent.SAVE_RECORD,
        [Mode.NORMAL],
        "CmdOrCtrl+S"
      ),
      menuItem(
        "棋譜に名前を付けて保存",
        MenuEvent.SAVE_RECORD_AS,
        [Mode.NORMAL],
        "CmdOrCtrl+Shift+S"
      ),
      { type: "separator" },
      isMac
        ? { role: "close", label: "閉じる" }
        : { role: "quit", label: "終了" },
    ],
  },
  {
    label: "編集",
    submenu: [
      {
        label: "棋譜コピー",
        submenu: [
          menuItem("KIF形式", MenuEvent.COPY_RECORD, null, "CmdOrCtrl+C"),
          menuItem("CSA形式", MenuEvent.COPY_RECORD_CSA, null),
          menuItem(
            "USI形式(現在の指し手まで)",
            MenuEvent.COPY_RECORD_USI_BEFORE,
            null
          ),
          menuItem("USI形式(全て)", MenuEvent.COPY_RECORD_USI_ALL, null),
        ],
      },
      menuItem("局面コピー(SFEN形式)", MenuEvent.COPY_BOARD_SFEN, null),
      menuItem(
        "棋譜・局面貼り付け",
        MenuEvent.PASTE_RECORD,
        [Mode.NORMAL],
        "CmdOrCtrl+V"
      ),
      { type: "separator" },
      {
        label: "特殊な指し手",
        submenu: [
          menuItem("中断", MenuEvent.INSERT_INTERRUPT, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("投了", MenuEvent.INSERT_RESIGN, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("持将棋", MenuEvent.INSERT_DRAW, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("千日手", MenuEvent.INSERT_REPETITION_DRAW, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("詰み", MenuEvent.INSERT_MATE, [Mode.NORMAL, Mode.RESEARCH]),
          menuItem("時間切れ", MenuEvent.INSERT_TIMEOUT, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("反則勝ち", MenuEvent.INSERT_FOUL_WIN, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("反則負け", MenuEvent.INSERT_FOUL_LOSE, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("入玉勝ち", MenuEvent.INSERT_ENTERING_OF_KING, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("不戦勝", MenuEvent.INSERT_WIN_BY_DEFAULT, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
          menuItem("不戦敗", MenuEvent.INSERT_LOSS_BY_DEFAULT, [
            Mode.NORMAL,
            Mode.RESEARCH,
          ]),
        ],
      },
      menuItem(
        "現在の位置から棋譜を削除",
        MenuEvent.REMOVE_RECORD_AFTER,
        [Mode.NORMAL, Mode.RESEARCH],
        "CmdOrCtrl+D"
      ),
      { type: "separator" },
      menuItem("局面編集開始", MenuEvent.START_POSITION_EDITING, [Mode.NORMAL]),
      menuItem("局面編集終了", MenuEvent.END_POSITION_EDITING, [
        Mode.POSITION_EDITING,
      ]),
      menuItem("手番入れ替え", MenuEvent.CHANGE_TURN, [Mode.POSITION_EDITING]),
      {
        label: "局面初期化",
        submenu: [
          menuItem("平手", MenuEvent.INIT_POSITION_STANDARD, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("香落ち", MenuEvent.INIT_POSITION_HANDICAP_LANCE, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("右香落ち", MenuEvent.INIT_POSITION_HANDICAP_RIGHT_LANCE, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("角落ち", MenuEvent.INIT_POSITION_HANDICAP_BISHOP, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("飛車落ち", MenuEvent.INIT_POSITION_HANDICAP_ROOK, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("飛車香落ち", MenuEvent.INIT_POSITION_HANDICAP_ROOK_LANCE, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("2枚落ち", MenuEvent.INIT_POSITION_HANDICAP_2PIECES, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("4枚落ち", MenuEvent.INIT_POSITION_HANDICAP_4PIECES, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("6枚落ち", MenuEvent.INIT_POSITION_HANDICAP_6PIECES, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("8枚落ち", MenuEvent.INIT_POSITION_HANDICAP_8PIECES, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("詰め将棋", MenuEvent.INIT_POSITION_TSUME_SHOGI, [
            Mode.POSITION_EDITING,
          ]),
          menuItem("双玉詰め将棋", MenuEvent.INIT_POSITION_TSUME_SHOGI_2KINGS, [
            Mode.POSITION_EDITING,
          ]),
        ],
      },
    ],
  },
  {
    label: "対局",
    submenu: [
      menuItem("対局", MenuEvent.START_GAME, [Mode.NORMAL]),
      menuItem("中断", MenuEvent.STOP_GAME, [Mode.GAME]),
      menuItem("投了", MenuEvent.RESIGN, [Mode.GAME]),
    ],
  },
  {
    label: "検討",
    submenu: [
      menuItem("検討開始", MenuEvent.START_RESEARCH, [Mode.NORMAL]),
      menuItem("検討終了", MenuEvent.STOP_RESEARCH, [Mode.RESEARCH]),
      { type: "separator" },
      menuItem("解析開始", MenuEvent.START_ANALYSIS, [Mode.NORMAL]),
      menuItem("解析終了", MenuEvent.STOP_ANALYSIS, [Mode.ANALYSIS]),
    ],
  },
  {
    label: "表示",
    submenu: [
      {
        label: "全画面表示切り替え",
        role: "togglefullscreen",
      },
      menuItem("盤面反転", MenuEvent.FLIP_BOARD, null, "CmdOrCtrl+T"),
      { type: "separator" },
      {
        label: "開発者ツール表示切り替え",
        role: "toggleDevTools",
      },
    ],
  },
  {
    label: "設定",
    submenu: [
      menuItem("アプリ設定", MenuEvent.APP_SETTING_DIALOG, null),
      menuItem("エンジン設定", MenuEvent.USI_ENGINE_SETTING_DIALOG, [
        Mode.NORMAL,
      ]),
      {
        label: "設定ファイルのフォルダを開く",
        click: openSettingsDirectory,
      },
    ],
  },
];

if (isMac) {
  menuTemplate.unshift({
    label: app.name,
    submenu: [{ role: "about" }, { type: "separator" }, { role: "quit" }],
  });
}

export function setupMenu(): void {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

export function updateMenuState(mode: Mode, bussy: boolean): void {
  Array.from(stateChangeCallbacks).forEach((callback) => callback(mode, bussy));
}
