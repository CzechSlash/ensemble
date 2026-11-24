import { useCallback, useRef, useState } from 'react';

import { mapWithConcurrency } from '@/lib/concurrency';
import { compareToReference, type ComplianceMod, type ComplianceResult, type ComplianceSnapshot } from '@/modules/fleet/compliance';
import { displayGameVersion } from '@/modules/fleet/rows';
import { pickInstall } from '@/modules/fleet/versions';
import type { InstallSummary } from '@/modules/installs/contract';
import type { TargetId } from '@/modules/targets/contract';
import { unwrapTarget } from '@/renderer/ipc-result';

const checkConcurrency = 4;

// reads the mod list of one install; `wanted` picks the install with that game version, otherwise the first one
async function readSnapshot(targetId: TargetId, installs: readonly InstallSummary[], wanted: string | null): Promise<ComplianceSnapshot> {
   const install = pickInstall(installs, wanted);
   if (!install) return { gameVersion: installs[0]?.version ? displayGameVersion(installs[0].version) : null, mods: [] };

   const snapshot = unwrapTarget(await window.encore.mods.getMods({ targetId, installId: install.id }));
   if (snapshot.status !== 'ready') throw new Error(snapshot.detail ?? snapshot.issue);

   const catalog: ComplianceMod[] = snapshot.mods
      .filter((mod) => mod.installedVersion !== null)
      .map((mod) => ({ id: mod.modId, name: mod.name, version: mod.installedVersion }));
   // mods that were copied in by hand are part of what a player runs, so they count too
   const external: ComplianceMod[] = snapshot.external.map((mod) => ({
      id: `external:${mod.id}`,
      name: mod.details?.name ?? mod.name,
      version: mod.details?.version ?? null
   }));
   return { gameVersion: displayGameVersion(snapshot.gameVersion), mods: [...catalog, ...external] };
}

// every device is compared with one reference device, so the reference is the rulebook for the whole event
export function useCompliance(installs: ReadonlyMap<TargetId, readonly InstallSummary[]>) {
   const [results, setResults] = useState<ReadonlyMap<TargetId, ComplianceResult>>(new Map());
   const [referenceId, setReferenceId] = useState<TargetId | null>(null);
   const [busy, setBusy] = useState(false);
   const installsRef = useRef(installs);
   installsRef.current = installs;

   const run = useCallback(async (reference: TargetId, targetIds: readonly TargetId[]) => {
      setBusy(true);
      setReferenceId(reference);
      const update = (id: TargetId, result: ComplianceResult) => setResults((current) => new Map(current).set(id, result));
      setResults(new Map(targetIds.map((id) => [id, { status: 'running' as const }])));

      try {
         const expected = await readSnapshot(reference, installsRef.current.get(reference) ?? [], null);
         await mapWithConcurrency(targetIds, checkConcurrency, async (id) => {
            try {
               const device = id === reference ? expected : await readSnapshot(id, installsRef.current.get(id) ?? [], expected.gameVersion);
               const issues = compareToReference(expected, device);
               update(id, issues.length === 0 ? { status: 'pass' } : { status: 'fail', issues });
            } catch (error) {
               update(id, { status: 'error', message: error instanceof Error ? error.message : String(error) });
            }
         });
      } catch (error) {
         // without a readable reference nothing can be compared
         const message = error instanceof Error ? error.message : String(error);
         setResults(new Map(targetIds.map((id) => [id, { status: 'error' as const, message }])));
      }
      setBusy(false);
   }, []);

   return { run, busy, results, referenceId, dismiss: () => setResults(new Map()) };
}
