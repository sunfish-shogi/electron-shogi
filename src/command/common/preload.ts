/* eslint-disable no-console */
import { LogDestination, getAppLogger, overrideLogDestinations } from "@/background/log";
import {
  login as csaLogin,
  logout as csaLogout,
  agree as csaAgree,
  doMove as csaMove,
  resign as csaResign,
  win as csaWin,
  stop as csaStop,
  setHandlers as setCSAHandlers,
} from "@/background/csa";
import {
  ready as usiReady,
  go as usiGo,
  setHandlers as setUSIHandlers,
  setupPlayer as usiSetupPlayer,
  goPonder as usiGoPonder,
  ponderHit as usiPonderHit,
  goInfinite as usiGoInfinite,
  goMate as usiGoMate,
  stop as usiStop,
  gameover as usiGameover,
  quit as usiQuit,
} from "@/background/usi";
import { GameResult } from "@/common/game/result";
import { LogLevel, LogType } from "@/common/log";
import { USIEngineSetting } from "@/common/settings/usi";
import { Bridge } from "@/renderer/ipc/bridge";

type Config = {
  appLogFile: boolean;
  usiLogFile: boolean;
  csaLogFile: boolean;
  stdoutLog: boolean;
};

export function preload(config: Config) {
  const fileAndStdout: LogDestination[] = config.stdoutLog ? ["file", "stdout"] : ["file"];
  const appDestinations: LogDestination[] = config.appLogFile ? fileAndStdout : ["stdout"];
  const usiDestinations: LogDestination[] = config.usiLogFile ? fileAndStdout : ["stdout"];
  const csaDestinations: LogDestination[] = config.csaLogFile ? fileAndStdout : ["stdout"];
  overrideLogDestinations(LogType.APP, appDestinations);
  overrideLogDestinations(LogType.USI, usiDestinations);
  overrideLogDestinations(LogType.CSA, csaDestinations);

  const bridge: Bridge = {
    async fetchInitialRecordFileRequest(): Promise<string> {
      return "null";
    },
    updateAppState(): void {
      // DO NOTHING
    },
    openExplorer() {
      throw new Error("This feature is not available on command line tool");
    },
    openWebBrowser() {
      throw new Error("This feature is not available on command line tool");
    },
    async showOpenRecordDialog(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async openRecord(): Promise<Uint8Array> {
      throw new Error("This feature is not available on command line tool");
    },
    async showSaveRecordDialog(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveRecord(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async showSelectFileDialog(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async showSelectDirectoryDialog(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async showSelectImageDialog(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async showSaveMergedRecordDialog(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async cropPieceImage(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async exportCaptureAsPNG(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async exportCaptureAsJPEG(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async convertRecordFiles(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadAppSetting(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveAppSetting(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadBatchConversionSetting(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveBatchConversionSetting(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadResearchSetting(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveResearchSetting(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadAnalysisSetting(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveAnalysisSetting(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadGameSetting(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveGameSetting(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadCSAGameSettingHistory(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveCSAGameSettingHistory(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadMateSearchSetting(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveMateSearchSetting(): Promise<void> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadRecordFileHistory(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    addRecordFileHistory(): void {
      // Do Nothing
    },
    async clearRecordFileHistory(): Promise<void> {
      // Do Nothing
    },
    async saveRecordFileBackup(): Promise<void> {
      // Do Nothing
    },
    async loadRecordFileBackup(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async loadUSIEngineSetting(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async saveUSIEngineSetting(): Promise<void> {
      // Do Nothing
    },
    async showSelectUSIEngineDialog(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async getUSIEngineInfo(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async sendUSISetOption(): Promise<void> {
      // Do Nothing
    },
    async usiLaunch(json: string, timeoutSeconds: number): Promise<number> {
      const setting = JSON.parse(json) as USIEngineSetting;
      return await usiSetupPlayer(setting, timeoutSeconds);
    },
    async usiReady(sessionID: number): Promise<void> {
      return await usiReady(sessionID);
    },
    async usiGo(
      sessionID: number,
      usi: string,
      json: string,
      blackTimeMs: number,
      whiteTimeMs: number,
    ): Promise<void> {
      usiGo(sessionID, usi, JSON.parse(json), blackTimeMs, whiteTimeMs);
    },
    async usiGoPonder(
      sessionID: number,
      usi: string,
      json: string,
      blackTimeMs: number,
      whiteTimeMs: number,
    ): Promise<void> {
      usiGoPonder(sessionID, usi, JSON.parse(json), blackTimeMs, whiteTimeMs);
    },
    async usiPonderHit(sessionID: number): Promise<void> {
      usiPonderHit(sessionID);
    },
    async usiGoInfinite(sessionID: number, usi: string): Promise<void> {
      usiGoInfinite(sessionID, usi);
    },
    async usiGoMate(sessionID: number, usi: string): Promise<void> {
      usiGoMate(sessionID, usi);
    },
    async usiStop(sessionID: number): Promise<void> {
      usiStop(sessionID);
    },
    async usiGameover(sessionID: number, result: GameResult): Promise<void> {
      usiGameover(sessionID, result);
    },
    async usiQuit(sessionID: number): Promise<void> {
      usiQuit(sessionID);
    },
    async csaLogin(json: string): Promise<number> {
      return csaLogin(JSON.parse(json));
    },
    async csaLogout(sessionID: number): Promise<void> {
      csaLogout(sessionID);
    },
    async csaAgree(sessionID: number, gameID: string): Promise<void> {
      csaAgree(sessionID, gameID);
    },
    async csaMove(sessionID: number, move: string, score?: number, pv?: string): Promise<void> {
      csaMove(sessionID, move, score, pv);
    },
    async csaResign(sessionID: number): Promise<void> {
      csaResign(sessionID);
    },
    async csaWin(sessionID: number): Promise<void> {
      csaWin(sessionID);
    },
    async csaStop(sessionID: number): Promise<void> {
      csaStop(sessionID);
    },
    async collectSessionStates(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async setupPrompt(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    async openPrompt() {
      throw new Error("This feature is not available on command line tool");
    },
    invokePromptCommand(): void {
      throw new Error("This feature is not available on command line tool");
    },
    async isEncryptionAvailable(): Promise<boolean> {
      return false;
    },
    async getVersionStatus(): Promise<string> {
      throw new Error("This feature is not available on command line tool");
    },
    sendTestNotification(): void {
      throw new Error("This feature is not available on command line tool");
    },
    openLogFile(): void {
      // Do Nothing
    },
    log(level: LogLevel, message: string): void {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(message);
          break;
        case LogLevel.INFO:
          console.log(message);
          break;
        case LogLevel.WARN:
          console.warn(message);
          break;
        case LogLevel.ERROR:
          console.error(message);
          break;
      }
    },
    onClosable(): void {
      // Do Nothing
    },
    onClose(): void {
      // Do Nothing
    },
    onSendError(): void {
      // Do Nothing
    },
    onMenuEvent(): void {
      // Do Nothing
    },
    updateAppSetting(): void {
      // Do Nothing
    },
    onOpenRecord(): void {
      // Do Nothing
    },
    onUSIBestMove(): void {
      // Do Nothing
    },
    onUSICheckmate(): void {
      // Do Nothing
    },
    onUSICheckmateNotImplemented(): void {
      // Do Nothing
    },
    onUSICheckmateTimeout(): void {
      // Do Nothing
    },
    onUSINoMate(): void {
      // Do Nothing
    },
    onUSIInfo(): void {
      // Do Nothing
    },
    onUSIPonderInfo(): void {
      // Do Nothing
    },
    onCSAGameSummary(): void {
      // Do Nothing
    },
    onCSAReject(): void {
      // Do Nothing
    },
    onCSAStart(): void {
      // Do Nothing
    },
    onCSAMove(): void {
      // Do Nothing
    },
    onCSAGameResult(): void {
      // Do Nothing
    },
    onCSAClose(): void {
      // Do Nothing
    },
    onPromptCommand(): void {
      // Do Nothing
    },
  };

  global.window = {
    ...global,
    electronShogiAPI: bridge,
  } as unknown as Window & typeof globalThis;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const usi = require("@/renderer/players/usi");
  setUSIHandlers({
    onUSIBestMove: usi.onUSIBestMove,
    onUSICheckmate: usi.onUSICheckmate,
    onUSICheckmateNotImplemented: usi.onUSICheckmateNotImplemented,
    onUSICheckmateTimeout: usi.onUSICheckmateTimeout,
    onUSINoMate: usi.onUSINoMate,
    onUSIInfo: usi.onUSIInfo,
    onUSIPonderInfo: usi.onUSIPonderInfo,
    sendPromptCommand: () => {},
  });
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const csa = require("@/renderer/store/csa");
  setCSAHandlers({
    onCSAGameSummary: csa.onCSAGameSummary,
    onCSAReject: csa.onCSAReject,
    onCSAStart: csa.onCSAStart,
    onCSAMove: csa.onCSAMove,
    onCSAGameResult: csa.onCSAGameResult,
    onCSAClose: csa.onCSAClose,
    sendPromptCommand: () => {},
    sendError: (error: Error) => {
      getAppLogger().error(error);
    },
  });
}
