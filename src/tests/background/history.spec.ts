import { addHistory, clearHistory, getHistory, loadBackup, saveBackup } from "@/background/history";

it("history", async () => {
  let history = await getHistory();
  expect(history.entries).toHaveLength(0);

  // 4 件を追加する。
  saveBackup("test-kif-data1");
  addHistory("/path/to/file1.kif");
  saveBackup("test-kif-data2");
  addHistory("/path/to/file2.kif");

  history = await getHistory();
  expect(history.entries).toHaveLength(4);
  expect(history.entries[0].class).toBe("backup");
  expect(history.entries[0].userFilePath).toBeUndefined();
  const backupFileName1 = history.entries[0].backupFileName as string;
  expect(history.entries[0].backupFileName).toMatch(/^[0-9]+-[0-9]+\.kifu$/);
  expect(await loadBackup(backupFileName1)).toBe("test-kif-data1");
  expect(history.entries[1].class).toBe("user");
  expect(history.entries[1].userFilePath).toBe("/path/to/file1.kif");
  expect(history.entries[2].class).toBe("backup");
  const backupFileName2 = history.entries[2].backupFileName as string;
  expect(await loadBackup(backupFileName2)).toBe("test-kif-data2");
  expect(history.entries[3].class).toBe("user");
  expect(history.entries[3].userFilePath).toBe("/path/to/file2.kif");

  // すでに存在するので履歴は増加しない。
  addHistory("/path/to/file1.kif");

  history = await getHistory();
  expect(history.entries).toHaveLength(4);
  expect(history.entries[2].userFilePath).toBe("/path/to/file2.kif");
  expect(history.entries[3].userFilePath).toBe("/path/to/file1.kif"); // 末尾に移動する。

  // 20 件ちょうどまで追加する。
  for (let i = 3; i <= 18; i++) {
    addHistory(`/path/to/file${i}.kif`);
  }

  history = await getHistory();
  expect(history.entries).toHaveLength(20);
  expect(history.entries[0].backupFileName).toMatch(backupFileName1);
  expect(await loadBackup(backupFileName1)).toBe("test-kif-data1");

  // 20 件を超えたので最初の 1 件が削除される。
  addHistory("/path/to/file19.kif");

  history = await getHistory();
  expect(history.entries).toHaveLength(20);
  expect(history.entries[0].backupFileName).toMatch(backupFileName2);
  try {
    await loadBackup(backupFileName1);
    fail("should not reach here");
  } catch {
    // shoud reach here
  }
  expect(await loadBackup(backupFileName2)).toBe("test-kif-data2");

  await clearHistory();

  history = await getHistory();
  expect(history.entries).toHaveLength(0);
  try {
    await loadBackup(backupFileName2);
    fail("should not reach here");
  } catch {
    // shoud reach here
  }
});
