import { BatchConversionResult } from "@/common/file/conversion";
import {
  RecordFileFormat,
  detectRecordFileFormatByPath,
  exportRecordAsBuffer,
  importRecordFromBuffer,
} from "@/common/file/record";
import {
  BatchConversionSetting,
  DestinationType,
  FileNameConflictAction,
} from "@/common/settings/conversion";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getAppLogger } from "@/background/log";
import { AppSetting, TextDecodingRule } from "@/common/settings/app";
import { exists, listFiles } from "@/background/helpers/file";
import { loadAppSetting } from "@/background/settings";
import {
  ImmutableNode,
  ImmutableRecord,
  InitialPositionSFEN,
  Move,
  SpecialMoveType,
} from "electron-shogi-core";

async function getAlternativeFilePathWithNumberSuffix(
  filePath: string,
  maxNumber: number,
): Promise<string> {
  const parsed = path.parse(filePath);
  let suffix = 2;
  while (await exists(filePath)) {
    if (suffix > maxNumber) {
      throw new Error("Too many files with the same name");
    }
    filePath = path.join(parsed.dir, parsed.name + "-" + suffix + parsed.ext);
    suffix++;
  }
  return filePath;
}

export async function convertRecordFiles(
  setting: BatchConversionSetting,
): Promise<BatchConversionResult> {
  const appSetting = await loadAppSetting();
  const result: BatchConversionResult = {
    succeeded: {},
    succeededTotal: 0,
    failed: {},
    failedTotal: 0,
    skipped: {},
    skippedTotal: 0,
  };

  getAppLogger().debug(`batch conversion: start ${JSON.stringify(setting)}`);
  const sourceFiles = (
    await listFiles(setting.source, setting.subdirectories ? Infinity : 0)
  ).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return setting.sourceFormats.includes(ext as RecordFileFormat);
  });

  const writer =
    setting.destinationType === DestinationType.DIRECTORY
      ? new DirectoryWriter(setting, appSetting)
      : new SingleFileWriter(setting, appSetting);
  await writer.open();
  for (const source of sourceFiles) {
    const sourceFormat = detectRecordFileFormatByPath(source) as RecordFileFormat;
    try {
      const sourceData = await fs.readFile(source);
      const record = importRecordFromBuffer(sourceData, sourceFormat, {
        autoDetect: appSetting.textDecodingRule === TextDecodingRule.AUTO_DETECT,
      });
      if (record instanceof Error) {
        throw record;
      }
      if (await writer.write(record, source)) {
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
  }
  await writer.close();
  getAppLogger().debug(`batch conversion: completed`);

  return result;
}

class DirectoryWriter {
  constructor(
    private setting: BatchConversionSetting,
    private appSetting: AppSetting,
  ) {}

  async open(): Promise<void> {
    // noop
  }

  async write(record: ImmutableRecord, source: string): Promise<boolean> {
    // Generate destination path
    const parsed = path.parse(path.relative(this.setting.source, source));
    const name = parsed.name + this.setting.destinationFormat;
    let destination = path.join(
      this.setting.destination,
      this.setting.createSubdirectories ? path.join(parsed.dir, name) : name,
    );
    if (await exists(destination)) {
      switch (this.setting.fileNameConflictAction) {
        case FileNameConflictAction.OVERWRITE:
          break;
        case FileNameConflictAction.NUMBER_SUFFIX:
          destination = await getAlternativeFilePathWithNumberSuffix(destination, 1000);
          break;
        case FileNameConflictAction.SKIP:
          getAppLogger().debug(`batch conversion: skipped: ${source}`);
          return false;
      }
    }

    // Create directory if not exists
    const destinationDir = path.dirname(destination);
    await fs.mkdir(destinationDir, { recursive: true });

    // Export record
    const exportResult = exportRecordAsBuffer(record, this.setting.destinationFormat, {
      returnCode: this.appSetting.returnCode,
      csa: { v3: this.appSetting.useCSAV3 },
    });
    await fs.writeFile(destination, exportResult.data);
    getAppLogger().debug(`batch conversion: succeeded: ${source} -> ${destination}`);
    return true;
  }

  async close(): Promise<void> {
    // noop
  }
}

class SingleFileWriter {
  private fd?: fs.FileHandle;
  constructor(
    private setting: BatchConversionSetting,
    private appSetting: AppSetting,
  ) {}

  async open(): Promise<void> {
    this.fd = await fs.open(this.setting.singleFileDestination, "w");
  }

  async write(record: ImmutableRecord, source: string): Promise<boolean> {
    await this.writeUSI(record);
    getAppLogger().debug(`batch conversion: succeeded: ${source}`);
    return true;
  }

  async close(): Promise<void> {
    await this.fd?.close();
  }

  async writeUSI(record: ImmutableRecord): Promise<void> {
    let position: string;
    const sfen = record.initialPosition.sfen;
    if (this.appSetting.enableUSIFileStartpos && sfen === InitialPositionSFEN.STANDARD) {
      position = "startpos";
    } else {
      position = "sfen " + sfen;
    }
    const branches = this.getUSIBranches(record);
    for (const moves of branches) {
      if (moves) {
        await this.fd?.write(position + " moves" + moves + this.appSetting.returnCode);
      } else {
        await this.fd?.write(position + this.appSetting.returnCode);
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
      } else if (this.appSetting.enableUSIFileResign && p.move.type === SpecialMoveType.RESIGN) {
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
