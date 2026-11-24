import { useCallback, useRef, useState } from 'react';

import { useTranslations } from 'use-intl';

import { createProblem } from '@/lib/errors';
import { runBulk, waitForOperation, type BulkResults } from '@/modules/fleet/bulk';
import { pickInstall } from '@/modules/fleet/versions';
import type { InstallSummary } from '@/modules/installs/contract';
import { localTargetId, type TargetId } from '@/modules/targets/contract';
import { unwrapIpc, unwrapTarget } from '@/renderer/ipc-result';

const restartPauseMs = 2_000;

type PickInstall = (installs: readonly InstallSummary[]) => InstallSummary;

export type BulkActionKind = 'launch' | 'stop' | 'patch' | 'unmod' | 'mods' | 'maps' | 'restart';

async function launchTarget(targetId: TargetId, installs: readonly InstallSummary[], pick: PickInstall) {
   const install = pick(installs);
   const request = { targetId, installId: install.id };
   const options = unwrapTarget(await window.encore.launch.getOptions(request));
   unwrapIpc(unwrapTarget(await window.encore.launch.start({ ...request, options })));
}

async function stopTarget(targetId: TargetId) {
   const stopped = unwrapIpc(unwrapTarget(await window.encore.quest.stopGame({ targetId })));
   if (stopped.status === 'failed') throw new Error((stopped.error ?? createProblem('launch.stop-failed')).message);
}

// a headset's game can be closed from here, so a restart closes it and starts it again; a PC has no stop, so it only starts
async function restartTarget(targetId: TargetId, installs: readonly InstallSummary[], pick: PickInstall) {
   pick(installs);
   if (targetId.includes('quest:')) {
      await stopTarget(targetId);
      await new Promise((resolve) => setTimeout(resolve, restartPauseMs));
   }
   await launchTarget(targetId, installs, pick);
}

async function finishOperation(targetId: TargetId, started: { status: string; id: string; error?: { message: string } }) {
   if (started.status === 'failed') throw new Error(started.error?.message ?? started.status);
   await waitForOperation(async () => unwrapTarget(await window.encore.operations.list({ targetId })), started.id);
}

async function patchTarget(targetId: TargetId, action: 'patch' | 'unmod') {
   const call = action === 'patch' ? window.encore.quest.patch : window.encore.quest.unmod;
   await finishOperation(targetId, unwrapIpc(unwrapTarget(await call({ targetId }))));
}

async function readyMods(targetId: TargetId, installs: readonly InstallSummary[], pick: PickInstall) {
   const install = pick(installs);
   const snapshot = unwrapTarget(await window.encore.mods.getMods({ targetId, installId: install.id }));
   if (snapshot.status !== 'ready') throw new Error(snapshot.detail ?? snapshot.issue);
   return { installId: install.id, mods: snapshot.mods };
}

// installs whatever the reference device has that the target is missing; dependencies are resolved by the install itself
async function matchMods(targetId: TargetId, installs: readonly InstallSummary[], referenceModIds: readonly string[], pick: PickInstall) {
   const { installId, mods } = await readyMods(targetId, installs, pick);
   const have = new Set(mods.filter((mod) => mod.installedVersion !== null).map((mod) => mod.modId));
   const modIds = referenceModIds.filter((id) => !have.has(id));
   if (modIds.length === 0) return;
   await finishOperation(targetId, unwrapIpc(unwrapTarget(await window.encore.mods.installMods({ targetId, installId, modIds }))));
}

// the control PC copies the maps, so its own operation list is the one to watch
async function pushMaps(
   targetId: TargetId,
   installs: readonly InstallSummary[],
   reference: { targetId: TargetId; installId: string },
   pick: PickInstall
) {
   const install = pick(installs);
   if (targetId === reference.targetId) return;
   const started = unwrapIpc(await window.encore.fleet.pushMaps({ reference, target: { targetId, installId: install.id } }));
   const finished = await waitForOperation(async () => unwrapTarget(await window.encore.operations.list({ targetId: localTargetId })), started.id);
   const failed = typeof finished.result === 'object' && finished.result !== null && 'failed' in finished.result ? Number(finished.result.failed) : 0;
   if (failed > 0) throw new Error(`${failed} maps failed to copy`);
}

export function useBulkActions(installs: ReadonlyMap<TargetId, readonly InstallSummary[]>) {
   const [results, setResults] = useState<{ action: BulkActionKind; outcomes: BulkResults } | null>(null);
   const [busy, setBusy] = useState(false);
   const [referenceId, setReferenceId] = useState<TargetId | null>(null);
   const [version, setVersion] = useState<string | null>(null);
   const t = useTranslations('console');
   const installsRef = useRef(installs);
   installsRef.current = installs;

   const run = useCallback(
      async (action: BulkActionKind, targetIds: readonly TargetId[], referenceId: TargetId | null = null, wanted: string | null = null) => {
         setBusy(true);
         setReferenceId(referenceId);
         setVersion(wanted);
         // a wanted version must be installed on the device, otherwise that device fails rather than launching something else
         const pick: PickInstall = (installs) => {
            const install = pickInstall(installs, wanted);
            if (!install) throw new Error(wanted ? t('versionMissing', { version: wanted }) : createProblem('launch.start-failed').message);
            return install;
         };
         setResults({ action, outcomes: new Map(targetIds.map((id) => [id, { status: 'running' as const }])) });
         const referenceInstall = referenceId ? pickInstall(installsRef.current.get(referenceId) ?? [], wanted) : undefined;
         const referenceSide = { targetId: referenceId ?? '', installId: referenceInstall?.id ?? '' };
         const reference =
            action === 'mods' && referenceId
               ? readyMods(referenceId, installsRef.current.get(referenceId) ?? [], pick).then(({ mods }) =>
                    mods.filter((mod) => mod.installedVersion !== null).map((mod) => mod.modId)
                 )
               : Promise.resolve<string[]>([]);
         reference.catch(() => {});
         await runBulk(
            targetIds,
            async (id) => {
               const known = installsRef.current.get(id) ?? [];
               if (action === 'launch') return launchTarget(id, known, pick);
               if (action === 'stop') return stopTarget(id);
               if (action === 'restart') return restartTarget(id, known, pick);
               if (action === 'mods') return matchMods(id, known, await reference, pick);
               if (action === 'maps') return pushMaps(id, known, referenceSide, pick);
               return patchTarget(id, action);
            },
            (id, outcome) =>
               setResults((current) =>
                  current && current.action === action ? { action, outcomes: new Map(current.outcomes).set(id, outcome) } : current
               ),
            // patching and installs download and rewrite large files, so fewer run at once than quick launches
            action === 'launch' || action === 'stop' || action === 'restart' ? undefined : action === 'maps' ? 2 : 3
         );
         setBusy(false);
      },
      [t]
   );

   const failedIds = results ? [...results.outcomes].filter(([, outcome]) => outcome.status === 'failed').map(([id]) => id) : [];

   return { run, busy, results, failedIds, referenceId, version, dismiss: () => setResults(null) };
}
