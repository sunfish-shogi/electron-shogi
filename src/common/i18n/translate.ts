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
  standardGreen: string;
  green: string;
  cherryBlossom: string;
  autumn: string;
  snow: string;
  dark: string;
  pieceImages: string;
  singleKanjiPiece: string;
  singleKanjiGothicPiece: string;
  singleKanjiDarkPiece: string;
  singleKanjiGothicDarkPiece: string;
  boardImage: string;
  lightWoodyTexture: string;
  warmWoodTexture: string;
  regin: string;
  displayFileAndRank: string;
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
  newlineCharacter: string;
  old90sMac: string;
  autoSavingDirectory: string;
  select: string;
  usiProtocol: string;
  translateOptionName: string;
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
  startCriteria: string;
  endCriteria: string;
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
  typeCustomTitleHere: string;
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
  offlineGame: "オフライン対局",
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
  standardGreen: "標準（緑）",
  green: "緑",
  cherryBlossom: "桜",
  autumn: "紅葉",
  snow: "雪",
  dark: "ダーク",
  pieceImages: "駒画像",
  singleKanjiPiece: "一文字駒",
  singleKanjiGothicPiece: "一文字駒（ゴシック体）",
  singleKanjiDarkPiece: "一文字駒（ダーク）",
  singleKanjiGothicDarkPiece: "一文字駒（ゴシック体・ダーク）",
  boardImage: "盤画像",
  lightWoodyTexture: "木目（明るい）",
  warmWoodTexture: "木目（暖かい）",
  regin: "レジン",
  displayFileAndRank: "段・筋を表示",
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
  newlineCharacter: "改行文字",
  old90sMac: "90年代Mac",
  autoSavingDirectory: "棋譜の自動保存先",
  select: "選択",
  usiProtocol: "USIプロトコル",
  translateOptionName: "オプション名を翻訳",
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
  adjustBoardAutomatically: "盤面の向きを自動で調整する",
  startGame: "対局開始",
  startCriteria: "開始条件",
  endCriteria: "終了条件",
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
  typeCustomTitleHere: "ここに見出しを入力",
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
  standardGreen: "Standard (Green)",
  green: "Green",
  cherryBlossom: "Cherry Blossom",
  autumn: "Autumn",
  snow: "Snow",
  dark: "Dark",
  pieceImages: "Piece Images",
  singleKanjiPiece: "Single Kanji",
  singleKanjiGothicPiece: "Single Kanji (Gothic)",
  singleKanjiDarkPiece: "Single Kanji (Dark)",
  singleKanjiGothicDarkPiece: "Single Kanji (Gothic, Dark)",
  boardImage: "Board Image",
  lightWoodyTexture: "Woody Texture (Light)",
  warmWoodTexture: "Woody Texture (Warm)",
  regin: "Regin",
  displayFileAndRank: "Display File & Rank",
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
  newlineCharacter: "Newline Character",
  old90sMac: "90's Mac",
  autoSavingDirectory: "Auto-Saving Directory",
  select: "Select",
  usiProtocol: "USI Protocol",
  translateOptionName: "Translate Option Name",
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
  startCriteria: "Start Criteria",
  endCriteria: "End Criteria",
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
  typeCustomTitleHere: "Type custom title here",
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

export const t = ja;

function getTranslationTable(language: Language): Texts {
  switch (language) {
    case Language.JA:
      return ja;
    case Language.EN:
      return en;
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
