import { BatchConversionResult } from "@/common/conversion";
import {
  RecordFileFormat,
  detectRecordFileFormatByPath,
  exportRecordAsBuffer,
  importRecordFromBuffer,
} from "@/common/file";
import {
  BatchConversionSetting,
  DestinationType,
  FileNameConflictAction,
} from "@/common/settings/conversion";
import fs from "fs";
import path from "path";
import { getAppLogger } from "@/background/log";
import { AppSetting, TextDecodingRule } from "@/common/settings/app";
import { listFiles } from "./helpers/file";
import { loadAppSetting } from "./settings";
import {
  ImmutableNode,
  ImmutableRecord,
  InitialPositionSFEN,
  Move,
  SpecialMoveType,
} from "@/common/shogi";

function getAlternativeFilePathWithNumberSuffix(
  filePath: string,
  maxNumber: number,
): string | Error {
  const parsed = path.parse(filePath);
  let suffix = 2;
  while (fs.existsSync(filePath)) {
    if (suffix > maxNumber) {
      return new Error("Too many files with the same name");
    }
    filePath = path.join(parsed.dir, parsed.name + "-" + suffix + parsed.ext);
    suffix++;
  }
  return filePath;
}

export function convertRecordFiles(setting: BatchConversionSetting): BatchConversionResult {
  const appSetting = loadAppSetting();
  const result: BatchConversionResult = {
    succeeded: {},
    succeededTotal: 0,
    failed: {},
    failedTotal: 0,
    skipped: {},
    skippedTotal: 0,
  };

  getAppLogger().debug(`batch conversion: start ${JSON.stringify(setting)}`);
  const sourceFiles = listFiles(setting.source, setting.subdirectories ? Infinity : 0).filter(
    (file) => {
      const ext = path.extname(file).toLowerCase();
      return setting.sourceFormats.includes(ext as RecordFileFormat);
    },
  );

  const writer =
    setting.destinationType === DestinationType.DIRECTORY
      ? new DirectoryWriter(setting, appSetting)
      : new SingleFileWriter(setting, appSetting);
  writer.open();
  sourceFiles.forEach((source) => {
    const sourceFormat = detectRecordFileFormatByPath(source) as RecordFileFormat;
    try {
      const sourceData = fs.readFileSync(source);
      const record = importRecordFromBuffer(sourceData, sourceFormat, {
        autoDetect: appSetting.textDecodingRule === TextDecodingRule.AUTO_DETECT,
      });
      if (record instanceof Error) {
        throw record;
      }
      if (writer.write(record, source)) {
        result.succeededTotal++;
        result.succeeded[sourceFormat] = (result.succeeded[sourceFormat] || 0) + 1;
      } else {
        result.skippedTotal++;
        result.skipped[sourceFormat] = (result.skipped[sourceFormat] || 0) + 1;
      }
    } catch (e) {
      result.failedTotal++;
      result.failed[sourceFormat] = (result.failed[sourceFormat] || 0) + 1;
      getAppLogger().debug(`batch conversion: failed: ${source}: ${e}`);
    }
  });
  writer.close();
  getAppLogger().debug(`batch conversion: completed`);

  return result;
}

class DirectoryWriter {
  constructor(
    private setting: BatchConversionSetting,
    private appSetting: AppSetting,
  ) {}

  open(): void {
    // noop
  }

  write(record: ImmutableRecord, source: string): boolean {
    // Generate destination path
    const parsed = path.parse(path.relative(this.setting.source, source));
    let destination = path.join(
      this.setting.destination,
      parsed.dir,
      parsed.name + this.setting.destinationFormat,
    );
    if (fs.existsSync(destination)) {
      switch (this.setting.fileNameConflictAction) {
        case FileNameConflictAction.OVERWRITE:
          break;
        case FileNameConflictAction.NUMBER_SUFFIX:
          {
            const alt = getAlternativeFilePathWithNumberSuffix(destination, 100);
            if (alt instanceof Error) {
              throw alt;
            }
            destination = alt;
          }
          break;
        case FileNameConflictAction.SKIP:
          getAppLogger().debug(`batch conversion: skipped: ${source}`);
          return false;
      }
    }

    // Create directory if not exists
    const destinationDir = path.dirname(destination);
    fs.mkdirSync(destinationDir, { recursive: true });

    // Export record
    const exportResult = exportRecordAsBuffer(record, this.setting.destinationFormat, {
      returnCode: this.appSetting.returnCode,
    });
    fs.writeFileSync(destination, exportResult.data);
    getAppLogger().debug(`batch conversion: succeeded: ${source} -> ${destination}`);
    return true;
  }

  close(): void {
    // noop
  }
}

class SingleFileWriter {
  private fd = 0;
  constructor(
    private setting: BatchConversionSetting,
    private appSetting: AppSetting,
  ) {}

  open(): void {
    this.fd = fs.openSync(this.setting.singleFileDestination, "w");
  }

  write(record: ImmutableRecord, source: string): boolean {
    this.writeUSI(record);
    getAppLogger().debug(`batch conversion: succeeded: ${source}`);
    return true;
  }

  close(): void {
    fs.closeSync(this.fd);
  }

  writeUSI(record: ImmutableRecord) {
    let position: string;
    const sfen = record.initialPosition.sfen;
    if (this.appSetting.enableUSIStartpos && sfen === InitialPositionSFEN.STANDARD) {
      position = "startpos";
    } else {
      position = "sfen " + sfen;
    }
    const branches = this.getUSIBranches(record);
    for (const moves of branches) {
      if (moves) {
        fs.writeSync(this.fd, position + " moves" + moves + this.appSetting.returnCode);
      } else {
        fs.writeSync(this.fd, position + this.appSetting.returnCode);
      }
    }
  }

  getUSIBranches(record: ImmutableRecord): string[] {
    const branches: string[] = [];
    let moves = "";
    let p: ImmutableNode = record.first;
    const pos = record.initialPosition.clone();
    const stack: [ImmutableNode, string][] = [];
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (p.next) {
        stack.push([p, moves]);
        if (p.move instanceof Move) {
          pos.doMove(p.move);
          moves += " " + p.move.usi;
        }
        p = p.next;
        continue;
      }
      if (p.move instanceof Move) {
        branches.push(moves + " " + p.move.usi);
      } else if (this.appSetting.enableUSIResign && p.move.type === SpecialMoveType.RESIGN) {
        branches.push(moves + " resign");
      } else {
        branches.push(moves);
      }
      while (!p.branch) {
        const last = stack.pop();
        if (!last) {
          return branches;
        }
        if (last[0].move instanceof Move) {
          pos.undoMove(last[0].move);
        }
        p = last[0];
        moves = last[1];
      }
      p = p.branch;
    }
  }
}
