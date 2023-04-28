import { ordinal } from "@/common/helpers/string";
import { Language } from "./language";

type Texts = {
  electronShogi: string;
  clear: string;
  open: string;
  saveOverwrite: string;
  newRecord: string;
  newRecordWithBrackets: string;
  openRecord: string;
  saveRecord: string;
  saveRecordAs: string;
  openAutoSavingDirectory: string;
  exportPositionImage: string;
  positionImage: string;
  close: string;
  quit: string;
  editing: string;
  copyAsKIF: string;
  copyAsCSA: string;
  copyAsUSI: string;
  copyAsSFEN: string;
  paste: string;
  copyRecord: string;
  asKIF: string;
  asCSA: string;
  asUSIUntilCurrentMove: string;
  asUSIAll: string;
  copyPositionAsSFEN: string;
  pasteRecordOrPosition: string;
  appendSpecialMove: string;
  deleteMoves: string;
  view: string;
  toggleFullScreen: string;
  defaultFontSize: string;
  largerFontSize: string;
  smallerFontSize: string;
  settings: string;
  config: string;
  debug: string;
  toggleDevTools: string;
  openAppDirectory: string;
  openSettingDirectory: string;
  openLogDirectory: string;
  help: string;
  openWebSite: string;
  howToUse: string;
  checkForUpdates: string;
  game: string;
  player: string;
  selectFromHistory: string;
  noHistory: string;
  saveHistory: string;
  version: string;
  gameProgress: string;
  allGamesCompleted: string;
  gameEnded: string;
  offlineGame: string;
  csaOnlineGame: string;
  csaProtocolOnlineGame: string;
  csaProtocolV121: string;
  csaProtocolV121WithPVComment: string;
  hostToConnect: string;
  portNumber: string;
  password: string;
  showPassword: string;
  logout: string;
  displayGameResults: string;
  interrupt: string;
  stopGame: string;
  resign: string;
  draw: string;
  impass: string;
  repetitionDraw: string;
  mate: string;
  mateSearch: string;
  stopMateSearch: string;
  noMateFound: string;
  timeout: string;
  foulWin: string;
  foulLose: string;
  enteringOfKing: string;
  winByDefault: string;
  loseByDefault: string;
  winByDeclaration: string;
  declareWinning: string;
  research: string;
  startResearch: string;
  endResearch: string;
  recordAnalysis: string;
  analysis: string;
  analyze: string;
  stopAnalysis: string;
  setupPosition: string;
  startPositionSetup: string;
  completePositionSetup: string;
  changeTurn: string;
  initializePosition: string;
  appSettings: string;
  language: string;
  theme: string;
  standard: string;
  green: string;
  cherryBlossom: string;
  customImage: string;
  autumn: string;
  snow: string;
  dark: string;
  piece: string;
  singleKanjiPiece: string;
  singleKanjiGothicPiece: string;
  singleKanjiDarkPiece: string;
  singleKanjiGothicDarkPiece: string;
  backgroundImage: string;
  board: string;
  pieceStand: string;
  lightWoodyTexture: string;
  warmWoodTexture: string;
  regin: string;
  displayFileAndRank: string;
  displayLeftControls: string;
  displayRightControls: string;
  tabViewStyle: string;
  oneColumn: string;
  twoColumns: string;
  sounds: string;
  pieceLoudness: string;
  clockLoudness: string;
  clockPitch: string;
  clockSoundTarget: string;
  anyTurn: string;
  onlyHumanTurn: string;
  textEncoding: string;
  strict: string;
  autoDetect: string;
  newlineCharacter: string;
  old90sMac: string;
  autoSavingDirectory: string;
  select: string;
  usiProtocol: string;
  translateOptionName: string;
  functionalOnJapaneseOnly: string;
  maxStartupTime: string;
  forDevelopers: string;
  enableAppLog: string;
  enableUSILog: string;
  enableCSALog: string;
  logLevel: string;
  engineSettings: string;
  flipBoard: string;
  file: string;
  recordFile: string;
  executableFile: string;
  imageFile: string;
  remove: string;
  deleteMove: string;
  recordProperties: string;
  comments: string;
  moveComments: string;
  searchLog: string;
  pv: string;
  mateShort: string;
  displayPVShort: string;
  evaluation: string;
  eval: string;
  estimatedWinRate: string;
  evaluationAndEstimatedWinRate: string;
  swapEachTurnChange: string;
  alwaysSenteIsPositive: string;
  signOfEvaluation: string;
  winRateCoefficient: string;
  hideTabView: string;
  expandTabView: string;
  sente: string;
  senteOrShitate: string;
  gote: string;
  goteOrUwate: string;
  swapSenteGote: string;
  currentPosition: string;
  time: string;
  enableEngineTimeout: string;
  others: string;
  nextTurn: string;
  elapsedTime: string;
  elapsed: string;
  rank: string;
  depth: string;
  searchEngine: string;
  ponder: string;
  numberOfThreads: string;
  multiPV: string;
  startPosition: string;
  maxMoves: string;
  gameRepetition: string;
  autoRelogin: string;
  swapTurnWhenGameRepetition: string;
  outputComments: string;
  saveRecordAutomatically: string;
  adjustBoardToHumanPlayer: string;
  adjustBoardAutomatically: string;
  startGame: string;
  cancelGame: string;
  allottedTime: string;
  byoyomi: string;
  increments: string;
  startEndCriteria: string;
  endCriteria1Move: string;
  outputSettings: string;
  noOutputs: string;
  insertCommentToTop: string;
  appendCommentToBottom: string;
  overwrite: string;
  fromPrefix: string;
  fromSuffix: string;
  toPrefix: string;
  toSuffix: string;
  plyPrefix: string;
  plySuffix: string;
  hoursSuffix: string;
  minutesSuffix: string;
  secondsSuffix: string;
  engineManagement: string;
  engineName: string;
  author: string;
  enginePath: string;
  openDirectory: string;
  displayName: string;
  invoke: string;
  resetToEngineDefaultValues: string;
  defaultValue: string;
  noEngineRegistered: string;
  duplicate: string;
  add: string;
  recommended: string;
  import: string;
  saveAndClose: string;
  save: string;
  saveAs: string;
  cancel: string;
  back: string;
  name: string;
  prediction: string;
  best: string;
  nodes: string;
  hashUsage: string;
  nonHandicap: string;
  lanceHandicap: string;
  rightLanceHandicap: string;
  bishopHandicap: string;
  rookHandicap: string;
  rookLanceHandicap: string;
  twoPiecesHandicap: string;
  fourPiecesHandicap: string;
  sixPiecesHandicap: string;
  eightPiecesHandicap: string;
  tsumeShogi: string;
  doubleKingTsumeShogi: string;
  startDateTime: string;
  endDateTime: string;
  gameDate: string;
  tournament: string;
  strategy: string;
  gameTitle: string;
  timeLimit: string;
  place: string;
  postedOn: string;
  note: string;
  senteShortName: string;
  goteShortName: string;
  opusNo: string;
  opusName: string;
  publishedBy: string;
  publishedOn: string;
  source: string;
  numberOfMoves: string;
  integrity: string;
  recordCategory: string;
  award: string;
  filterByOptionName: string;
  filterByEngineName: string;
  bookStyle: string;
  gameStyle: string;
  none: string;
  bgCover: string;
  bgContain: string;
  bgTile: string;
  inaccuracy: string;
  dubious: string;
  mistake: string;
  blunder: string;
  inaccuracyThreshold: string;
  dubiousThreshold: string;
  mistakeThreshold: string;
  blunderThreshold: string;
  typeCustomTitleHere: string;
  displayEmptyElements: string;
  waitingForNewGame: string;
  tryingToConnectAndLoginToCSAServer: string;
  inBrowserLogsOutputToConsoleAndIgnoreThisSetting: string;
  shouldRestartToApplyLogSettings: string;
  canOpenLogDirectoryFromMenu: string;
  hasNoOldLogCleanUpFeature: string;
  processingPleaseWait: string;
  importingFollowingRecordOrPosition: string;
  supportsKIFCSAUSI: string;
  plesePasteRecordIntoTextArea: string;
  desktopVersionPastesAutomatically: string;
  someLogsDisabled: string;
  logsRecommendedForCSAProtocol: string;
  pleaseEnableLogsAndRestart: string;
  notSendPVOnStandardCSAProtocol: string;
  sendPVDoNotUseOnWCSC: string;
  csaProtocolSendPlaintextPassword: string;
  passwordWillSavedPlaintextBecauseOSSideEncryptionNotAvailable: string;
  pleaseUncheckSaveHistoryIfNotWantSave: string;
  csaProtocolSendPlaintextPasswordRegardlessOfHistory: string;
  areYouSureWantToQuitGames: string;
  areYouSureWantToRequestQuit: string;
  areYouSureWantToClearRecord: string;
  areYouSureWantToDiscardPosition: string;
  youCanNotCloseAppWhileCSAOnlineGame: string;
  fileExtensionNotSupported: string;
  errorOccuredWhileDisconnectingFromCSAServer: string;
  failedToConnectToCSAServer: string;
  disconnectedFromCSAServer: string;
  csaServerLoginDenied: string;
  thisFeatureNotAvailableOnWebApp: string;
  failedToSendGoCommand: string;
  failedToSendPonderCommand: string;
  failedToSendStopCommand: string;
  failedToSaveRecord: string;
  failedToParseSFEN: string;
  failedToDetectRecordFormat: string;
  unknownFileExtension: string;
  emptyRecordInput: string;
  invalidPieceName: string;
  invalidTurn: string;
  invalidMove: string;
  invalidMoveNumber: string;
  invalidDestination: string;
  pieceNotExists: string;
  invalidLine: string;
  invalidHandicap: string;
  invalidBoard: string;
  invalidHandPiece: string;
  invalidUSI: string;
  backgroundImageFileNotSelected: string;
  boardImageFileNotSelected: string;
  pieceStandImageFileNotSelected: string;
  pieceVolumeMustBe0To100Percent: string;
  clockVolumeMustBe0To100Percent: string;
  clockPitchMustBe220To880Hz: string;
  engineTimeoutMustBe1To300Seconds: string;
  coefficientInSigmoidMustBeGreaterThan0: string;
  inaccuracyThresholdMustBe1To100Percent: string;
  dubiousThresholdMustBe1To100Percent: string;
  mistakeThresholdMustBe1To100Percent: string;
  blunderThresholdMustBe1To100Percent: string;
  inaccuracyThresholdMustBeLessThanDubiousThreshold: string;
  dubiousThresholdMustBeLessThanMistakeThreshold: string;
  mistakeThresholdMustBeLessThanBlunderThreshold: string;
  thisEngineNotSupportsMateSearch: string;
  tryToReloginToCSAServerNSecondsLater: (n: number) => string;
  mateInNPlyDoYouWantToDisplay: (n: number) => string;
  errorsOccurred: (n: number) => string;
  between: (a: unknown, b: unknown) => string;
  addNthEngine: (n: number) => string;
  copyOf: (name: string) => string;
  keepLatest: (n: number) => string;
  areYouSureWantToDeleteFollowingMove: (n: number) => string;
  failedToOpenDirectory: (path: string) => string;
  unexpectedEventSenderPleaseReport: (sender: string) => string;
  unexpectedHTTPMethodPleaseReport: (method: string) => string;
  unexpectedRequestURLPleaseReport: (url: string) => string;
  noResponseFromEnginePleaseExtendTimeout: (seconds: number) => string;
};

