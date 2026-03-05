import { db } from '@/db';
import { analysisCache, renderCache, urlSnapshots } from '@/db/schema';
import { analysisKey, renderKey } from './keys';
import { eq, lt } from 'drizzle-orm';
import type { ParameterVector, ParameterProvenance, VersionInfo } from '@/types/engine';

// ---------------------------------------------------------------------------
// TTL helpers
// ---------------------------------------------------------------------------

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/** Returns expiry Date 7 days from now (anonymous analysis cache TTL). */
export function analysisTtl(): Date {
  return new Date(Date.now() + SEVEN_DAYS_MS);
}

/** Returns expiry Date for render cache: 24h for thumbnails, 7d for full renders. */
export function renderTtl(resolution: number): Date {
  const ttlMs = resolution <= 200 ? ONE_DAY_MS : SEVEN_DAYS_MS;
  return new Date(Date.now() + ttlMs);
}

// ---------------------------------------------------------------------------
// Analysis cache (INFRA-02)
// ---------------------------------------------------------------------------

export interface AnalysisCachePayload {
  parameterVector: ParameterVector;
  provenance: ParameterProvenance[];
}

/**
 * Read an analysis cache entry by inputHash + version.
 * Returns null if not found or expired.
 */
export async function getAnalysisCache(
  inputHash: string,
  version: VersionInfo
): Promise<AnalysisCachePayload | null> {
  const key = analysisKey(inputHash, version);
  const now = new Date();
  const row = await db.query.analysisCache.findFirst({
    where: (t, { and, eq: eqFn, gt }) =>
      and(eqFn(t.cacheKey, key), gt(t.expiresAt, now)),
  });
  if (!row) return null;
  return {
    parameterVector: row.parameterVector as ParameterVector,
    provenance: row.provenance as ParameterProvenance[],
  };
}

/**
 * Write an analysis cache entry. TTL is 7 days by default.
 * Pass `permanent: true` for gallery-linked entries (sets expiresAt to year 9999).
 */
export async function setAnalysisCache(
  inputHash: string,
  version: VersionInfo,
  payload: AnalysisCachePayload,
  opts?: { permanent?: boolean }
): Promise<void> {
  const key = analysisKey(inputHash, version);
  const expiresAt = opts?.permanent
    ? new Date('9999-12-31T23:59:59Z')
    : analysisTtl();
  await db
    .insert(analysisCache)
    .values({
      cacheKey: key,
      parameterVector: payload.parameterVector,
      provenance: payload.provenance,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: analysisCache.cacheKey,
      set: {
        parameterVector: payload.parameterVector,
        provenance: payload.provenance,
        expiresAt,
        accessCount: 0,
      },
    });
}

// ---------------------------------------------------------------------------
// Render cache (INFRA-03)
// ---------------------------------------------------------------------------

export interface RenderCachePayload {
  styleName: string;
  resolution: number;
  renderData: unknown;
}

/**
 * Read a render cache entry. Returns null if not found or expired.
 */
export async function getRenderCache(
  inputHash: string,
  version: VersionInfo,
  styleName: string,
  resolution: number
): Promise<RenderCachePayload | null> {
  const key = renderKey(inputHash, version, styleName, resolution);
  const now = new Date();
  const row = await db.query.renderCache.findFirst({
    where: (t, { and, eq: eqFn, gt }) =>
      and(eqFn(t.cacheKey, key), gt(t.expiresAt, now)),
  });
  if (!row) return null;
  return {
    styleName: row.styleName,
    resolution: row.resolution,
    renderData: row.renderData,
  };
}

/**
 * Write a render cache entry.
 * TTL: 24h for thumbnails (resolution<=200), 7d for full renders.
 */
export async function setRenderCache(
  inputHash: string,
  version: VersionInfo,
  payload: RenderCachePayload
): Promise<void> {
  const key = renderKey(inputHash, version, payload.styleName, payload.resolution);
  const expiresAt = renderTtl(payload.resolution);
  await db
    .insert(renderCache)
    .values({
      cacheKey: key,
      resolution: payload.resolution,
      styleName: payload.styleName,
      renderData: payload.renderData,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: renderCache.cacheKey,
      set: {
        renderData: payload.renderData,
        expiresAt,
        accessCount: 0,
      },
    });
}

// ---------------------------------------------------------------------------
// URL snapshot cache (INFRA-04)
// ---------------------------------------------------------------------------

export interface UrlSnapshotPayload {
  signals: Record<string, number>;
  title: string;
  metadata: {
    linkCount: number;
    imageCount: number;
    dominantColors: string[];
  };
}

/**
 * Read a URL snapshot by canonical URL. Returns null if not found.
 * Snapshots are permanent -- no expiry check needed.
 */
export async function getUrlSnapshot(
  canonicalUrl: string
): Promise<UrlSnapshotPayload | null> {
  const row = await db.query.urlSnapshots.findFirst({
    where: (t, { eq: eqFn }) => eqFn(t.canonicalUrl, canonicalUrl),
  });
  if (!row) return null;
  return {
    signals: row.signals as Record<string, number>,
    title: row.title,
    metadata: row.metadata as UrlSnapshotPayload['metadata'],
  };
}

/**
 * Write (upsert) a URL snapshot.
 * If a snapshot already exists for this URL, it is replaced (re-fetch flow).
 */
export async function setUrlSnapshot(
  canonicalUrl: string,
  payload: UrlSnapshotPayload
): Promise<void> {
  await db
    .insert(urlSnapshots)
    .values({
      canonicalUrl,
      signals: payload.signals,
      title: payload.title,
      metadata: payload.metadata,
    })
    .onConflictDoUpdate({
      target: urlSnapshots.canonicalUrl,
      set: {
        signals: payload.signals,
        title: payload.title,
        metadata: payload.metadata,
        snapshotTimestamp: new Date(),
      },
    });
}

/**
 * Delete a URL snapshot (used when user explicitly re-fetches).
 */
export async function deleteUrlSnapshot(canonicalUrl: string): Promise<void> {
  await db
    .delete(urlSnapshots)
    .where(eq(urlSnapshots.canonicalUrl, canonicalUrl));
}

// ---------------------------------------------------------------------------
// TTL cleanup (used by cron job)
// ---------------------------------------------------------------------------

/**
 * Delete all expired analysis and render cache rows.
 * Called by /api/cron/cleanup daily.
 */
export async function cleanupExpiredCache(): Promise<{
  analysisDeleted: number;
  renderDeleted: number;
}> {
  const now = new Date();
  const [aResult, rResult] = await Promise.all([
    db.delete(analysisCache).where(lt(analysisCache.expiresAt, now)),
    db.delete(renderCache).where(lt(renderCache.expiresAt, now)),
  ]);
  return {
    analysisDeleted: (aResult as unknown as { rowCount?: number }).rowCount ?? 0,
    renderDeleted: (rResult as unknown as { rowCount?: number }).rowCount ?? 0,
  };
}
