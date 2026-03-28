import type { PaletteResult } from '@/lib/color/palette';
import type { PaletteSelectionVector } from '@/lib/color/palette-family-selection';
import type { StyleName } from '@/lib/render/types';
import type { ParameterVector } from '@/types/engine';

/**
 * Anonymous same-browser continuity restores a recent edition family from safe,
 * derived metadata only. It intentionally does NOT promise a pixel-identical
 * session snapshot and never stores raw source material.
 */
export const RECENT_WORK_CONTRACT_VERSION = 1 as const;

export const RECENT_WORK_POSTURE = 'edition-family-recall' as const;

export type RecentWorkSourceKind = 'text' | 'url' | 'data';

export interface RecentWorkSourceLabel {
  kind: RecentWorkSourceKind;
  primary: string;
  secondary: string;
}

export interface RecentWorkPaletteSnapshot {
  familyId: PaletteResult['familyId'];
  familyName: PaletteResult['familyName'];
  familyDescriptor: PaletteResult['familyDescriptor'];
  harmony: PaletteResult['harmony'];
  count: PaletteResult['count'];
  selectionKey: PaletteResult['selectionKey'];
  selectionVector: PaletteSelectionVector;
  mapping: PaletteResult['mapping'];
  dark: PaletteResult['dark'];
  light: PaletteResult['light'];
}

export interface RecentWorkEditionSnapshot {
  vector: ParameterVector;
  palette: RecentWorkPaletteSnapshot;
}

export interface RecentWorkRecord {
  id: string;
  contractVersion: typeof RECENT_WORK_CONTRACT_VERSION;
  posture: typeof RECENT_WORK_POSTURE;
  preferredStyle: StyleName;
  sourceLabel: RecentWorkSourceLabel;
  edition: RecentWorkEditionSnapshot;
  savedAt: string;
  lastOpenedAt: string;
}

export interface SaveRecentWorkInput {
  id?: string;
  preferredStyle: StyleName;
  edition: RecentWorkEditionSnapshot;
  source:
    | { kind: 'text' }
    | { kind: 'url'; hostname?: string }
    | { kind: 'data'; format?: 'csv' | 'json' | 'auto'; rowCount?: number; columnCount?: number };
  savedAt?: string;
}

export interface BrowserStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