const ja: Texts = {
  electronShogi: "Electron将棋",
  clear: "初期化",
  open: "開く",
  saveOverwrite: "上書き保存",
  newRecord: "新規棋譜",
  newRecordWithBrackets: "（新規棋譜）",
  openRecord: "棋譜を開く",
  saveRecord: "棋譜を上書き保存",
  saveRecordAs: "棋譜を名前を付けて保存",
  openAutoSavingDirectory: "自動保存先を開く",
  exportPositionImage: "局面図を出力",
  positionImage: "局面図",
  close: "閉じる",
  quit: "終了",
  editing: "編集",
  copyAsKIF: "コピー・KIF",
  copyAsCSA: "コピー・CSA",
  copyAsUSI: "コピー・USI",
  copyAsSFEN: "コピー・SFEN",
  paste: "貼り付け",
  copyRecord: "棋譜コピー",
  asKIF: "KIF形式",
  asCSA: "CSA形式",
  asUSIUntilCurrentMove: "USI形式(現在の指し手まで)",
  asUSIAll: "USI形式(全て)",
  copyPositionAsSFEN: "局面コピー(SFEN形式)",
  pasteRecordOrPosition: "棋譜・局面貼り付け",
  appendSpecialMove: "特殊な指し手",
  deleteMoves: "現在の位置から棋譜を削除",
  view: "表示",
  toggleFullScreen: "全画面表示切り替え",
  defaultFontSize: "標準の文字サイズ",
  largerFontSize: "文字を拡大",
  smallerFontSize: "文字を縮小",
  settings: "設定",
  config: "設定",
  debug: "デバッグ",
  toggleDevTools: "開発者ツール表示切り替え",
  openAppDirectory: "アプリのフォルダを開く",
  openSettingDirectory: "設定ファイルのフォルダを開く",
  openLogDirectory: "ログファイルのフォルダを開く",
  help: "ヘルプ",
  openWebSite: "Webサイトを開く",
  howToUse: "使い方を開く",
  checkForUpdates: "最新バージョンを確認",
  game: "対局",
  player: "プレイヤー",
  selectFromHistory: "履歴から選ぶ",
  noHistory: "履歴がありません",
  saveHistory: "履歴に保存する",
  version: "バージョン",
  gameProgress: "対局の経過",
  allGamesCompleted: "連続対局終了",
  gameEnded: "対局終了",
  offlineGame: "ローカル対局",
  csaOnlineGame: "通信対局（CSA）",
  csaProtocolOnlineGame: "通信対局（CSAプロトコル）",
  csaProtocolV121: "CSAプロトコル1.2.1 標準",
  csaProtocolV121WithPVComment: "CSAプロトコル1.2.1 読み筋コメント付き",
  hostToConnect: "接続先ホスト",
  portNumber: "ポート番号",
  password: "パスワード",
  showPassword: "パスワードを表示する",
  logout: "ログアウト",
  displayGameResults: "戦績確認",
  interrupt: "中断",
  stopGame: "対局中断",
  resign: "投了",
  draw: "引き分け",
  impass: "持将棋",
  repetitionDraw: "千日手",
  mate: "詰み",
  mateSearch: "詰み探索",
  stopMateSearch: "詰み探索終了",
  noMateFound: "詰みが見つかりませんでした。",
  timeout: "時間切れ",
  foulWin: "反則勝ち",
  foulLose: "反則負け",
  enteringOfKing: "入玉勝ち",
  winByDefault: "不戦勝",
  loseByDefault: "不戦敗",
  winByDeclaration: "宣言勝ち",
  declareWinning: "勝ち宣言",
  research: "検討",
  startResearch: "検討開始",
  endResearch: "検討終了",
  recordAnalysis: "棋譜解析",
  analysis: "解析",
  analyze: "解析開始",
  stopAnalysis: "解析中断",
  setupPosition: "局面編集",
  startPositionSetup: "局面編集開始",
  completePositionSetup: "局面編集終了",
  changeTurn: "手番変更",
  initializePosition: "局面の初期化",
  appSettings: "アプリ設定",
  language: "言語",
  theme: "テーマ",
  standard: "標準",
  green: "緑",
  cherryBlossom: "桜",
  customImage: "カスタム画像",
  autumn: "紅葉",
  snow: "雪",
  dark: "ダーク",
  piece: "駒",
  singleKanjiPiece: "一文字駒",
  singleKanjiGothicPiece: "一文字駒（ゴシック体）",
  singleKanjiDarkPiece: "一文字駒（ダーク）",
  singleKanjiGothicDarkPiece: "一文字駒（ゴシック体・ダーク）",
  backgroundImage: "背景画像",
  board: "盤",
  pieceStand: "駒台",
  lightWoodyTexture: "木目（明るい）",
  warmWoodTexture: "木目（暖かい）",
  regin: "レジン",
  displayFileAndRank: "段・筋を表示",
  displayLeftControls: "左側操作ボタンを表示",
  displayRightControls: "右側操作ボタンを表示",
  tabViewStyle: "タブビューの形式",
  oneColumn: "1列",
  twoColumns: "2列",
  sounds: "音",
  pieceLoudness: "駒音の大きさ",
  clockLoudness: "時計音の大きさ",
  clockPitch: "時計音の高さ",
  clockSoundTarget: "時計音の対象",
  anyTurn: "全ての手番",
  onlyHumanTurn: "人間の手番のみ",
  textEncoding: "文字コード",
  strict: "厳格",
  autoDetect: "自動判定",
  newlineCharacter: "改行文字",
  old90sMac: "90年代Mac",
  autoSavingDirectory: "棋譜の自動保存先",
  select: "選択",
  usiProtocol: "USIプロトコル",
  translateOptionName: "オプション名を翻訳",
  functionalOnJapaneseOnly: "日本語選択時のみ有効",
  maxStartupTime: "最大起動待ち時間",
  forDevelopers: "開発者向け",
  enableAppLog: "アプリログを出力",
  enableUSILog: "USI通信ログを出力",
  enableCSALog: "CSA通信ログを出力",
  logLevel: "ログレベル",
  engineSettings: "エンジン設定",
  flipBoard: "盤面反転",
  file: "ファイル",
  recordFile: "棋譜ファイル",
  executableFile: "実行可能ファイル",
  imageFile: "画像ファイル",
  remove: "削除",
  deleteMove: "指し手削除",
  recordProperties: "棋譜情報",
  comments: "コメント",
  moveComments: "指し手コメント",
  searchLog: "思考",
  pv: "読み筋",
  mateShort: "詰",
  displayPVShort: "再現",
  evaluation: "評価値",
  eval: "評価値",
  estimatedWinRate: "期待勝率",
  evaluationAndEstimatedWinRate: "評価値・期待勝率",
  swapEachTurnChange: "手番側有利がプラスの値",
  alwaysSenteIsPositive: "先手有利がプラスの値",
  signOfEvaluation: "評価値の符号",
  winRateCoefficient: "勝率換算係数",
  hideTabView: "最小化",
  expandTabView: "タブビューを再表示",
  sente: "先手",
  senteOrShitate: "先手（下手）",
  gote: "後手",
  goteOrUwate: "後手（上手）",
  swapSenteGote: "先後入れ替え",
  currentPosition: "現在の局面",
  time: "時間",
  enableEngineTimeout: "エンジンの時間切れあり",
  others: "その他",
  nextTurn: "次の手番",
  elapsedTime: "消費時間",
  elapsed: "経過時間",
  rank: "順位",
  depth: "深さ",
  searchEngine: "エンジン",
  ponder: "先読み(Ponder)",
  numberOfThreads: "スレッド数",
  multiPV: "マルチPV",
  startPosition: "開始局面",
  maxMoves: "最大手数",
  gameRepetition: "連続対局",
  autoRelogin: "自動で再ログインする",
  swapTurnWhenGameRepetition: "1局ごとに手番を入れ替える",
  outputComments: "コメントを出力する",
  saveRecordAutomatically: "棋譜を自動で保存する",
  adjustBoardToHumanPlayer: "人を手前に表示する",
  adjustBoardAutomatically: "盤面の向きを自動調整",
  startGame: "対局開始",
  cancelGame: "対局をキャンセル",
  allottedTime: "持ち時間",
  byoyomi: "秒読み",
  increments: "増加",
  startEndCriteria: "開始・終了条件",
  endCriteria1Move: "局面ごとの終了条件",
  outputSettings: "出力設定",
  noOutputs: "出力しない",
  insertCommentToTop: "前方に加筆する",
  appendCommentToBottom: "末尾に加筆する",
  overwrite: "上書きする",
  fromPrefix: "",
  fromSuffix: "から",
  toPrefix: "",
  toSuffix: "まで",
  plyPrefix: "",
  plySuffix: "手目",
  hoursSuffix: "時間",
  minutesSuffix: "分",
  secondsSuffix: "秒",
  engineManagement: "エンジン管理",
  engineName: "エンジン名",
  author: "作者",
  enginePath: "場所",
  openDirectory: "フォルダを開く",
  displayName: "表示名",
  invoke: "実行",
  resetToEngineDefaultValues: "エンジンの既定値に戻す",
  defaultValue: "既定値",
  noEngineRegistered: "エンジンが登録されていません。",
  duplicate: "複製",
  add: "追加",
  recommended: "推奨",
  import: "取り込む",
  saveAndClose: "保存して閉じる",
  save: "保存",
  saveAs: "保存",
  cancel: "キャンセル",
  back: "戻る",
  name: "名前",
  prediction: "予想",
  best: "最善",
  nodes: "Node数",
  hashUsage: "Hash使用率",
  nonHandicap: "平手",
  lanceHandicap: "香落ち",
  rightLanceHandicap: "右香落ち",
  bishopHandicap: "角落ち",
  rookHandicap: "飛車落ち",
  rookLanceHandicap: "飛車香落ち",
  twoPiecesHandicap: "二枚落ち",
  fourPiecesHandicap: "四枚落ち",
  sixPiecesHandicap: "六枚落ち",
  eightPiecesHandicap: "八枚落ち",
  tsumeShogi: "詰将棋",
  doubleKingTsumeShogi: "双玉詰将棋",
  startDateTime: "開始日時",
  endDateTime: "終了日時",
  gameDate: "対局日",
  tournament: "棋戦",
  strategy: "戦型",
  gameTitle: "表題",
  timeLimit: "持ち時間",
  place: "場所",
  postedOn: "掲載",
  note: "備考",
  senteShortName: "先手省略名",
  goteShortName: "後手省略名",
  opusNo: "作品番号",
  opusName: "作品名",
  publishedBy: "発表誌",
  publishedOn: "発表年月",
  source: "出典",
  numberOfMoves: "手数",
  integrity: "完全性",
  recordCategory: "分類",
  award: "受賞",
  filterByOptionName: "オプション名で検索",
  filterByEngineName: "エンジン名で検索",
  bookStyle: "書籍風",
  gameStyle: "対局画面風",
  none: "なし",
  bgCover: "1枚で表示",
  bgContain: "拡大して表示",
  bgTile: "タイル状に表示",
  inaccuracy: "緩手",
  dubious: "疑問手",
  mistake: "悪手",
  blunder: "大悪手",
  inaccuracyThreshold: "緩手の閾値",
  dubiousThreshold: "疑問手の閾値",
  mistakeThreshold: "悪手の閾値",
  blunderThreshold: "大悪手の閾値",
  typeCustomTitleHere: "ここに見出しを入力",
  displayEmptyElements: "未入力の項目を表示",
  waitingForNewGame: "対局開始を待っています。",
  tryingToConnectAndLoginToCSAServer:
    "CSAサーバーへの接続とログインを試みています。",
  inBrowserLogsOutputToConsoleAndIgnoreThisSetting:
    "※ブラウザ版ではログがコンソールに出力され、ここでの設定は無視されます。",
  shouldRestartToApplyLogSettings:
    "※ログ設定の変更を反映するにはアプリの再起動が必要です。",
  canOpenLogDirectoryFromMenu:
    "※ログの出力先は「デバッグ」-「ログファイルの場所を開く」で開きます。",
  hasNoOldLogCleanUpFeature:
    "※現在、古いログファイルの自動削除機能はありません。",
  processingPleaseWait: "処理中です。お待ちください。",
  importingFollowingRecordOrPosition: "以下の棋譜(または局面)を取り込みます。",
  supportsKIFCSAUSI: "※KIF形式/CSA形式/SFENに対応しています。",
  plesePasteRecordIntoTextArea: "※テキストエリアに棋譜を貼り付けてください。",
  desktopVersionPastesAutomatically:
    "※インストールアプリ版では自動的に貼り付けられます。",
  someLogsDisabled: "一部のログが無効になっています。",
  logsRecommendedForCSAProtocol:
    "CSAプロトコルを使用した対局では各種ログの出力を推奨します。",
  pleaseEnableLogsAndRestart:
    "アプリ設定からログを有効にしてアプリを再起動してください。",
  notSendPVOnStandardCSAProtocol:
    "標準のCSAプロトコルでは評価値や読み筋が送信されません。",
  sendPVDoNotUseOnWCSC:
    "Floodgate仕様で評価値と読み筋を送信します。WCSCで使用しないでください。",
  csaProtocolSendPlaintextPassword:
    "CSAプロトコルの規格上パスワードは平文で送信されます。",
  passwordWillSavedPlaintextBecauseOSSideEncryptionNotAvailable:
    "OSの暗号化機能が利用できないため、入力したパスワードは平文で保存されます。",
  pleaseUncheckSaveHistoryIfNotWantSave:
    "保存したくない場合は「履歴に保存する」のチェックを外してください。",
  csaProtocolSendPlaintextPasswordRegardlessOfHistory:
    "なお、履歴の保存に関係なくCSAプロトコルの規格上パスワードは平文で送信されます。",
  areYouSureWantToQuitGames: "連続対局を中断しますか？",
  areYouSureWantToRequestQuit:
    "中断を要求すると負けになる可能性があります。よろしいですか？",
  areYouSureWantToClearRecord: "現在の棋譜は削除されます。よろしいですか？",
  areYouSureWantToDiscardPosition: "現在の局面は破棄されます。よろしいですか？",
  youCanNotCloseAppWhileCSAOnlineGame:
    "CSAプロトコル使用中はアプリを終了できません。",
  fileExtensionNotSupported: "取り扱いできないファイル拡張子です。",
  errorOccuredWhileDisconnectingFromCSAServer:
    "CSAサーバーからの切断中にエラーが発生しました。",
  failedToConnectToCSAServer: "CSAサーバーに接続できませんでした。",
  disconnectedFromCSAServer: "CSAサーバーへの接続が切れました。",
  csaServerLoginDenied: "CSAサーバーへのログインが拒否されました。",
  thisFeatureNotAvailableOnWebApp: "Web版では利用できない機能です。",
  failedToSendGoCommand: "goコマンドを送信できませんでした。",
  failedToSendPonderCommand: "ponderコマンドを送信できませんでした。",
  failedToSendStopCommand: "stopコマンドを送信できませんでした。",
  failedToSaveRecord: "棋譜の保存に失敗しました。",
  failedToParseSFEN: "SFENの読み込みに失敗しました。",
  failedToDetectRecordFormat: "棋譜形式を判別できませんでした。",
  unknownFileExtension: "不明なファイル形式です。",
  emptyRecordInput: "棋譜が入力されていません。",
  invalidPieceName: "不正な駒",
  invalidTurn: "不正な手番",
  invalidMove: "不正な指し手",
  invalidMoveNumber: "不正な手数",
  invalidDestination: "不正な移動先",
  pieceNotExists: "存在しない駒",
  invalidLine: "不正な行",
  invalidHandicap: "不正な手合",
  invalidBoard: "不正な盤面",
  invalidHandPiece: "不正な持ち駒",
  invalidUSI: "不正なUSI",
  backgroundImageFileNotSelected: "背景画像のファイルが選択されていません。",
  boardImageFileNotSelected: "盤面画像のファイルが選択されていません。",
  pieceStandImageFileNotSelected: "駒台画像のファイルが選択されていません。",
  pieceVolumeMustBe0To100Percent:
    "駒音の大きさには0%～100%の値を指定してください。",
  clockVolumeMustBe0To100Percent:
    "時計音の大きさには0%～100%の値を指定してください。",
  clockPitchMustBe220To880Hz:
    "時計音の高さには220Hz～880Hzの値を指定してください。",
  engineTimeoutMustBe1To300Seconds:
    "エンジンのタイムアウト時間には1秒～300秒の値を指定してください。",
  coefficientInSigmoidMustBeGreaterThan0:
    "勝率換算係数には0より大きい値を指定してください。",
  inaccuracyThresholdMustBe1To100Percent:
    "緩手には1%～100%の値を指定してください。",
  dubiousThresholdMustBe1To100Percent:
    "疑問手には1%～100%の値を指定してください。",
  mistakeThresholdMustBe1To100Percent:
    "悪手には1%～100%の閾値を指定してください。",
  blunderThresholdMustBe1To100Percent:
    "大悪手には1%～100%の値を指定してください。",
  inaccuracyThresholdMustBeLessThanDubiousThreshold:
    "緩手には疑問手より小さい値を指定してください。",
  dubiousThresholdMustBeLessThanMistakeThreshold:
    "疑問手には悪手より小さい値を指定してください。",
  mistakeThresholdMustBeLessThanBlunderThreshold:
    "悪手には大悪手より小さい値を指定してください。",
  thisEngineNotSupportsMateSearch:
    "このエンジンは詰将棋探索をサポートしていません。",
  tryToReloginToCSAServerNSecondsLater: (n) =>
    `CSAサーバーへのログインを${n}秒後に再試行します。`,
  mateInNPlyDoYouWantToDisplay: (n) =>
    `${n}手で詰みました。再生画面を表示しますか？`,
  errorsOccurred: (n) => `${n} 種類のエラーが発生しました。`,
  between: (a, b) => `${a} から ${b} まで`,
  addNthEngine: (n) => `${n} 個目のエンジンを追加`,
  copyOf: (name) => `${name} のコピー`,
  keepLatest: (n) => `最新${n}件まで`,
  areYouSureWantToDeleteFollowingMove: (n) =>
    `${n}手目以降を削除します。よろしいですか？`,
  failedToOpenDirectory: (path) => `ファイルの場所を開けませんでした: ${path}`,
  unexpectedEventSenderPleaseReport(sender) {
    return `予期せぬイベントの送信元です。このエラーメッセージを開発者に報告してください。 [${sender}]`;
  },
  unexpectedHTTPMethodPleaseReport(method) {
    return `予期せぬHTTPメソッドです。このエラーメッセージを開発者に報告してください。 [${method}]`;
  },
  unexpectedRequestURLPleaseReport(url) {
    return `予期せぬURLへのリクエストです。このエラーメッセージを開発者に報告してください。 [${url}]`;
  },
  noResponseFromEnginePleaseExtendTimeout(seconds) {
    return `${seconds}秒以内にエンジンから応答がありませんでした。エンジンの起動が重い場合はアプリ設定で待ち時間を延長してください。`;
  },
};

