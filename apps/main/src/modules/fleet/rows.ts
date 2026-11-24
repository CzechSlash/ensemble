import type { FleetTags } from '@/modules/fleet/tags';
import type { InstallSummary } from '@/modules/installs/contract';
import type { QuestState } from '@/modules/quest/contract';
import { localTargetId, type Target, type TargetConnection, type TargetId } from '@/modules/targets/contract';

export type FleetKind = 'this-pc' | 'pc' | 'quest';

export type FleetRow = {
   id: TargetId;
   name: string;
   kind: FleetKind;
   status: Target['status'];
   connection: TargetConnection | null;
   via: string | null;
   gameVersions: string[];
   modded: boolean | null;
   tags: string[];
};

export function fleetKind(target: Target): FleetKind {
   return target.id === localTargetId ? 'this-pc' : target.kind === 'quest' ? 'quest' : 'pc';
}

// Quest versions carry a store build suffix like 1.40.0_5754
export function displayGameVersion(version: string) {
   return version.replace(/_\d+$/, '');
}

export function buildFleetRows(
   targets: readonly Target[],
   installs: ReadonlyMap<TargetId, readonly InstallSummary[]>,
   quest: ReadonlyMap<TargetId, QuestState>,
   tags: Readonly<FleetTags> = {}
): FleetRow[] {
   return targets.map((target) => {
      const versions = (installs.get(target.id) ?? []).flatMap((install) => (install.version ? [displayGameVersion(install.version)] : []));

      return {
         id: target.id,
         name: target.name,
         kind: fleetKind(target),
         status: target.status,
         connection: target.connection ?? null,
         via: target.via ?? null,
         gameVersions: [...new Set(versions)],
         modded: quest.get(target.id)?.modded ?? null,
         tags: tags[target.id] ?? []
      };
   });
}

export function matchesFleetQuery(row: FleetRow, query: string) {
   const text = query.trim().toLowerCase();
   return text === '' || [row.name, row.via, ...row.gameVersions, ...row.tags].some((field) => field?.toLowerCase().includes(text));
}
