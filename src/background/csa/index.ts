import { CSAServerSetting } from "@/common/settings/csa";
import {
  onCSAClose,
  onCSAGameResult,
  onCSAGameSummary,
  onCSAMove,
  onCSAReject,
  onCSAStart,
  sendError,
  sendPromptCommand,
} from "@/background/window/ipc";
import { getCSALogger } from "@/background/log";
import { Client, State } from "@/background/csa/client";
import { CSASessionState } from "@/common/advanced/monitor";
import { PromptHistory, PromptTarget } from "@/common/advanced/prompt";
import { CommandType } from "@/common/advanced/command";

let lastSessionID = 0;

function issueSessionID(): number {
  lastSessionID += 1;
  return lastSessionID;
}

const clients = new Map<number, Client>();

export function login(setting: CSAServerSetting): number {
  const sessionID = issueSessionID();
  const client = new Client(sessionID, setting, getCSALogger())
    .on("gameSummary", (gameSummary) => onCSAGameSummary(sessionID, gameSummary))
    .on("reject", () => onCSAReject(sessionID))
    .on("start", (playerStates) => onCSAStart(sessionID, playerStates))
    .on("move", (move, playerStates) => onCSAMove(sessionID, move, playerStates))
    .on("gameResult", (specialMove, gameResult) =>
      onCSAGameResult(sessionID, specialMove, gameResult),
    )
    .on("close", () => {
      setTimeout(() => {
        clients.delete(sessionID);
      }, 10e3); // remove 10 seconds later
      onCSAClose(sessionID);
    })
    .on("error", sendError)
    .on("command", (command) => {
      sendPromptCommand(PromptTarget.CSA, sessionID, command);
    });
  clients.set(sessionID, client);
  client.login();
  return sessionID;
}

export function logout(sessionID: number): void {
  const client = clients.get(sessionID);
  if (client) {
    client.logout();
  }
}

export function agree(sessionID: number, gameID: string): void {
  const client = clients.get(sessionID);
  if (client) {
    client.agree(gameID);
  }
}

export function doMove(sessionID: number, move: string, score?: number, pv?: string): void {
  const client = clients.get(sessionID);
  if (client) {
    client.doMove(move, score, pv);
  }
}

export function resign(sessionID: number): void {
  const client = clients.get(sessionID);
  if (client) {
    client.resign();
  }
}

export function win(sessionID: number): void {
  const client = clients.get(sessionID);
  if (client) {
    client.win();
  }
}

export function stop(sessionID: number): void {
  const client = clients.get(sessionID);
  if (client) {
    client.stop();
  }
}

export function collectSessionStates(): CSASessionState[] {
  return Array.from(clients.entries())
    .map(([id, client]) => ({
      sessionID: id,
      host: client.setting.host,
      port: client.setting.port,
      loginID: client.setting.id,
      protocolVersion: client.setting.protocolVersion,
      stateCode: client.state,
      lastReceived: client.lastReceived,
      lastSent: client.lastSent,
      createdMs: client.createdMs,
      loggedInMs: client.loggedInMs,
      updatedMs: Date.now(),
      closed: client.state === State.WAITING_CLOSE || client.state === State.CLOSED,
    }))
    .sort((a, b) => b.sessionID - a.sessionID);
}

export function getCommandHistory(sessionID: number): PromptHistory {
  const client = clients.get(sessionID);
  if (client) {
    return client.commandHistory;
  }
  throw new Error(`session not found: ${sessionID}`);
}

export function invokeCommand(sessionID: number, type: CommandType, command: string): void {
  const client = clients.get(sessionID);
  if (client) {
    client.invoke(type, command);
  }
}
