import { promises as fs } from "node:fs";
import path from "node:path";

export async function exists(path: string): Promise<boolean> {
  try {
    await fs.lstat(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * 指定したディレクトリ以下のファイル名を再帰的に列挙する。
 * @param dir 検索を開始するディレクトリのパス。
 * @param maxDepth 再帰する深さ。0の場合は直下のファイルのみを返す。
 */
export async function listFiles(dir: string, maxDepth: number): Promise<string[]> {
  const files: string[] = [];
  const fdir = await fs.readdir(dir);
  for (const file of fdir) {
    const fullPath = path.join(dir, file);
    // NOTE:
    //   lstatSync (statSync ではなく) を使わないとシンボリックリンクも対象になっていしまい危険。
    //   Windows のショートカットは ".lnk" が付いたファイルとして扱われる。
    const stat = await fs.lstat(fullPath);
    if (stat.isFile()) {
      files.push(fullPath);
    } else if (maxDepth > 0 && stat.isDirectory()) {
      files.push(...(await listFiles(fullPath, maxDepth - 1)));
    }
  }
  return files;
}
