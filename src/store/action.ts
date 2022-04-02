export enum Action {
  UPDATE_APP_SETTING = "updateAppSetting",

  OPEN_RECORD = "openRecord",
  SAVE_RECORD = "saveRecord",
  COPY_RECORD = "copyRecord",
  PASTE_RECORD = "pasteRecord",

  START_POSITION_EDITING = "startPositionEditing",
  END_POSITION_EDITING = "endPositionEditing",

  UPDATE_USI_INFO = "updateUsiInfo",
  START_RESEARCH = "startResearch",
  STOP_RESEARCH = "stopResearch",
  START_GAME = "startGame",
  STOP_GAME = "stopGame",
  RESIGN_BY_USER = "resign",
  DO_MOVE_BY_USER = "doMoveByUser",
  DO_MOVE_BY_USI_ENGINE = "doMoveByUSIEngine",
  RESET_GAME_TIMER = "resetGameTimer",

  BEEP_UNLIMITED = "beepUnlimited",
  BEEP_SHORT = "beepShort",
}
