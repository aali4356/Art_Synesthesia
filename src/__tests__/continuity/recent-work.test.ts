import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_RECENT_WORK_ITEMS, RECENT_WORK_STORAGE_KEY, getRecentWork, listRecentWorks, markRecentWorkOpened, removeRecentWork, saveRecentWork } from '@/lib/continuity/recent-work';
import type { BrowserStorageLike, SaveRecentWorkInput } from '@/lib/continuity/types';

function createStorageStub(seed?: Record<string, string>): BrowserStorageLike {
  const store = { ...(seed ?? {}) };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
}

function createThrowingStorage(): BrowserStorageLike {
  return {
    getItem: () => {
      throw new Error('storage unavailable');
    },
    setItem: () => {
      throw new Error('storage unavailable');
    },
    removeItem: () => {
      throw new Error('storage unavailable');
    },
  };
}

function buildInput(overrides: Partial<SaveRecentWorkInput> = {}): SaveRecentWorkInput {
  return {
    id: overrides.id ?? 'work-1',
    preferredStyle: overrides.preferredStyle ?? 'geometric',
    source: overrides.source ?? { kind: 'text' },
    savedAt: overrides.savedAt ?? '2026-03-25T12:00:00.000Z',
    edition: overrides.edition ?? {
      vector: {
        complexity: 0.51,
        warmth: 0.42,
        symmetry: 0.63,
        rhythm: 0.34,
        energy: 0.72,
        density: 0.48,
        scaleVariation: 0.59,
        curvature: 0.21,
        saturation: 0.67,
        contrast: 0.55,
        layering: 0.44,
        directionality: 0.38,
        paletteSize: 0.61,
        texture: 0.29,
        regularity: 0.46,
      },
      palette: {
        familyId: 'orchid-nocturne',
        familyName: 'Orchid Nocturne',
        familyDescriptor: 'Velvet violets with low-lit contrast',
        harmony: 'analogous',
        count: 4,
        selectionKey: 'orchid-nocturne:analogous:4',
        mapping: {
          anchorHue: 280,
          harmony: 'analogous',
          mood: 'luminous',
          chromaPosture: 'lush',
          contrastPosture: 'balanced',
        },
        dark: [
          { hex: '#23002d', css: 'oklch(0.25 0.11 280)', oklch: { mode: 'oklch', l: 0.25, c: 0.11, h: 280 } },
        ],
        light: [
          { hex: '#f2dcff', css: 'oklch(0.92 0.06 280)', oklch: { mode: 'oklch', l: 0.92, c: 0.06, h: 280 } },
        ],
      },
    },
  };
}

describe('anonymous recent-work continuity storage contract', () => {
  let storage: BrowserStorageLike;

  beforeEach(() => {
    storage = createStorageStub();
  });

  it('saves, reads, marks opened, lists in deterministic recency order, and removes items', () => {
    const older = saveRecentWork(
      buildInput({
        id: 'older',
        savedAt: '2026-03-24T09:00:00.000Z',
        preferredStyle: 'organic',
      }),
      storage,
    );
    const newer = saveRecentWork(
      buildInput({
        id: 'newer',
        savedAt: '2026-03-25T09:00:00.000Z',
        preferredStyle: 'particle',
      }),
      storage,
    );

    expect(older?.savedAt).toBe('2026-03-24T09:00:00.000Z');
    expect(newer?.savedAt).toBe('2026-03-25T09:00:00.000Z');
    expect(listRecentWorks(storage).map((entry) => entry.id)).toEqual(['newer', 'older']);
    expect(getRecentWork('older', storage)?.preferredStyle).toBe('organic');

    const reopened = markRecentWorkOpened('older', '2026-03-26T09:30:00.000Z', storage);
    expect(reopened?.lastOpenedAt).toBe('2026-03-26T09:30:00.000Z');
    expect(listRecentWorks(storage).map((entry) => entry.id)).toEqual(['older', 'newer']);

    expect(removeRecentWork('newer', storage)).toBe(true);
    expect(removeRecentWork('missing', storage)).toBe(false);
    expect(listRecentWorks(storage).map((entry) => entry.id)).toEqual(['older']);
  });

  it('stores only safe labels and derived edition metadata, not raw source content', () => {
    const rawUrl = 'https://secret.example.com/private/report?token=abc123';
    const rawText = 'my raw poem with apiKey=super-secret';
    const rawDataset = 'email,token\nahmad@example.com,secret';

    saveRecentWork(
      {
        ...buildInput({
          id: 'privacy-proof',
          source: { kind: 'url', hostname: 'secret.example.com' },
        }),
        source: {
          kind: 'url',
          hostname: 'secret.example.com',
          rawUrl,
          rawText,
          rawDataset,
        } as SaveRecentWorkInput['source'] & Record<string, string>,
      },
      storage,
    );

    const storedJson = storage.getItem(RECENT_WORK_STORAGE_KEY);
    expect(storedJson).toBeTruthy();
    expect(storedJson).not.toContain(rawUrl);
    expect(storedJson).not.toContain(rawText);
    expect(storedJson).not.toContain(rawDataset);
    expect(storedJson).toContain('secret.example.com');
    expect(storedJson).not.toContain('/private/report');
    expect(storedJson).not.toContain('token=abc123');

    const [record] = listRecentWorks(storage);
    expect(record.sourceLabel).toEqual({
      kind: 'url',
      primary: 'Reference URL',
      secondary: 'secret.example.com',
    });
  });

  it('caps stored items to the most recent entries', () => {
    for (let index = 0; index < MAX_RECENT_WORK_ITEMS + 2; index += 1) {
      saveRecentWork(
        buildInput({
          id: `work-${index}`,
          savedAt: `2026-03-${String(index + 1).padStart(2, '0')}T08:00:00.000Z`,
        }),
        storage,
      );
    }

    const records = listRecentWorks(storage);
    expect(records).toHaveLength(MAX_RECENT_WORK_ITEMS);
    expect(records.map((entry) => entry.id)).toEqual([
      'work-7',
      'work-6',
      'work-5',
      'work-4',
      'work-3',
      'work-2',
    ]);
    expect(records.some((entry) => entry.id === 'work-0')).toBe(false);
    expect(records.some((entry) => entry.id === 'work-1')).toBe(false);
  });

  it('falls back to an empty state for corrupt JSON', () => {
    storage = createStorageStub({ [RECENT_WORK_STORAGE_KEY]: '{not-valid-json' });

    expect(listRecentWorks(storage)).toEqual([]);
    expect(getRecentWork('missing', storage)).toBeNull();
    expect(markRecentWorkOpened('missing', '2026-03-25T00:00:00.000Z', storage)).toBeNull();
    expect(removeRecentWork('missing', storage)).toBe(false);
  });

  it('degrades safely when storage is unavailable', () => {
    const unavailable = createThrowingStorage();

    expect(saveRecentWork(buildInput(), unavailable)).toBeNull();
    expect(listRecentWorks(unavailable)).toEqual([]);
    expect(getRecentWork('work-1', unavailable)).toBeNull();
    expect(markRecentWorkOpened('work-1', '2026-03-26T00:00:00.000Z', unavailable)).toBeNull();
    expect(removeRecentWork('work-1', unavailable)).toBe(false);
  });
});
