export enum HistoryClass {
  USER = "user",
  BACKUP = "backup",
}

export type RecordFileHistoryEntry = {
  id: string;
  /** ISO 8601 format */
  time: string;
  class: HistoryClass;
  userFilePath?: string;
  backupFileName?: string;
};

export type RecordFileHistory = {
  entries: RecordFileHistoryEntry[];
};

export function getEmptyHistory(): RecordFileHistory {
  return { entries: [] };
}
