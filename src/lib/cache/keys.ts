import type { VersionInfo } from '@/types/engine';

/**
 * Generate analysis cache key.
 * CORE-05: Cache keys include inputHash + analyzerVersion + normalizerVersion
 */
export function analysisKey(
  inputHash: string,
  version: VersionInfo
): string {
  return `analysis:${inputHash}:${version.analyzerVersion}:${version.normalizerVersion}`;
}

/**
 * Generate render cache key.
 * CORE-06: Render cache keys include inputHash + all versions + styleName + resolution
 */
export function renderKey(
  inputHash: string,
  version: VersionInfo,
  styleName: string,
  resolution: number
): string {
  return `render:${inputHash}:${version.analyzerVersion}:${version.normalizerVersion}:${version.rendererVersion}:${styleName}:${resolution}`;
}
