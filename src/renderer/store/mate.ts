import { MateSearchSetting } from "@/common/settings/mate";
import { USIPlayer } from "@/renderer/players/usi";
import { useAppSetting } from "./setting";
import { ImmutableRecord, Move } from "@/common/shogi";

type CheckmateCallback = (moves: Move[]) => void;
type NotImplementedCallback = () => void;
type TimeoutCallback = () => void;
type NoMateCallback = () => void;
type ErrorCallback = (e: unknown) => void;

export class MateSearchManager {
  private engine: USIPlayer | null = null;
  private onNotImplemented: NotImplementedCallback = () => {
    /* noop */
  };
  private onCheckmate: CheckmateCallback = () => {
    /* noop */
  };
  private onTimeout: TimeoutCallback = () => {
    /* noop */
  };
  private onNoMate: NoMateCallback = () => {
    /* noop */
  };
  private onError: ErrorCallback = () => {
    /* noop */
  };

  on(event: "checkmate", handler: CheckmateCallback): this;
  on(event: "notImplemented", handler: NotImplementedCallback): this;
  on(event: "timeout", handler: TimeoutCallback): this;
  on(event: "noMate", handler: NoMateCallback): this;
  on(event: "error", handler: ErrorCallback): this;
  on(event: string, handler: unknown): this {
    switch (event) {
      case "checkmate":
        this.onCheckmate = handler as CheckmateCallback;
        break;
      case "notImplemented":
        this.onNotImplemented = handler as NotImplementedCallback;
        break;
      case "timeout":
        this.onTimeout = handler as TimeoutCallback;
        break;
      case "noMate":
        this.onNoMate = handler as NoMateCallback;
        break;
      case "error":
        this.onError = handler as ErrorCallback;
        break;
    }
    return this;
  }

  async start(setting: MateSearchSetting, record: ImmutableRecord) {
    // Validation
    if (setting.usi === undefined) {
      throw new Error("MateSearchManager#start: USIエンジンの設定は必須です。");
    }
    // エンジンを起動する。
    const appSetting = useAppSetting();
    this.engine = new USIPlayer(setting.usi, appSetting.engineTimeoutSeconds);
    try {
      await this.engine.launch();
    } catch (e) {
      this.close();
      throw e;
    }
    // 探索を開始する。
    this.engine.startMateSearch(record, {
      onCheckmate: (moves) => {
        this.close();
        this.onCheckmate(moves);
      },
      onNotImplemented: () => {
        this.close();
        this.onNotImplemented();
      },
      onTimeout: () => {
        this.close();
        this.onTimeout();
      },
      onNoMate: () => {
        this.close();
        this.onNoMate();
      },
      onError: (e: unknown) => {
        this.close();
        this.onError(e);
      },
    });
  }

  close() {
    if (this.engine) {
      this.engine
        .close()
        .then(() => {
          this.engine = null;
        })
        .catch((e) => {
          this.onError(e);
        });
    }
  }
}
