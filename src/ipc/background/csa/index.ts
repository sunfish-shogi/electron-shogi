import { CSAGameResult, CSASpecialMove } from "@/ipc/csa";
import { CSAServerSetting } from "@/settings/csa";
import {
  onCSAClose,
  onCSAGameResult,
  onCSAGameSummary,
  onCSAMove,
  onCSAReject,
  onCSAStart,
  sendError,
} from "..";
import { getCSALogger } from "../log";
import { Client } from "./client";

let lastSessionID = 0;

function issueSessionID(): number {
  lastSessionID += 1;
  return lastSessionID;
}

const clients = new Map<number, Client>();

export function login(setting: CSAServerSetting): number {
  const sessionID = issueSessionID();
  const client = new Client(sessionID, setting, getCSALogger());
  client.on("gameSummary", (gameSummary) => {
    onCSAGameSummary(sessionID, gameSummary);
  });
  client.on("reject", () => {
    onCSAReject(sessionID);
  });
  client.on("start", (playerStates) => {
    onCSAStart(sessionID, playerStates);
  });
  client.on("move", (move, playerStates) => {
    onCSAMove(sessionID, move, playerStates);
  });
  client.on(
    "gameResult",
    (specialMove: CSASpecialMove, gameResult: CSAGameResult) => {
      onCSAGameResult(sessionID, specialMove, gameResult);
    }
  );
  client.on("close", () => {
    clients.delete(sessionID);
    onCSAClose(sessionID);
  });
  client.on("error", (e) => {
    sendError(e);
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

export function doMove(sessionID: number, move: string): void {
  const client = clients.get(sessionID);
  if (client) {
    client.doMove(move);
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