const en: Texts = {
  electronShogi: "Electron Shogi",
  clear: "Clear",
  open: "Open",
  saveOverwrite: "Overwrite",
  newRecord: "New Record",
  newRecordWithBrackets: "(New Record)",
  openRecord: "Open Record",
  saveRecord: "Save Record",
  saveRecordAs: "Save Record As",
  openAutoSavingDirectory: "Open Auto-Saving Directory",
  exportPositionImage: "Export Position Image",
  positionImage: "Position Image",
  close: "Close",
  quit: "Quit",
  editing: "Edit",
  copyAsKIF: "Copy (KIF)",
  copyAsCSA: "Copy (CSA)",
  copyAsUSI: "Copy (USI)",
  copyAsSFEN: "Copy (SFEN)",
  paste: "Paste",
  copyRecord: "Copy Record",
  asKIF: "as KIF",
  asCSA: "as CSA",
  asUSIUntilCurrentMove: "as USI (until current move)",
  asUSIAll: "as USI (all)",
  copyPositionAsSFEN: "Copy Position (as SFEN)",
  pasteRecordOrPosition: "Paste Record/Position",
  appendSpecialMove: "Append Special Move",
  deleteMoves: "Delete Current Move and Following Moves",
  view: "View",
  toggleFullScreen: "Toggle Full Screen",
  defaultFontSize: "Default Font Size",
  largerFontSize: "Larger Font Size",
  smallerFontSize: "Smaller Font Size",
  settings: "Settings",
  config: "Config",
  debug: "Debug",
  toggleDevTools: "Toggle Developer Tools",
  openAppDirectory: "Open App Directory",
  openSettingDirectory: "Open Setting Directory",
  openLogDirectory: "Open Log Directory",
  help: "Help",
  openWebSite: "Open Web Site",
  howToUse: "How to Use",
  checkForUpdates: "Check for Updates",
  game: "Game",
  player: "Player",
  selectFromHistory: "Select from History",
  noHistory: "Empty",
  saveHistory: "Save History",
  version: "Version",
  gameProgress: "Game Progress",
  allGamesCompleted: "All Games Completed",
  gameEnded: "Game Ended",
  offlineGame: "Offline Game",
  csaOnlineGame: "CSA Online Game",
  csaProtocolOnlineGame: "Online Game (CSA Protocol)",
  csaProtocolV121: "CSA Protocol 1.2.1 Standard",
  csaProtocolV121WithPVComment: "CSA Protocol 1.2.1 with PV Comment",
  hostToConnect: "Hostname",
  portNumber: "Port",
  password: "Password",
  showPassword: "Show Password",
  logout: "Logout",
  displayGameResults: "Display Results",
  interrupt: "Stop",
  stopGame: "Stop",
  resign: "Resign",
  draw: "Draw",
  impass: "Impass",
  repetitionDraw: "Repetition Draw",
  mate: "Mate",
  mateSearch: "Mate Search",
  stopMateSearch: "Stop Mate Search",
  noMateFound: "No mate.",
  timeout: "Timeout",
  foulWin: "Foul Win",
  foulLose: "Foul Lose",
  enteringOfKing: "Entering of King",
  winByDefault: "Win by Default",
  loseByDefault: "Lose by Default",
  winByDeclaration: "Win by Declaration",
  declareWinning: "Declare Winning",
  research: "Research",
  startResearch: "Start Research",
  endResearch: "End Research",
  recordAnalysis: "Record Analysis",
  analysis: "Analyze",
  analyze: "Analyze",
  stopAnalysis: "Stop Analysis",
  setupPosition: "Setup Position",
  startPositionSetup: "Start Position Setup",
  completePositionSetup: "Complete Setup",
  changeTurn: "Change Turn",
  initializePosition: "Initialize Position",
  appSettings: "Preferences",
  language: "Languages",
  theme: "Theme",
  standard: "Standard",
  green: "Green",
  cherryBlossom: "Cherry Blossom",
  customImage: "Custom Image",
  autumn: "Autumn",
  snow: "Snow",
  dark: "Dark",
  piece: "Piece",
  singleKanjiPiece: "Single Kanji",
  singleKanjiGothicPiece: "Single Kanji (Gothic)",
  singleKanjiDarkPiece: "Single Kanji (Dark)",
  singleKanjiGothicDarkPiece: "Single Kanji (Gothic, Dark)",
  backgroundImage: "Background Image",
  board: "Board Image",
  pieceStand: "Piece Stand",
  lightWoodyTexture: "Woody Texture (Light)",
  warmWoodTexture: "Woody Texture (Warm)",
  regin: "Regin",
  displayFileAndRank: "Display File & Rank",
  displayLeftControls: "Display Left Controls",
  displayRightControls: "Display Right Controls",
  tabViewStyle: "Tab View Style",
  oneColumn: "1 Column",
  twoColumns: "2 Columns",
  sounds: "Sounds",
  pieceLoudness: "Piece Loudness",
  clockLoudness: "Clock Loudness",
  clockPitch: "Clock Pitch",
  clockSoundTarget: "Clock Sound Target",
  anyTurn: "Any",
  onlyHumanTurn: "Human",
  textEncoding: "Text Encoding",
  strict: "Strict",
  autoDetect: "Auto Detect",
  newlineCharacter: "Newline Character",
  old90sMac: "90's Mac",
  autoSavingDirectory: "Auto-Saving Directory",
  select: "Select",
  usiProtocol: "USI Protocol",
  translateOptionName: "Translate Option Name",
  functionalOnJapaneseOnly: "Functional on Japanese Only",
  maxStartupTime: "Max Startup Time",
  forDevelopers: "For Developers",
  enableAppLog: "Enable App Log",
  enableUSILog: "Enable USI Log",
  enableCSALog: "Enable CSA Log",
  logLevel: "Log Level",
  engineSettings: "Engine Settings",
  flipBoard: "Flip Board",
  file: "File",
  recordFile: "Record File",
  executableFile: "Executable",
  imageFile: "Image",
  remove: "Remove",
  deleteMove: "Delete Move",
  recordProperties: "Record Properties",
  comments: "Comments",
  moveComments: "Move Comments",
  searchLog: "Search Log",
  pv: "PV",
  mateShort: "M",
  displayPVShort: "Play",
  evaluation: "Evaluation",
  eval: "Eval",
  estimatedWinRate: "Estimated Win Rate",
  evaluationAndEstimatedWinRate: "Evaluation & Estimated Win Rate",
  swapEachTurnChange: "Swap Each Turn Change",
  alwaysSenteIsPositive: "Always Sente is Positive",
  signOfEvaluation: "Sign of Evaluation",
  winRateCoefficient: "Win Rate Coefficient",
  hideTabView: "Hide",
  expandTabView: "Expand Tab View",
  sente: "Sente",
  senteOrShitate: "Sente (Shitate)",
  gote: "Gote",
  goteOrUwate: "Gote (Uwate)",
  swapSenteGote: "Swap Sente/Gote",
  currentPosition: "Current Position",
  time: "Time",
  enableEngineTimeout: "Enable Engine Timeout",
  others: "Others",
  nextTurn: "Next Move",
  elapsedTime: "Elapsed Time",
  elapsed: "Elapsed",
  rank: "Rank",
  depth: "Depth",
  searchEngine: "Search Engine",
  ponder: "Ponder",
  numberOfThreads: "Threads",
  multiPV: "Multi PV",
  startPosition: "Position",
  maxMoves: "Max Moves",
  gameRepetition: "Repeat",
  autoRelogin: "Auto Re-Login",
  swapTurnWhenGameRepetition: "Swap Turns When Repeat",
  outputComments: "Output Comments",
  saveRecordAutomatically: "Save Record Automatically",
  adjustBoardToHumanPlayer: "Adjust Board to Human Player",
  adjustBoardAutomatically: "Adjust Board Automatically",
  startGame: "Start Game",
  cancelGame: "Cancel Game",
  allottedTime: "Allotted Time",
  byoyomi: "Byoyomi",
  increments: "Increments",
  startEndCriteria: "Start/End Criteria",
  endCriteria1Move: "End Criteria for 1 Move",
  outputSettings: "Output Settings",
  noOutputs: "No Outputs",
  insertCommentToTop: "Insert to Top",
  appendCommentToBottom: "Append to Bottom",
  overwrite: "Overwrite",
  fromPrefix: "from",
  fromSuffix: "",
  toPrefix: "to",
  toSuffix: "",
  plyPrefix: "string",
  plySuffix: "th move",
  hoursSuffix: "h",
  minutesSuffix: "min",
  secondsSuffix: "sec",
  engineManagement: "Engine Management",
  engineName: "Engine Name",
  author: "Author",
  enginePath: "Engine Path",
  openDirectory: "Open Directory",
  displayName: "Display Name",
  invoke: "Invoke",
  resetToEngineDefaultValues: "Reset to default values",
  defaultValue: "Default Value",
  noEngineRegistered: "No engine",
  duplicate: "Copy",
  add: "Add",
  recommended: "Recommended",
  import: "Import",
  saveAndClose: "Save & Close",
  save: "Save",
  saveAs: "Save As",
  cancel: "Cancel",
  back: "Back",
  name: "Name",
  prediction: "Prediction",
  best: "Best",
  nodes: "Nodes",
  hashUsage: "Hash Usage",
  nonHandicap: "Non-Handicap",
  lanceHandicap: "Lance Handicap",
  rightLanceHandicap: "Right Lance Handicap",
  bishopHandicap: "Bishop Handicap",
  rookHandicap: "Rook Handicap",
  rookLanceHandicap: "Rook-Lance Handicap",
  twoPiecesHandicap: "2 Pieces Handicap",
  fourPiecesHandicap: "4 Pieces Handicap",
  sixPiecesHandicap: "6 Pieces Handicap",
  eightPiecesHandicap: "8 Pieces Handicap",
  tsumeShogi: "Tsume Shogi",
  doubleKingTsumeShogi: "2-Kings Tsume Shogi",
  startDateTime: "Start",
  endDateTime: "End",
  gameDate: "Date",
  tournament: "Tournament",
  strategy: "Strategy",
  gameTitle: "Title",
  timeLimit: "Time Limit",
  place: "Place",
  postedOn: "Posted On",
  note: "Note",
  senteShortName: "Sente(short)",
  goteShortName: "Gote(short)",
  opusNo: "Opus No.",
  opusName: "Opus Name",
  publishedBy: "Published By",
  publishedOn: "Published On",
  source: "Source",
  numberOfMoves: "Number of Moves",
  integrity: "Integrity",
  recordCategory: "Category",
  award: "Award",
  filterByOptionName: "Filter by Option Name",
  filterByEngineName: "Filter by Engine Name",
  bookStyle: "Book Style",
  gameStyle: "Game Style",
  none: "None",
  bgCover: "Cover",
  bgContain: "Contain",
  bgTile: "Tile",
  inaccuracy: "Inaccuracy",
  dubious: "Dubious",
  mistake: "Mistake",
  blunder: "Blunder",
  inaccuracyThreshold: "Inaccuracy Threshold",
  dubiousThreshold: "Dubious Threshold",
  mistakeThreshold: "Mistake Threshold",
  blunderThreshold: "Blunder Threshold",
  typeCustomTitleHere: "Type custom title here",
  displayEmptyElements: "Display Empty Elements",
  waitingForNewGame: "Waiting for new game.",
  tryingToConnectAndLoginToCSAServer:
    "Trying to connect and login to CSA server.",
  inBrowserLogsOutputToConsoleAndIgnoreThisSetting:
    "*In web browser version, it will output logs to console and ignore this setting.",
  shouldRestartToApplyLogSettings:
    "*You should restart this app to apply log settings.",
  canOpenLogDirectoryFromMenu:
    '*You can open log directory from "Debug" - "Open Log Directory" menu.',
  hasNoOldLogCleanUpFeature:
    "*This app has no clean-up feature. Please remove old logs manually.",
  processingPleaseWait: "Processing, please wait.",
  importingFollowingRecordOrPosition:
    "Importing the following record(or position).",
  supportsKIFCSAUSI: "*Supports KIF, CSA, USI.",
  plesePasteRecordIntoTextArea: "*Please paste record data into the text area.",
  desktopVersionPastesAutomatically:
    "*In desktop version, it will paste automatically from clipboard.",
  someLogsDisabled: "Some log settings are disabled.",
  logsRecommendedForCSAProtocol:
    "Log settings are recommended for CSA protocol.",
  pleaseEnableLogsAndRestart:
    "Please enable log settings and restart this app.",
  notSendPVOnStandardCSAProtocol:
    "Client do not send PV on standard CSA protocol.",
  sendPVDoNotUseOnWCSC:
    "Client send PV by floodgate extension. Do not use on WCSC.",
  csaProtocolSendPlaintextPassword:
    "On CSA protocol, client send plaintext password.",
  passwordWillSavedPlaintextBecauseOSSideEncryptionNotAvailable:
    "Password will saved as plaintext because OS side encryption is not available.",
  pleaseUncheckSaveHistoryIfNotWantSave:
    "Please uncheck Save History, if you don't want to save.",
  csaProtocolSendPlaintextPasswordRegardlessOfHistory:
    "On CSA protocol, client send plaintext password regardless of history.",
  areYouSureWantToQuitGames: "Are you sure you want to quit games?",
  areYouSureWantToRequestQuit:
    "You have possibility to be loser. Are you sure you want to request quit?",
  areYouSureWantToClearRecord: "Are you sure you want to clear record?",
  areYouSureWantToDiscardPosition:
    "Are you sure you want to discard the position?",
  youCanNotCloseAppWhileCSAOnlineGame:
    "You can not close app while CSA online game.",
  fileExtensionNotSupported: "File extension is not supported.",
  errorOccuredWhileDisconnectingFromCSAServer:
    "An error occured while disconnecting from CSA server.",
  failedToConnectToCSAServer: "Failed to connect to CSA server.",
  disconnectedFromCSAServer: "Disconnected from CSA server.",
  csaServerLoginDenied: "CSA server login denied.",
  thisFeatureNotAvailableOnWebApp: "This feature is not available on web app.",
  failedToSendGoCommand: "Failed to send go-command.",
  failedToSendPonderCommand: "Failed to send ponder-command.",
  failedToSendStopCommand: "Failed to send stop-command.",
  failedToSaveRecord: "Failed to save record.",
  failedToParseSFEN: "Failed to parse SFEN.",
  failedToDetectRecordFormat: "Failed to detect record format.",
  unknownFileExtension: "Unknown file extension.",
  emptyRecordInput: "Empty record input.",
  invalidPieceName: "Invalid piece name",
  invalidTurn: "Invalid turn",
  invalidMove: "Invalid move",
  invalidMoveNumber: "Invalid move number",
  invalidDestination: "Invalid destination",
  pieceNotExists: "Piece not exists",
  invalidLine: "Invalid line",
  invalidHandicap: "Invalid handicap",
  invalidBoard: "Invalid board",
  invalidHandPiece: "Invalid hand piece",
  invalidUSI: "Invalid USI",
  backgroundImageFileNotSelected: "Background image file is not selected.",
  boardImageFileNotSelected: "Board image file is not selected.",
  pieceStandImageFileNotSelected: "Piece stand image file is not selected.",
  pieceVolumeMustBe0To100Percent: "Piece volume must be 0% to 100%.",
  clockVolumeMustBe0To100Percent: "Clock volume must be 0% to 100%.",
  clockPitchMustBe220To880Hz: "Clock pitch must be 220Hz to 880Hz.",
  engineTimeoutMustBe1To300Seconds: "Engine timeout must be 1 to 300 seconds.",
  coefficientInSigmoidMustBeGreaterThan0:
    "Coefficient in sigmoid must be greater than 0.",
  inaccuracyThresholdMustBe1To100Percent: "Inaccuracy must be 1% to 100%.",
  dubiousThresholdMustBe1To100Percent: "Dubious threshold must be 1% to 100%.",
  mistakeThresholdMustBe1To100Percent: "Mistake threshold must be 1% to 100%.",
  blunderThresholdMustBe1To100Percent: "Blunder threshold must be 1% to 100%.",
  inaccuracyThresholdMustBeLessThanDubiousThreshold:
    "Inaccuracy threshold must be less than dubious threshold.",
  dubiousThresholdMustBeLessThanMistakeThreshold:
    "Dubious threshold must be less than mistake threshold.",
  mistakeThresholdMustBeLessThanBlunderThreshold:
    "Mistake threshold must be less than blunder threshold.",
  thisEngineNotSupportsMateSearch: "This engine does not support mate search.",
  tryToReloginToCSAServerNSecondsLater: (n) =>
    `Try to relogin to CSA server ${n} seconds later.`,
  mateInNPlyDoYouWantToDisplay: (n) =>
    `Mate in ${n} ply. Do you want to display?`,
  errorsOccurred: (n) =>
    n >= 2 ? `${n} errors have occurred.` : `${n} error has occurred.`,
  between: (a, b) => `between ${a} and ${b}`,
  addNthEngine: (n) => `Add ${ordinal(n)} engine`,
  copyOf: (name) => `${name} (copy)`,
  keepLatest: (n) => `keep latest ${n}`,
  areYouSureWantToDeleteFollowingMove: (n) =>
    `Are you sure you want to delete ${n}th move and the following move?`,
  failedToOpenDirectory: (path: string) =>
    `Failed to open directory of the file: ${path}`,
  unexpectedEventSenderPleaseReport(sender) {
    return `Unexpected event sender. Please report this error message to developer. [${sender}]`;
  },
  unexpectedHTTPMethodPleaseReport(method) {
    return `Unexpected HTTP method. Please report this error message to developer. [${method}]`;
  },
  unexpectedRequestURLPleaseReport(url) {
    return `Unexpected request URL. Please report this error message to developer. [${url}]`;
  },
  noResponseFromEnginePleaseExtendTimeout(seconds) {
    return `No response from engine while ${seconds} seconds. Please extend timeout at app settings, if your engine is slow.`;
  },
};

