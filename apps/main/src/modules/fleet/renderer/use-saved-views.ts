import { useCallback, useState } from 'react';

import { readStorageValue, writeStorageValue } from '@/renderer/storage';

export type SavedView = { name: string; query: string };

const storageKey = 'ensemble.fleet.views';
const maxViews = 50;

function load(): SavedView[] {
   try {
      const parsed: unknown = JSON.parse(readStorageValue(storageKey).unwrapOr(null) ?? '[]');
      return Array.isArray(parsed)
         ? parsed.filter((view): view is SavedView => typeof view?.name === 'string' && typeof view?.query === 'string').slice(0, maxViews)
         : [];
   } catch {
      return [];
   }
}

// views are a per-viewer convenience kept in browser storage, and the page works without it
export function useSavedViews() {
   const [views, setViews] = useState(load);
   const commit = useCallback((next: SavedView[]) => {
      setViews(next);
      void writeStorageValue(storageKey, JSON.stringify(next));
   }, []);

   return {
      views,
      save: (name: string, query: string) => commit([...views.filter((view) => view.name !== name), { name, query }].slice(-maxViews)),
      remove: (name: string) => commit(views.filter((view) => view.name !== name))
   };
}
