import { useQueries } from '@tanstack/react-query';

import { useTags } from '@/modules/fleet/renderer/use-tags';
import { buildFleetRows } from '@/modules/fleet/rows';
import { installListQueryOptions } from '@/modules/installs/renderer/queries';
import { questStateQueryOptions } from '@/modules/quest/renderer/quest-queries';
import { useTargets } from '@/modules/targets/renderer/use-targets';

// shares query keys with the sidebar and the per-install pages, so rows update from the same live snapshots
export function useFleet() {
   const { targets, status, reload } = useTargets();
   const { tags, update: updateTags, updating: tagging } = useTags();
   const ready = targets.filter((target) => target.status === 'ready');
   const listable = ready.filter((target) => target.capabilities.includes('list-installs'));
   const patchable = ready.filter((target) => target.kind === 'quest' && target.capabilities.includes('patch-game'));
   const installQueries = useQueries({ queries: listable.map((target) => installListQueryOptions(target.id)) });
   const questQueries = useQueries({ queries: patchable.map((target) => questStateQueryOptions(target.id)) });

   const installs = new Map(
      listable.flatMap((target, index) => {
         const snapshot = installQueries[index]?.data;
         return snapshot ? [[target.id, snapshot.installs] as const] : [];
      })
   );
   const quest = new Map(
      patchable.flatMap((target, index) => {
         const state = questQueries[index]?.data;
         return state ? [[target.id, state] as const] : [];
      })
   );

   return { rows: buildFleetRows(targets, installs, quest, tags), installs, tags, updateTags, tagging, status, reload };
}
