import fs from "fs";
import path from "path";

/**
 * 指定したディレクトリ以下のファイル名を再帰的に列挙する。
 * @param dir 検索を開始するディレクトリのパス。
 * @param maxDepth 再帰する深さ。0の場合は直下のファイルのみを返す。
 * @returns
 */
export function listFiles(dir: string, maxDepth: number): string[] {
  const files: string[] = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    // NOTE:
    //   lstatSync (statSync ではなく) を使わないとシンボリックリンクも対象になっていしまい危険。
    //   Windows のショートカットは ".lnk" が付いたファイルとして扱われる。
    const stat = fs.lstatSync(fullPath);
    if (stat.isFile()) {
      files.push(fullPath);
    } else if (maxDepth > 0 && stat.isDirectory()) {
      files.push(...listFiles(fullPath, maxDepth - 1));
    }
  });
  return files;
}
