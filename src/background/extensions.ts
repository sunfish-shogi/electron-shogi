/**
 * ファイルパスの拡張子が対応している棋譜ファイルかどうかを判定します。
 * 一括変換でしか対応していない .sfen は含めません。
 */
export function isSupportedRecordFilePath(path: string) {
  const lowerCasePath = path.toLowerCase();
  return (
    lowerCasePath.endsWith(".kif") ||
    lowerCasePath.endsWith(".kifu") ||
    lowerCasePath.endsWith(".ki2") ||
    lowerCasePath.endsWith(".ki2u") ||
    lowerCasePath.endsWith(".csa") ||
    lowerCasePath.endsWith(".jkf")
  );
}
