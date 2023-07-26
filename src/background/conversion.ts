import { BatchConversionResult } from "@/common/conversion";
import {
  RecordFileFormat,
  detectRecordFileFormatByPath,
  exportRecordAsBuffer,
  importRecordFromBuffer,
} from "@/common/file";
import {
  BatchConversionSetting,
  FileNameConflictAction,
} from "@/common/settings/conversion";
import fs from "fs";
import path from "path";
import { getAppLogger } from "@/background/log";
import { TextDecodingRule } from "@/common/settings/app";
import { listFiles } from "./helpers/file";
import { loadAppSetting } from "./settings";

function getAlternativeFilePathWithNumberSuffix(
  filePath: string,
  maxNumber: number
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

export function convertRecordFiles(
  setting: BatchConversionSetting
): BatchConversionResult {
  const appSetting = loadAppSetting();
  const result: BatchConversionResult = {
    succeeded: {},
    succeededTotal: 0,
    failed: {},
    failedTotal: 0,
    skipped: {},
    skippedTotal: 0,
  };

  getAppLogger().debug(
    `batch conversion: start ${setting.source} -> ${setting.destination}`
  );
  listFiles(setting.source, setting.subdirectories ? Infinity : 0)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return setting.sourceFormats.includes(ext as RecordFileFormat);
    })
    .forEach((source) => {
      const sourceFormat = detectRecordFileFormatByPath(
        source
      ) as RecordFileFormat;
      try {
        // Import record
        const sourceData = fs.readFileSync(source);
        const record = importRecordFromBuffer(sourceData, sourceFormat, {
          autoDetect:
            appSetting.textDecodingRule === TextDecodingRule.AUTO_DETECT,
        });
        if (record instanceof Error) {
          throw record;
        }

        // Generate destination path
        const parsed = path.parse(path.relative(setting.source, source));
        let destination = path.join(
          setting.destination,
          parsed.dir,
          parsed.name + setting.destinationFormat
        );
        if (fs.existsSync(destination)) {
          switch (setting.fileNameConflictAction) {
            case FileNameConflictAction.OVERWRITE:
              break;
            case FileNameConflictAction.NUMBER_SUFFIX:
              {
                const alt = getAlternativeFilePathWithNumberSuffix(
                  destination,
                  100
                );
                if (alt instanceof Error) {
                  throw alt;
                }
                destination = alt;
              }
              break;
            case FileNameConflictAction.SKIP:
              result.skippedTotal++;
              result.skipped[sourceFormat] =
                (result.skipped[sourceFormat] || 0) + 1;
              getAppLogger().debug(`batch conversion: skipped: ${source}`);
              return;
          }
        }

        // Create directory if not exists
        const destinationDir = path.dirname(destination);
        fs.mkdirSync(destinationDir, { recursive: true });

        // Export record
        const exportResult = exportRecordAsBuffer(
          record,
          setting.destinationFormat,
          {
            returnCode: appSetting.returnCode,
          }
        );
        fs.writeFileSync(destination, exportResult.data);
        result.succeededTotal++;
        result.succeeded[sourceFormat] =
          (result.succeeded[sourceFormat] || 0) + 1;
        getAppLogger().debug(
          `batch conversion: succeeded: ${source} -> ${destination}`
        );
      } catch (e) {
        result.failedTotal++;
        result.failed[sourceFormat] = (result.failed[sourceFormat] || 0) + 1;
        getAppLogger().debug(`batch conversion: failed: ${source}: ${e}`);
      }
    });
  getAppLogger().debug(`batch conversion: completed`);

  return result;
}
