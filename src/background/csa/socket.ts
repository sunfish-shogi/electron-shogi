import * as net from "node:net";
import { createInterface as readline, Interface as Readline } from "readline";

type SocketHandlers = {
  onConnect: () => void;
  onError(e: Error): void;
  onFIN(): void;
  onClose(hadError: boolean): void;
  onRead(line: string): void;
};

export class Socket {
  private socket: net.Socket;
  private readline: Readline | null;

  constructor(host: string, port: number, handlers: SocketHandlers) {
    this.socket = net
      .createConnection(
        {
          port: port,
          host: host,
        },
        handlers.onConnect
      )
      .setKeepAlive(true)
      .on("error", handlers.onError)
      .on("end", handlers.onFIN)
      .on("close", (hadError) => {
        this.closeReadline();
        handlers.onClose(hadError);
      });
    this.readline = readline(this.socket);
    this.readline.on("line", handlers.onRead);
  }

  write(line: string): void {
    this.socket.write(line + "\n");
  }

  end(): void {
    this.socket.end();
  }

  private closeReadline(): void {
    if (this.readline) {
      this.readline.close();
      this.readline = null;
    }
  }
}
