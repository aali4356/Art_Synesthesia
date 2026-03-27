import type { PaletteResult } from '@/lib/color/palette';
import type { PaletteSelectionVector } from '@/lib/color/palette-family-selection';
import type {
  BrowserStorageLike,
  RecentWorkPaletteSnapshot,
  RecentWorkRecord,
  RecentWorkSourceKind,
  SaveRecentWorkInput,
} from './types';
import { RECENT_WORK_CONTRACT_VERSION, RECENT_WORK_POSTURE } from './types';

export const RECENT_WORK_STORAGE_KEY = 'synesthesia-recent-work';
export const MAX_RECENT_WORK_ITEMS = 6;

function getBrowserStorage(): BrowserStorageLike | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function resolveStorage(storage?: BrowserStorageLike): BrowserStorageLike | null {
  return storage ?? getBrowserStorage();
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return !Number.isNaN(Date.parse(value));
}

function normalizeSelectionVector(
  selectionVector: PaletteSelectionVector | undefined,
): PaletteSelectionVector {
  return {
    warmthBucket: selectionVector?.warmthBucket ?? 0,
    energyBucket: selectionVector?.energyBucket ?? 0,
    contrastBucket: selectionVector?.contrastBucket ?? 0,
    seedInfluence: selectionVector?.seedInfluence ?? 0,
  };
}

function clonePaletteSnapshot(
  palette: (PaletteResult | RecentWorkPaletteSnapshot) & { selectionVector?: PaletteSelectionVector },
): RecentWorkPaletteSnapshot {
  return {
    familyId: palette.familyId,
    familyName: palette.familyName,
    familyDescriptor: palette.familyDescriptor,
    harmony: palette.harmony,
    count: palette.count,
    selectionKey: palette.selectionKey,
    selectionVector: normalizeSelectionVector(palette.selectionVector),
    mapping: palette.mapping,
    dark: palette.dark,
    light: palette.light,
  };
}

function buildSourceLabel(source: SaveRecentWorkInput['source']): RecentWorkRecord['sourceLabel'] {
  switch (source.kind) {
    case 'url':
      return {
        kind: 'url',
        primary: 'Reference URL',
        secondary: source.hostname?.trim() || 'Hostname only · full URL never stored',
      };
    case 'data': {
      const format = source.format && source.format !== 'auto' ? source.format.toUpperCase() : 'Data';
      const hasShape = typeof source.rowCount === 'number' && typeof source.columnCount === 'number';
      return {
        kind: 'data',
        primary: `${format} dataset`,
        secondary: hasShape
          ? `${source.rowCount} rows × ${source.columnCount} columns`
          : 'Shape hint only · raw dataset never stored',
      };
    }
    case 'text':
    default:
      return {
        kind: 'text',
        primary: 'Private text source',
        secondary: 'Same-browser continuity only',
      };
  }
}

function sanitizeRecord(candidate: unknown): RecentWorkRecord | null {
  if (!candidate || typeof candidate !== 'object') return null;

  const value = candidate as Partial<RecentWorkRecord> & {
    sourceLabel?: Partial<RecentWorkRecord['sourceLabel']>;
  };

  if (typeof value.id !== 'string' || value.id.length === 0) return null;
  if (value.preferredStyle !== 'geometric' && value.preferredStyle !== 'organic' && value.preferredStyle !== 'particle' && value.preferredStyle !== 'typographic') {
    return null;
  }
  if (!value.edition || typeof value.edition !== 'object' || !value.edition.vector || !value.edition.palette) {
    return null;
  }
  if (!isIsoDate(value.savedAt) || !isIsoDate(value.lastOpenedAt)) return null;

  const sourceKind = value.sourceLabel?.kind;
  const normalizedKind: RecentWorkSourceKind = sourceKind === 'url' || sourceKind === 'data' ? sourceKind : 'text';

  return {
    id: value.id,
    contractVersion: RECENT_WORK_CONTRACT_VERSION,
    posture: RECENT_WORK_POSTURE,
    preferredStyle: value.preferredStyle,
    sourceLabel: {
      kind: normalizedKind,
      primary: typeof value.sourceLabel?.primary === 'string' ? value.sourceLabel.primary : buildSourceLabel({ kind: normalizedKind }).primary,
      secondary: typeof value.sourceLabel?.secondary === 'string' ? value.sourceLabel.secondary : buildSourceLabel({ kind: normalizedKind }).secondary,
    },
    edition: {
      vector: value.edition.vector,
      palette: clonePaletteSnapshot(value.edition.palette),
    },
    savedAt: value.savedAt,
    lastOpenedAt: value.lastOpenedAt,
  };
}

