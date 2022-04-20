export enum Action {
  UPDATE_APP_SETTING = "updateAppSetting",

  OPEN_RECORD = "openRecord",
  SAVE_RECORD = "saveRecord",
  COPY_RECORD = "copyRecord",
  PASTE_RECORD = "pasteRecord",
  REMOVE_RECORD_AFTER = "removeRecordAfter",

  START_POSITION_EDITING = "startPositionEditing",
  END_POSITION_EDITING = "endPositionEditing",
  INITIALIZE_POSITION = "initializePosition",

  UPDATE_USI_INFO = "updateUsiInfo",
  START_RESEARCH = "startResearch",
  STOP_RESEARCH = "stopResearch",
  START_GAME = "startGame",
  STOP_GAME = "stopGame",
  RESIGN_BY_USER = "resign",
  DO_MOVE_BY_USER = "doMoveByUser",
  DO_MOVE_BY_USI_ENGINE = "doMoveByUSIEngine",
  DO_MOVE = "doMove",
  RESET_GAME_TIMER = "resetGameTimer",

  BEEP_UNLIMITED = "beepUnlimited",
  BEEP_SHORT = "beepShort",

  // confirmation
  SHOW_CONFIRMATION = "showConfirmation",
  CONFIRMATION_OK = "confirmationOk",
  CONFIRMATION_CANCEL = "confirmationCancel",
}
