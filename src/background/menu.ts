import path from "path";
import {
  app,
  Menu,
  MenuItem,
  MenuItemConstructorOptions,
  shell,
} from "electron";
import {
  openAutoSaveDirectory,
  openSettingsDirectory,
} from "@/background/settings";
import { openLogsDirectory } from "@/background/log";
import { getWebContents, onMenuEvent } from "@/background/ipc";
import { MenuEvent } from "@/common/control/menu";
import { AppState } from "@/common/control/state";
import { checkLatestVersion, openHowToUse, openWebSite } from "./help";
import { t } from "@/common/i18n";

const isMac = process.platform === "darwin";

const stateChangeCallbacks: ((appState: AppState, bussy: boolean) => void)[] =
  [];

function menuItem(
  label: string,
  event: MenuEvent,
  appStates: AppState[] | null,
  accelerator?: string
): MenuItemConstructorOptions {
  const index = stateChangeCallbacks.length;
  const id = "menuItem" + index;
  stateChangeCallbacks.push((appState: AppState, bussy: boolean) => {
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
      : !appStates || appStates.length === 0
      ? true
      : !!appStates.find((value) => value === appState);
  });
  return {
    id,
    label,
    accelerator,
    click: () => onMenuEvent(event),
  };
}

function createMenuTemplate() {
  const menuTemplate: Array<MenuItemConstructorOptions | MenuItem> = [
    {
      label: t.file,
      submenu: [
        menuItem(t.newRecord, MenuEvent.NEW_RECORD, [AppState.NORMAL]),
        menuItem(
          t.openRecord,
          MenuEvent.OPEN_RECORD,
          [AppState.NORMAL],
          "CmdOrCtrl+O"
        ),
        menuItem(
          t.saveRecord,
          MenuEvent.SAVE_RECORD,
          [AppState.NORMAL],
          "CmdOrCtrl+S"
        ),
        menuItem(
          t.saveRecordAs,
          MenuEvent.SAVE_RECORD_AS,
          [AppState.NORMAL],
          "CmdOrCtrl+Shift+S"
        ),
        { type: "separator" },
        menuItem(
          t.exportPositionImage,
          MenuEvent.EXPORT_POSITION_IMAGE,
          [AppState.NORMAL],
          "CmdOrCtrl+Shift+E"
        ),
        { type: "separator" },
        {
          label: t.openAutoSavingDirectory,
          click: openAutoSaveDirectory,
        },
        { type: "separator" },
        isMac
          ? { role: "close", label: t.close }
          : { role: "quit", label: t.quit },
      ],
    },
    {
      label: t.editing,
      submenu: [
        {
          label: t.copyRecord,
          submenu: [
            menuItem(t.asKIF, MenuEvent.COPY_RECORD, null, "CmdOrCtrl+C"),
            menuItem(t.asCSA, MenuEvent.COPY_RECORD_CSA, null),
            menuItem(
              t.asUSIUntilCurrentMove,
              MenuEvent.COPY_RECORD_USI_BEFORE,
              null
            ),
            menuItem(t.asUSIAll, MenuEvent.COPY_RECORD_USI_ALL, null),
          ],
        },
        menuItem(t.copyPositionAsSFEN, MenuEvent.COPY_BOARD_SFEN, null),
        menuItem(
          t.pasteRecordOrPosition,
          MenuEvent.PASTE_RECORD,
          [AppState.NORMAL],
          "CmdOrCtrl+V"
        ),
        { type: "separator" },
        {
          label: t.appendSpecialMove,
          submenu: [
            menuItem(t.interrupt, MenuEvent.INSERT_INTERRUPT, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.resign, MenuEvent.INSERT_RESIGN, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.draw, MenuEvent.INSERT_DRAW, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.impass, MenuEvent.INSERT_IMPASS, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.repetitionDraw, MenuEvent.INSERT_REPETITION_DRAW, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.mate, MenuEvent.INSERT_MATE, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.timeout, MenuEvent.INSERT_TIMEOUT, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.foulWin, MenuEvent.INSERT_FOUL_WIN, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.foulLose, MenuEvent.INSERT_FOUL_LOSE, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.enteringOfKing, MenuEvent.INSERT_ENTERING_OF_KING, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.winByDefault, MenuEvent.INSERT_WIN_BY_DEFAULT, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
            menuItem(t.loseByDefault, MenuEvent.INSERT_LOSE_BY_DEFAULT, [
              AppState.NORMAL,
              AppState.RESEARCH,
            ]),
          ],
        },
        menuItem(
          t.deleteMoves,
          MenuEvent.REMOVE_CURRENT_MOVE,
          [AppState.NORMAL, AppState.RESEARCH, AppState.MATE_SEARCH],
          "CmdOrCtrl+D"
        ),
        { type: "separator" },
        menuItem(t.startPositionSetup, MenuEvent.START_POSITION_EDITING, [
          AppState.NORMAL,
        ]),
        menuItem(t.completePositionSetup, MenuEvent.END_POSITION_EDITING, [
          AppState.POSITION_EDITING,
        ]),
        menuItem(t.changeTurn, MenuEvent.CHANGE_TURN, [
          AppState.POSITION_EDITING,
        ]),
        {
          label: t.initializePosition,
          submenu: [
            menuItem(t.nonHandicap, MenuEvent.INIT_POSITION_STANDARD, [
              AppState.POSITION_EDITING,
            ]),
            menuItem(t.lanceHandicap, MenuEvent.INIT_POSITION_HANDICAP_LANCE, [
              AppState.POSITION_EDITING,
            ]),
            menuItem(
              t.rightLanceHandicap,
              MenuEvent.INIT_POSITION_HANDICAP_RIGHT_LANCE,
              [AppState.POSITION_EDITING]
            ),
            menuItem(
              t.bishopHandicap,
              MenuEvent.INIT_POSITION_HANDICAP_BISHOP,
              [AppState.POSITION_EDITING]
            ),
            menuItem(t.rookHandicap, MenuEvent.INIT_POSITION_HANDICAP_ROOK, [
              AppState.POSITION_EDITING,
            ]),
            menuItem(
              t.rookLanceHandicap,
              MenuEvent.INIT_POSITION_HANDICAP_ROOK_LANCE,
              [AppState.POSITION_EDITING]
            ),
            menuItem(
              t.twoPiecesHandicap,
              MenuEvent.INIT_POSITION_HANDICAP_2PIECES,
              [AppState.POSITION_EDITING]
            ),
            menuItem(
              t.fourPiecesHandicap,
              MenuEvent.INIT_POSITION_HANDICAP_4PIECES,
              [AppState.POSITION_EDITING]
            ),
            menuItem(
              t.sixPiecesHandicap,
              MenuEvent.INIT_POSITION_HANDICAP_6PIECES,
              [AppState.POSITION_EDITING]
            ),
            menuItem(
              t.eightPiecesHandicap,
              MenuEvent.INIT_POSITION_HANDICAP_8PIECES,
              [AppState.POSITION_EDITING]
            ),
            menuItem(t.tsumeShogi, MenuEvent.INIT_POSITION_TSUME_SHOGI, [
              AppState.POSITION_EDITING,
            ]),
            menuItem(
              t.doubleKingTsumeShogi,
              MenuEvent.INIT_POSITION_TSUME_SHOGI_2KINGS,
              [AppState.POSITION_EDITING]
            ),
          ],
        },
      ],
    },
    {
      label: t.game,
      submenu: [
        menuItem(
          t.game,
          MenuEvent.START_GAME,
          [AppState.NORMAL],
          "CmdOrCtrl+G"
        ),
        menuItem(t.csaOnlineGame, MenuEvent.START_CSA_GAME, [AppState.NORMAL]),
        menuItem(t.interrupt, MenuEvent.STOP_GAME, [AppState.GAME]),
        menuItem(t.resign, MenuEvent.RESIGN, [
          AppState.GAME,
          AppState.CSA_GAME,
        ]),
        menuItem(t.winByDeclaration, MenuEvent.WIN, [AppState.CSA_GAME]),
        { type: "separator" },
        menuItem(t.logout, MenuEvent.LOGOUT, [AppState.CSA_GAME]),
      ],
    },
    {
      label: t.mateSearch,
      submenu: [
        menuItem(
          t.mateSearch,
          MenuEvent.START_MATE_SEARCH,
          [AppState.NORMAL],
          "CmdOrCtrl+M"
        ),
        menuItem(t.stopMateSearch, MenuEvent.STOP_MATE_SEARCH, [
          AppState.MATE_SEARCH,
        ]),
      ],
    },
    {
      label: t.research,
      submenu: [
        menuItem(
          t.startResearch,
          MenuEvent.START_RESEARCH,
          [AppState.NORMAL],
          "CmdOrCtrl+R"
        ),
        menuItem(t.endResearch, MenuEvent.STOP_RESEARCH, [AppState.RESEARCH]),
        { type: "separator" },
        menuItem(
          t.analyze,
          MenuEvent.START_ANALYSIS,
          [AppState.NORMAL],
          "CmdOrCtrl+A"
        ),
        menuItem(t.stopAnalysis, MenuEvent.STOP_ANALYSIS, [AppState.ANALYSIS]),
      ],
    },
    {
      label: t.view,
      submenu: [
        {
          label: t.toggleFullScreen,
          role: "togglefullscreen",
        },
        menuItem(t.flipBoard, MenuEvent.FLIP_BOARD, null, "CmdOrCtrl+T"),
        {
          label: t.defaultFontSize,
          click: () => {
            getWebContents().setZoomLevel(0);
          },
          accelerator: "CmdOrCtrl+0",
        },
        {
          label: t.largerFontSize,
          click: () => {
            const level = getWebContents().getZoomLevel();
            getWebContents().setZoomLevel(level + 1);
          },
          accelerator: "CmdOrCtrl+Plus",
        },
        {
          label: t.smallerFontSize,
          click: () => {
            const level = getWebContents().getZoomLevel();
            getWebContents().setZoomLevel(level - 1);
          },
          accelerator: "CmdOrCtrl+-",
        },
      ],
    },
    {
      label: t.settings,
      submenu: [
        menuItem(
          t.appSettings,
          MenuEvent.APP_SETTING_DIALOG,
          null,
          "CmdOrCtrl+,"
        ),
        menuItem(
          t.engineSettings,
          MenuEvent.USI_ENGINE_SETTING_DIALOG,
          [AppState.NORMAL],
          "CmdOrCtrl+."
        ),
      ],
    },
    {
      label: t.debug,
      submenu: [
        {
          label: t.toggleDevTools,
          role: "toggleDevTools",
        },
        { type: "separator" },
        {
          label: t.openAppDirectory,
          click: () => {
            shell.openPath(path.dirname(app.getPath("exe")));
          },
        },
        {
          label: t.openSettingDirectory,
          click: openSettingsDirectory,
        },
        {
          label: t.openLogDirectory,
          click: openLogsDirectory,
        },
      ],
    },
    {
      label: t.help,
      submenu: [
        {
          label: t.openWebSite,
          click: openWebSite,
        },
        {
          label: t.howToUse,
          click: openHowToUse,
        },
        {
          label: t.checkForUpdates,
          click: checkLatestVersion,
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

  return menuTemplate;
}

export function setupMenu(): void {
  const menu = Menu.buildFromTemplate(createMenuTemplate());
  Menu.setApplicationMenu(menu);
}

export function updateAppState(appState: AppState, bussy: boolean): void {
  Array.from(stateChangeCallbacks).forEach((callback) =>
    callback(appState, bussy)
  );
}
