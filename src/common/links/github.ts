export const ghAccount = "sunfish-shogi";
export const ghRepository = "electron-shogi";
export const ghDomain = "github.com";
export const ghioDomain = `${ghAccount}.github.io`;
const howToUseTitle = "%E4%BD%BF%E3%81%84%E6%96%B9";
const fileNameTemplateTitle =
  "%E6%A3%8B%E8%AD%9C%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E5%90%8D%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88";

export const websiteURL = `https://${ghioDomain}/${ghRepository}/`;
export const wikiPageBaseURL = `https://${ghDomain}/${ghAccount}/${ghRepository}/wiki/`;
export const howToUseWikiPageURL = `${wikiPageBaseURL}${howToUseTitle}`;
export const fileNameTemplateWikiPageURL = `${wikiPageBaseURL}${fileNameTemplateTitle}`;
export const latestReleaseURL = `https://${ghDomain}/${ghAccount}/${ghRepository}/releases/latest`;
export function stableReleaseURL(tag: string) {
  return `https://${ghDomain}/${ghAccount}/${ghRepository}/releases/tag/${tag}`;
}
