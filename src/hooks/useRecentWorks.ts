'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listRecentWorks,
  markRecentWorkOpened,
  removeRecentWork,
  saveRecentWork,
} from '@/lib/continuity/recent-work';
import type { RecentWorkRecord, SaveRecentWorkInput } from '@/lib/continuity/types';
import { captureClientEvent } from '@/lib/observability/client';
import { OBSERVABILITY_EVENTS } from '@/lib/observability/events';

export type RecentWorkSaveState =
  | { status: 'idle' }
  | { status: 'saved'; record: RecentWorkRecord }
  | { status: 'error'; message: string };

export interface RecentWorkTelemetryMeta {
  continuityMode?: 'fresh' | 'resumed';
  sourceKind?: 'text' | 'url' | 'data' | 'mixed';
}

function captureContinuityEvent(name: string, properties: Record<string, unknown>) {
  try {
    captureClientEvent(name as typeof OBSERVABILITY_EVENTS.continuity.saved, properties);
  } catch {
    // Observability is non-blocking by contract.
  }
}

export function useRecentWorks() {
  const [recentWorks, setRecentWorks] = useState<RecentWorkRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<RecentWorkSaveState>({ status: 'idle' });

  const refresh = useCallback(() => {
    setRecentWorks(listRecentWorks());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveWork = useCallback(
    (input: SaveRecentWorkInput, telemetryMeta: RecentWorkTelemetryMeta = {}) => {
      const record = saveRecentWork(input);
      refresh();

      if (!record) {
        setSaveState({
          status: 'error',
          message: 'Recent local work is unavailable in this browser right now.',
        });
        captureContinuityEvent(OBSERVABILITY_EVENTS.continuity.failed, {
          continuityMode: telemetryMeta.continuityMode ?? 'fresh',
          action: 'error',
          sourceKind: telemetryMeta.sourceKind ?? input.source.kind,
          failureCategory: 'storage-unavailable',
          storedItems: listRecentWorks().length,
        });
        return null;
      }

      setSaveState({ status: 'saved', record });
      captureContinuityEvent(OBSERVABILITY_EVENTS.continuity.saved, {
        continuityMode: telemetryMeta.continuityMode ?? 'fresh',
        action: 'save',
        sourceKind: telemetryMeta.sourceKind ?? input.source.kind,
        storedItems: listRecentWorks().length,
      });
      return record;
    },
    [refresh]
  );

  const reopenWork = useCallback(
    (id: string, telemetryMeta: RecentWorkTelemetryMeta = {}) => {
      const updated = markRecentWorkOpened(id) ?? listRecentWorks().find((entry) => entry.id === id) ?? null;
      refresh();

      if (!updated) {
        captureContinuityEvent(OBSERVABILITY_EVENTS.continuity.failed, {
          continuityMode: telemetryMeta.continuityMode ?? 'resumed',
          action: 'error',
          sourceKind: telemetryMeta.sourceKind ?? 'mixed',
          failureCategory: 'missing-record',
          storedItems: listRecentWorks().length,
        });
        return null;
      }

      captureContinuityEvent(OBSERVABILITY_EVENTS.continuity.resumed, {
        continuityMode: telemetryMeta.continuityMode ?? 'resumed',
        action: 'resume',
        sourceKind: telemetryMeta.sourceKind ?? updated.sourceLabel.kind,
        storedItems: listRecentWorks().length,
      });
      return updated;
    },
    [refresh]
  );

  const removeWork = useCallback(
    (id: string, telemetryMeta: RecentWorkTelemetryMeta = {}) => {
      const record = listRecentWorks().find((entry) => entry.id === id) ?? null;
      const removed = removeRecentWork(id);
      refresh();

      if (!removed) {
        captureContinuityEvent(OBSERVABILITY_EVENTS.continuity.failed, {
          continuityMode: telemetryMeta.continuityMode ?? 'fresh',
          action: 'error',
          sourceKind: telemetryMeta.sourceKind ?? record?.sourceLabel.kind ?? 'mixed',
          failureCategory: 'missing-record',
          storedItems: listRecentWorks().length,
        });
        return false;
      }

      captureContinuityEvent(OBSERVABILITY_EVENTS.continuity.removed, {
        continuityMode: telemetryMeta.continuityMode ?? 'fresh',
        action: 'remove',
        sourceKind: telemetryMeta.sourceKind ?? record?.sourceLabel.kind ?? 'mixed',
        storedItems: listRecentWorks().length,
      });
      return removed;
    },
    [refresh]
  );

  const dismissSaveState = useCallback(() => {
    setSaveState({ status: 'idle' });
  }, []);

  return {
    recentWorks,
    isLoaded,
    saveState,
    saveWork,
    reopenWork,
    removeWork,
    refresh,
    dismissSaveState,
  };
}
