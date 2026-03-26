'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  listRecentWorks,
  markRecentWorkOpened,
  removeRecentWork,
  saveRecentWork,
} from '@/lib/continuity/recent-work';
import type { RecentWorkRecord, SaveRecentWorkInput } from '@/lib/continuity/types';

export type RecentWorkSaveState =
  | { status: 'idle' }
  | { status: 'saved'; record: RecentWorkRecord }
  | { status: 'error'; message: string };

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
    (input: SaveRecentWorkInput) => {
      const record = saveRecentWork(input);
      refresh();

      if (!record) {
        setSaveState({
          status: 'error',
          message: 'Recent local work is unavailable in this browser right now.',
        });
        return null;
      }

      setSaveState({ status: 'saved', record });
      return record;
    },
    [refresh]
  );

  const reopenWork = useCallback(
    (id: string) => {
      const updated = markRecentWorkOpened(id) ?? listRecentWorks().find((entry) => entry.id === id) ?? null;
      refresh();
      return updated;
    },
    [refresh]
  );

  const removeWork = useCallback(
    (id: string) => {
      const removed = removeRecentWork(id);
      refresh();
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
