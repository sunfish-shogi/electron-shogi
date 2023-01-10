import preloadImage from "./preload";

export enum Icon {
  BUSSY = "bussy",
  ERROR = "error",
  INFO = "info",
  GAME = "game",
  INTERNET = "internet",
  STOP = "stop",
  RESIGN = "resign",
  RESEARCH = "research",
  END = "end",
  QUIZ = "quiz",
  EDIT = "edit",
  CHECK = "check",
  SWAP = "swap",
  SWAP_H = "swap_h",
  SETTINGS = "settings",
  ENGINE_SETTINGS = "engineSettings",
  FLIP = "flip",
  FILE = "file",
  OPEN = "open",
  SAVE = "save",
  SAVE_AS = "saveAs",
  PASTE = "paste",
  COPY = "copy",
  DELETE = "delete",
  COMMENT = "comment",
  BRAIN = "brain",
  PV = "pv",
  CHART = "chart",
  PERCENT = "percent",
  ARROW_DROP = "arrowDrop",
  ARROW_UP = "arrowUp",
  FIRST = "first",
  BACK = "back",
  NEXT = "next",
  LAST = "last",
  QUESTION = "question",
  ANALYSIS = "analysis",
  DESCRIPTION = "description",
  PLAY = "play",
  CLOSE = "close",
  CALL = "call",
}

export const iconSourceMap = {
  [Icon.BUSSY]: "icon/hourglass_empty_white_24dp.svg",
  [Icon.ERROR]: "icon/error_outline_white_24dp.svg",
  [Icon.INFO]: "icon/info_white_24dp.svg",
  [Icon.GAME]: "icon/sports_esports_white_24dp.svg",
  [Icon.INTERNET]: "icon/language_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.STOP]: "icon/block_white_24dp.svg",
  [Icon.RESIGN]: "icon/flag_white_24dp.svg",
  [Icon.RESEARCH]: "icon/science_white_24dp.svg",
  [Icon.END]: "icon/do_disturb_on_white_24dp.svg",
  [Icon.QUIZ]: "icon/quiz_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.EDIT]: "icon/app_registration_white_24dp.svg",
  [Icon.CHECK]: "icon/check_circle_white_24dp.svg",
  [Icon.SWAP]: "icon/swap_vert_white_24dp.svg",
  [Icon.SWAP_H]: "icon/swap_horiz_white_24dp.svg",
  [Icon.SETTINGS]: "icon/settings_white_24dp.svg",
  [Icon.ENGINE_SETTINGS]: "icon/settings_input_component_white_24dp.svg",
  [Icon.FLIP]: "icon/flip_camera_android_white_24dp.svg",
  [Icon.FILE]: "icon/draft_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.OPEN]: "icon/file_open_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.SAVE]: "icon/save_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.SAVE_AS]: "icon/save_as_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.PASTE]: "icon/content_paste_white_24dp.svg",
  [Icon.COPY]: "icon/content_copy_white_24dp.svg",
  [Icon.DELETE]: "icon/backspace_white_24dp.svg",
  [Icon.COMMENT]: "icon/edit_note_white_24dp.svg",
  [Icon.BRAIN]: "icon/psychology_white_24dp.svg",
  [Icon.PV]: "icon/manage_search_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.CHART]: "icon/show_chart_white_24dp.svg",
  [Icon.PERCENT]: "icon/percent_white_24dp.svg",
  [Icon.ARROW_DROP]: "icon/arrow_drop_down_white_24dp.svg",
  [Icon.ARROW_UP]: "icon/arrow_drop_up_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.FIRST]: "icon/first_page_white_24dp.svg",
  [Icon.BACK]: "icon/chevron_left_white_24dp.svg",
  [Icon.NEXT]: "icon/chevron_right_white_24dp.svg",
  [Icon.LAST]: "icon/last_page_white_24dp.svg",
  [Icon.QUESTION]: "icon/help_white_24dp.svg",
  [Icon.ANALYSIS]: "icon/query_stats_white_24dp.svg",
  [Icon.DESCRIPTION]: "icon/description_white_24dp.svg",
  [Icon.PLAY]: "icon/play_arrow_FILL1_wght400_GRAD0_opsz48.svg",
  [Icon.CLOSE]: "icon/close_FILL0_wght400_GRAD0_opsz48.svg",
  [Icon.CALL]: "icon/record_voice_over_FILL0_wght400_GRAD0_opsz48.svg",
};

Object.values(iconSourceMap).forEach((source) => {
  preloadImage(source);
});