export type Release = {
  /** strict semver */
  version: string;
  /** release tag */
  tag: string;
  /** link to GitHub release page */
  link: string;
};

export type Releases = {
  /** strict semver */
  stable: Release;
  /** strict semver */
  latest: Release;
  /** UnixTime(ms) of last download */
  downloadedMs?: number;
};

export type VersionStatus = {
  knownReleases?: Releases;
  updatedMs: number;
};
