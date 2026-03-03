import type { VersionInfo } from '@/types/engine';

export const CURRENT_VERSION: VersionInfo = {
  engineVersion: '0.1.0',
  analyzerVersion: '0.2.0',
  normalizerVersion: '0.3.0',
  rendererVersion: '0.1.0',
};

export function getVersionString(
  version: VersionInfo = CURRENT_VERSION
): string {
  return `engine:${version.engineVersion} analyzer:${version.analyzerVersion} normalizer:${version.normalizerVersion} renderer:${version.rendererVersion}`;
}