const zh_tw: Texts = {
  electronShogi: "Electron將棋",
  clear: "清除",
  open: "開啟",
  saveOverwrite: "覆蓋檔案",
  newRecord: "新棋譜",
  newRecordWithBrackets: "（新棋譜）",
  openRecord: "打開棋譜",
  saveRecord: "保存棋譜",
  saveRecordAs: "另存棋譜",
  openAutoSavingDirectory: "打開自動保存目錄",
  exportPositionImage: "輸出局面圖",
  positionImage: "局面圖",
  close: "關閉",
  quit: "離開",
  editing: "編輯",
  copyAsKIF: "複製KIF棋譜",
  copyAsCSA: "複製CSA棋譜",
  copyAsUSI: "複製USI棋譜",
  copyAsSFEN: "複製SFEN局面",
  paste: "貼上",
  copyRecord: "複製棋譜",
  asKIF: "KIF形式",
  asCSA: "CSA形式",
  asUSIUntilCurrentMove: "USI形式(到目前手數為止)",
  asUSIAll: "USI形式(全部)",
  copyPositionAsSFEN: "複製局面(SFEN形式)",
  pasteRecordOrPosition: "貼上棋譜、局面",
  appendSpecialMove: "特殊手",
  deleteMoves: "刪除現在位置後的棋譜",
  view: "表示",
  toggleFullScreen: "切換全螢幕",
  defaultFontSize: "預設字體尺寸",
  largerFontSize: "增加字體尺寸",
  smallerFontSize: "縮小字體尺寸",
  settings: "設定",
  config: "設定",
  debug: "偵錯",
  toggleDevTools: "打開/關閉開發者工具顯示",
  openAppDirectory: "顯示本程式所在資料夾",
  openSettingDirectory: "開啟設定檔案所在資料夾",
  openLogDirectory: "開啟紀錄檔(log)所在資料夾",
  help: "協助",
  openWebSite: "官方網站",
  howToUse: "使用教學",
  checkForUpdates: "檢查最新版本",
  game: "對局",
  player: "玩家",
  selectFromHistory: "從紀錄選取",
  noHistory: "目前沒有紀錄",
  saveHistory: "保存紀錄",
  version: "版本",
  gameProgress: "對局過程",
  allGamesCompleted: "連續對局結束",
  gameEnded: "對局結束",
  offlineGame: "本地（單機）對局",
  csaOnlineGame: "通訊對局（CSA）",
  csaProtocolOnlineGame: "通訊對局（CSA協定）",
  csaProtocolV121: "CSA協定 1.2.1 標準",
  csaProtocolV121WithPVComment: "CSA協定 1.2.1 +思考註解",
  hostToConnect: "連接之伺服器",
  portNumber: "連接埠號碼",
  password: "密碼",
  showPassword: "顯示密碼",
  logout: "登出",
  displayGameResults: "確認戰績",
  interrupt: "中斷",
  stopGame: "對局中斷",
  resign: "投了",
  draw: "平手",
  impass: "持将棋",
  repetitionDraw: "千日手",
  mate: "詰死",
  mateSearch: "詰み探索", // TODO: translate
  stopMateSearch: "詰み探索終了", // TODO: translate
  noMateFound: "詰みが見つかりませんでした。", // TODO: translate
  timeout: "時間耗盡",
  foulWin: "反則勝利",
  foulLose: "反則敗北",
  enteringOfKing: "入玉勝利",
  winByDefault: "不戰勝",
  loseByDefault: "不戰敗",
  winByDeclaration: "宣言勝利",
  declareWinning: "勝利宣言",
  research: "檢討",
  startResearch: "檢討開始",
  endResearch: "結束檢討",
  recordAnalysis: "棋譜解析",
  analysis: "解析",
  analyze: "解析開始",
  stopAnalysis: "中斷解析",
  setupPosition: "編輯局面",
  startPositionSetup: "開始編輯局面",
  completePositionSetup: "結束編輯局面",
  changeTurn: "變更手番",
  initializePosition: "初始化局面",
  appSettings: "程式設定",
  language: "語言",
  theme: "主題",
  standard: "標準",
  green: "綠色",
  cherryBlossom: "櫻花",
  customImage: "自定義圖片",
  autumn: "紅葉",
  snow: "雪",
  dark: "深色主題",
  piece: "棋駒",
  singleKanjiPiece: "一文字駒",
  singleKanjiGothicPiece: "一文字駒（黑體）",
  singleKanjiDarkPiece: "一文字駒（深色）",
  singleKanjiGothicDarkPiece: "一文字駒（黑體・深色）",
  backgroundImage: "背景圖片",
  board: "盤",
  pieceStand: "駒台",
  lightWoodyTexture: "木目（明亮）",
  warmWoodTexture: "木目（暖色）",
  regin: "樹脂",
  displayFileAndRank: "顯示段・筋",
  displayLeftControls: "顯示左側操作按鈕",
  displayRightControls: "顯示右側操作按鈕",
  tabViewStyle: "分頁顯示形式",
  oneColumn: "1列",
  twoColumns: "2列",
  sounds: "音效",
  pieceLoudness: "棋駒音效",
  clockLoudness: "棋鐘音效大小",
  clockPitch: "棋鐘音效頻率",
  clockSoundTarget: "棋鐘音效對象",
  anyTurn: "所有手番",
  onlyHumanTurn: "只有玩家手番",
  textEncoding: "文字コード", // TODO: translate
  strict: "厳格", // TODO: translate
  autoDetect: "自動判定", // TODO: translate
  newlineCharacter: "換行符號",
  old90sMac: "90年代Mac",
  autoSavingDirectory: "棋譜自動保存地點",
  select: "選擇",
  usiProtocol: "USI協定",
  translateOptionName: "選項名稱翻譯",
  functionalOnJapaneseOnly: "只有在日文選擇時有效",
  maxStartupTime: "最大起動等待時間",
  forDevelopers: "開發者用",
  enableAppLog: "輸出程式 log",
  enableUSILog: "輸出USI通信 log",
  enableCSALog: "輸出CSA通信 log",
  logLevel: "log 等級",
  engineSettings: "引擎設定",
  flipBoard: "盤面反轉",
  file: "檔案",
  recordFile: "棋譜檔案",
  executableFile: "可執行檔案",
  imageFile: "圖片檔案",
  remove: "刪除",
  deleteMove: "刪除該手",
  recordProperties: "棋譜情報",
  comments: "備註",
  moveComments: "棋步備註",
  searchLog: "思考",
  pv: "読み筋",
  mateShort: "詰死",
  displayPVShort: "再現",
  evaluation: "評價值",
  eval: "評價値",
  estimatedWinRate: "期待勝率",
  evaluationAndEstimatedWinRate: "評價値・期待勝率",
  swapEachTurnChange: "手番側有利時為正值",
  alwaysSenteIsPositive: "先手有利時為正值",
  signOfEvaluation: "評價值符號",
  winRateCoefficient: "勝率換算係數",
  hideTabView: "最小化",
  expandTabView: "展開分頁",
  sente: "先手",
  senteOrShitate: "先手（下手）",
  gote: "後手",
  goteOrUwate: "後手（上手）",
  swapSenteGote: "先後交換",
  currentPosition: "現在局面",
  time: "時間",
  enableEngineTimeout: "開啟引擎時間限制",
  others: "其他",
  nextTurn: "下一手手番",
  elapsedTime: "消費時間",
  elapsed: "經過時間",
  rank: "順位",
  depth: "深度",
  searchEngine: "引擎",
  ponder: "對方手番時運算(Ponder)",
  numberOfThreads: "執行緒數",
  multiPV: "多重PV",
  startPosition: "開始局面",
  maxMoves: "最大手數",
  gameRepetition: "連續対局",
  autoRelogin: "自動重新登入",
  swapTurnWhenGameRepetition: "每局交換手番",
  outputComments: "輸出備註",
  saveRecordAutomatically: "自動保存棋譜",
  adjustBoardToHumanPlayer: "調整到玩家所在方向",
  adjustBoardAutomatically: "自動調整盤面方向",
  startGame: "對局開始",
  cancelGame: "対局をキャンセル", // TODO: translate
  allottedTime: "持時間",
  byoyomi: "讀秒",
  increments: "增秒",
  startEndCriteria: "開始・結束條件",
  endCriteria1Move: "局面結束條件",
  outputSettings: "輸出設定",
  noOutputs: "不輸出",
  insertCommentToTop: "加入到前方",
  appendCommentToBottom: "在後方新增",
  overwrite: "覆寫原檔案",
  fromPrefix: "從",
  fromSuffix: "",
  toPrefix: "到",
  toSuffix: "",
  plyPrefix: "第",
  plySuffix: "手",
  hoursSuffix: "時間",
  minutesSuffix: "分",
  secondsSuffix: "秒",
  engineManagement: "引擎管理",
  engineName: "引擎名稱",
  author: "作者",
  enginePath: "場所",
  openDirectory: "開啟資料夾",
  displayName: "表示名稱",
  invoke: "執行",
  resetToEngineDefaultValues: "回復至引擎預設設定",
  defaultValue: "預設値",
  noEngineRegistered: "尚未登錄引擎。",
  duplicate: "複製",
  add: "追加",
  recommended: "推薦",
  import: "匯入",
  saveAndClose: "保存並關閉",
  save: "保存",
  saveAs: "另存為",
  cancel: "取消",
  back: "返回",
  name: "名稱",
  prediction: "預測",
  best: "最善",
  nodes: "Node數",
  hashUsage: "Hash使用率",
  nonHandicap: "平手",
  lanceHandicap: "香落",
  rightLanceHandicap: "右香落",
  bishopHandicap: "角落",
  rookHandicap: "飛車落",
  rookLanceHandicap: "飛車香落",
  twoPiecesHandicap: "二枚落",
  fourPiecesHandicap: "四枚落",
  sixPiecesHandicap: "六枚落",
  eightPiecesHandicap: "八枚落",
  tsumeShogi: "詰將棋",
  doubleKingTsumeShogi: "雙玉詰將棋",
  startDateTime: "開始日時",
  endDateTime: "結束日時",
  gameDate: "對局日",
  tournament: "棋戰",
  strategy: "戰型",
  gameTitle: "標題",
  timeLimit: "持時間",
  place: "場所",
  postedOn: "登錄於",
  note: "備註",
  senteShortName: "先手省略名",
  goteShortName: "後手省略名",
  opusNo: "作品編號",
  opusName: "作品名",
  publishedBy: "發表於",
  publishedOn: "發表年月",
  source: "來源",
  numberOfMoves: "手數",
  integrity: "完全性",
  recordCategory: "分類",
  award: "受賞",
  filterByOptionName: "搜尋設定名稱",
  filterByEngineName: "搜尋引擎名稱",
  bookStyle: "書籍風",
  gameStyle: "對局畫面風",
  none: "無",
  bgCover: "僅顯示原圖片",
  bgContain: "擴大表示",
  bgTile: "磁磚狀表示",
  inaccuracy: "緩手",
  dubious: "疑問手",
  mistake: "惡手",
  blunder: "大惡手",
  inaccuracyThreshold: "緩手閾値",
  dubiousThreshold: "疑問手閾値",
  mistakeThreshold: "惡手閾値",
  blunderThreshold: "大惡手閾値",
  typeCustomTitleHere: "輸入自定義標題",
  displayEmptyElements: "顯示未定義資料",
  waitingForNewGame: "対局開始を待っています。", // TODO: translate
  tryingToConnectAndLoginToCSAServer:
    "CSAサーバーへの接続とログインを試みています。", // TODO: translate
  inBrowserLogsOutputToConsoleAndIgnoreThisSetting:
    "※在瀏覽器版本中 log 會於 console 中顯示，並無視此處的設定。",
  shouldRestartToApplyLogSettings:
    "※您需要重新啟動本程式以使用變更後的 log 設定。",
  canOpenLogDirectoryFromMenu:
    "※log 的輸出檔案可以在「偵錯」-「開啟紀錄檔案資料夾」開啟。",
  hasNoOldLogCleanUpFeature: "※現在並沒有舊 log 的自動刪除機制。",
  processingPleaseWait: "現在處理中。請稍待一會。",
  importingFollowingRecordOrPosition: "將匯入以下棋譜（局面）。",
  supportsKIFCSAUSI: "※支援KIF/CSA/SFEN形式。",
  plesePasteRecordIntoTextArea: "※請在文字輸入區域貼上您的棋譜。",
  desktopVersionPastesAutomatically: "※安裝程式版將會自動貼上棋譜。",
  someLogsDisabled: "部份 log 已被無效化。",
  logsRecommendedForCSAProtocol: "若使用CSA協定對局，建議輸出各項 log 。",
  pleaseEnableLogsAndRestart: "請在程式設定中開啟 log 並重新啟動本程式。",
  notSendPVOnStandardCSAProtocol:
    "在標準的CSA協定中不會送出評價值以及思考棋步。",
  sendPVDoNotUseOnWCSC:
    "使用Floodgate形式傳送評價值與思考棋步。請不要在WCSC中使用。",
  csaProtocolSendPlaintextPassword: "在CSA協定中，密碼為明文傳輸。",
  passwordWillSavedPlaintextBecauseOSSideEncryptionNotAvailable:
    "由於無法使用系統的加密機能，輸入的密碼將會以明文保存。",
  pleaseUncheckSaveHistoryIfNotWantSave:
    "若不想保存密碼，請不要將「保存紀錄」勾選。",
  csaProtocolSendPlaintextPasswordRegardlessOfHistory:
    "不過，CSA協定仍會以明文傳輸您的密碼。",
  areYouSureWantToQuitGames: "要中斷連續對局嗎？",
  areYouSureWantToRequestQuit: "若提出中斷要求，可能會被判負。請問您要繼續嗎？",
  areYouSureWantToClearRecord: "將會刪除現在的棋譜。請問您要繼續嗎？",
  areYouSureWantToDiscardPosition: "將不會保存現在的局面。請問您要繼續嗎？",
  youCanNotCloseAppWhileCSAOnlineGame:
    "由於CSA協定正在使用中，本程式無法被關閉。",
  fileExtensionNotSupported: "無法支援的副檔名。",
  errorOccuredWhileDisconnectingFromCSAServer:
    "在與CSA伺服器中斷連線時發生錯誤。",
  failedToConnectToCSAServer: "無法連接CSA伺服器。",
  disconnectedFromCSAServer: "與CSA伺服器的連接結束。",
  csaServerLoginDenied: "您對CSA伺服器的登入被拒絕。",
  thisFeatureNotAvailableOnWebApp: "Web版無法使用本機能",
  failedToSendGoCommand: "無法送出go指令。",
  failedToSendPonderCommand: "無法送出ponder指令。",
  failedToSendStopCommand: "無法送出stop指令。",
  failedToSaveRecord: "棋譜保存失敗。",
  failedToParseSFEN: "SFEN讀取失敗。",
  failedToDetectRecordFormat: "無法判別棋譜形式。",
  unknownFileExtension: "未知的檔案形式。",
  emptyRecordInput: "您尚未輸入棋譜。",
  invalidPieceName: "不合法的棋駒",
  invalidTurn: "不合法的手番",
  invalidMove: "不合法的棋步",
  invalidMoveNumber: "不合法的手數",
  invalidDestination: "不合法的移動目的地",
  pieceNotExists: "不存在的棋駒",
  invalidLine: "不存在的行",
  invalidHandicap: "不合法的手合配置",
  invalidBoard: "不合法的盤面",
  invalidHandPiece: "不合法的持駒",
  invalidUSI: "不合法的USI",
  backgroundImageFileNotSelected: "尚未選取背景圖片。",
  boardImageFileNotSelected: "尚未選取盤面圖片。",
  pieceStandImageFileNotSelected: "尚未選取駒台圖片。",
  pieceVolumeMustBe0To100Percent: "請在0%～100%之間指定棋駒音效大小。",
  clockVolumeMustBe0To100Percent: "請在0%～100%之間指定棋鐘音效大小。",
  clockPitchMustBe220To880Hz: "請在220Hz～880Hz之間指定棋鐘音效頻率。",
  engineTimeoutMustBe1To300Seconds: "請在1秒～300秒之間指定引擎執行最長時間。",
  coefficientInSigmoidMustBeGreaterThan0: "請將勝率換算係數填為大於0之值。",
  inaccuracyThresholdMustBe1To100Percent: "請在0%～100%之間指定緩手門檻。",
  dubiousThresholdMustBe1To100Percent: "請在0%～100%之間指定疑問手門檻。",
  mistakeThresholdMustBe1To100Percent: "請在0%～100%之間指定惡手門檻。",
  blunderThresholdMustBe1To100Percent: "請在0%～100%之間指定大惡手門檻。",
  inaccuracyThresholdMustBeLessThanDubiousThreshold:
    "緩手門檻應小於疑問手門檻。",
  dubiousThresholdMustBeLessThanMistakeThreshold: "疑問手門檻應小於惡手門檻。",
  mistakeThresholdMustBeLessThanBlunderThreshold: "惡手門檻應小於大惡手門檻。",
  thisEngineNotSupportsMateSearch:
    "このエンジンは詰将棋探索をサポートしていません。", // TODO: translate
  tryToReloginToCSAServerNSecondsLater: (n) =>
    `CSAサーバーへのログインを${n}秒後に再試行します。`, // TODO: translate
  mateInNPlyDoYouWantToDisplay: (n) =>
    `${n}手で詰みました。再生画面を表示しますか？`, // TODO: translate
  errorsOccurred: (n) => `發生 ${n} 種類的錯誤。`,
  between: (a, b) => `自 ${a} 到 ${b} `,
  addNthEngine: (n) => `追加第 ${n} 個引擎`,
  copyOf: (name) => `${name} 的拷貝`,
  keepLatest: (n) => `到最新${n}件`,
  areYouSureWantToDeleteFollowingMove: (n) =>
    `將會刪除${n}手目以後的棋譜。請問您要繼續嗎？`,
  failedToOpenDirectory: (path) => `無法開啟檔案目錄：${path}`,
  unexpectedEventSenderPleaseReport(sender) {
    return `無法預期的事件發送方已發生。請將該錯誤訊息告知開發者，謝謝。 [${sender}]`;
  },
  unexpectedHTTPMethodPleaseReport(method) {
    return `無法預期的 HTTP 方法。請將該錯誤訊息告知開發者，謝謝。 [${method}]`;
  },
  unexpectedRequestURLPleaseReport(url) {
    return `無法從 URL 獲取資訊。請將該錯誤訊息告知開發者，謝謝。 [${url}]`;
  },
  noResponseFromEnginePleaseExtendTimeout(seconds) {
    return `引擎在${seconds}秒内沒有回應。若引擎的啟動時間稍長，請在設定中調整引擎最長等待時間。`;
  },
};
export const t = ja;

function getTranslationTable(language: Language): Texts {
  switch (language) {
    case Language.JA:
      return ja;
    case Language.EN:
      return en;
    case Language.ZH_TW:
      return zh_tw;
    default:
      return ja;
  }
}

export function setLanguage(lang: Language) {
  Object.entries(getTranslationTable(lang)).forEach(([key, value]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t as any)[key] = value;
  });
}
