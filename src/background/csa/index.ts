import { CSAServerSetting } from "@/common/settings/csa";
import {
  onCSAClose,
  onCSAGameResult,
  onCSAGameSummary,
  onCSAMove,
  onCSAReject,
  onCSAStart,
  sendError,
} from "@/background/ipc";
import { getCSALogger } from "@/background/log";
import { Client } from "@/background/csa/client";

let lastSessionID = 0;

function issueSessionID(): number {
  lastSessionID += 1;
  return lastSessionID;
}

const clients = new Map<number, Client>();

export function login(setting: CSAServerSetting): number {
  const sessionID = issueSessionID();
  const client = new Client(sessionID, setting, getCSALogger())
    .on("gameSummary", (gameSummary) =>
      onCSAGameSummary(sessionID, gameSummary),
    )
    .on("reject", () => onCSAReject(sessionID))
    .on("start", (playerStates) => onCSAStart(sessionID, playerStates))
    .on("move", (move, playerStates) =>
      onCSAMove(sessionID, move, playerStates),
    )
    .on("gameResult", (specialMove, gameResult) =>
      onCSAGameResult(sessionID, specialMove, gameResult),
    )
    .on("close", () => {
      clients.delete(sessionID);
      onCSAClose(sessionID);
    })
    .on("error", sendError);
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

export function doMove(
  sessionID: number,
  move: string,
  score?: number,
  pv?: string,
): void {
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
