export enum Mutation {
  UPDATE_APP_SETTING = "updateAppSetting",
  FLIP_BOARD = "flipBoard",

  SHOW_PASTE_DIALOG = "showPasteDialog",
  CLOSE_PASTE_DIALOG = "closePasteDialog",
  SHOW_GAME_DIALOG = "showGameDialog",
  SHOW_RESEARCH_DIALOG = "showResearchDialog",
  OPEN_APP_SETTING_DIALOG = "openAppSettingDialog",
  OPEN_USI_ENGINE_MANAGEMENT_DIALOG = "openUSIEngineManagementDialog",
  CLOSE_DIALOG = "closeDialog",

  NEW_RECORD = "newRecord",
  UPDATE_RECORD_COMMENT = "updateRecordComment",
  UPDATE_STANDARD_RECORD_METADATA = "updateStandardRecordMetadata",

  CHANGE_TURN = "changeTurn",
  EDIT_POSITION = "editPosition",

  CHANGE_MOVE_NUMBER = "changeMoveNumber",
  CHANGE_BRANCH = "changeBranch",

  CLEAR_GAME_TIMER = "clearGameTimer",

  // usi
  UPDATE_USI_INFO = "updateUSIInfo",

  // message
  PUSH_MESSAGE = "pushMessage",
  SHIFT_MESSAGE = "shiftMessage",

  // error
  PUSH_ERROR = "pushError",
  CLEAR_ERRORS = "clearErrors",

  // bussy
  RETAIN_BUSSY_STATE = "retainBussyState",
  RELEASE_BUSSY_STATE = "releaseBussyState",
}