function sortRecentWork(records: RecentWorkRecord[]): RecentWorkRecord[] {
  return [...records].sort((a, b) => {
    const openedDiff = Date.parse(b.lastOpenedAt) - Date.parse(a.lastOpenedAt);
    if (openedDiff !== 0) return openedDiff;

    const savedDiff = Date.parse(b.savedAt) - Date.parse(a.savedAt);
    if (savedDiff !== 0) return savedDiff;

    return a.id.localeCompare(b.id);
  });
}

function readRecentWorkRecords(storage?: BrowserStorageLike): RecentWorkRecord[] {
  const target = resolveStorage(storage);
  if (!target) return [];

  try {
    const raw = target.getItem(RECENT_WORK_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return sortRecentWork(parsed.map((entry) => sanitizeRecord(entry)).filter((entry): entry is RecentWorkRecord => entry !== null)).slice(0, MAX_RECENT_WORK_ITEMS);
  } catch {
    return [];
  }
}

function persistRecentWorkRecords(records: RecentWorkRecord[], storage?: BrowserStorageLike): boolean {
  const target = resolveStorage(storage);
  if (!target) return false;

  try {
    const normalized = sortRecentWork(records).slice(0, MAX_RECENT_WORK_ITEMS);
    if (normalized.length === 0) {
      target.removeItem(RECENT_WORK_STORAGE_KEY);
      return true;
    }

    target.setItem(RECENT_WORK_STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}

export function listRecentWorks(storage?: BrowserStorageLike): RecentWorkRecord[] {
  return readRecentWorkRecords(storage);
}

export function saveRecentWork(input: SaveRecentWorkInput, storage?: BrowserStorageLike): RecentWorkRecord | null {
  const timestamp = input.savedAt ?? new Date().toISOString();
  const record: RecentWorkRecord = {
    id: input.id ?? crypto.randomUUID(),
    contractVersion: RECENT_WORK_CONTRACT_VERSION,
    posture: RECENT_WORK_POSTURE,
    preferredStyle: input.preferredStyle,
    sourceLabel: buildSourceLabel(input.source),
    edition: {
      vector: input.edition.vector,
      palette: clonePaletteSnapshot(input.edition.palette),
    },
    savedAt: timestamp,
    lastOpenedAt: timestamp,
  };

  const records = readRecentWorkRecords(storage).filter((entry) => entry.id !== record.id);
  const nextRecords = [record, ...records];
  return persistRecentWorkRecords(nextRecords, storage) ? record : null;
}

export function getRecentWork(id: string, storage?: BrowserStorageLike): RecentWorkRecord | null {
  return readRecentWorkRecords(storage).find((entry) => entry.id === id) ?? null;
}

export function markRecentWorkOpened(
  id: string,
  openedAt: string = new Date().toISOString(),
  storage?: BrowserStorageLike,
): RecentWorkRecord | null {
  const records = readRecentWorkRecords(storage);
  const match = records.find((entry) => entry.id === id);
  if (!match) return null;

  const updated: RecentWorkRecord = {
    ...match,
    lastOpenedAt: openedAt,
  };

  const nextRecords = records.map((entry) => (entry.id === id ? updated : entry));
  return persistRecentWorkRecords(nextRecords, storage) ? updated : null;
}

export function removeRecentWork(id: string, storage?: BrowserStorageLike): boolean {
  const records = readRecentWorkRecords(storage);
  if (!records.some((entry) => entry.id === id)) return false;

  return persistRecentWorkRecords(records.filter((entry) => entry.id !== id), storage);
}
