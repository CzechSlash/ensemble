import { useState } from 'react';

import { CircleCheck, CircleX, Loader2, Lock, Monitor, Play, RotateCcw, Square } from 'lucide-react';
import { useTranslations } from 'use-intl';

import { ConfirmDialog } from '@/components/dialog/confirm-dialog';
import { QuestIcon } from '@/components/headset-icons';
import { EmptyPanel, ErrorPanel, LoadingPanel, WarningLine } from '@/components/state/state-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { useConsoleLock } from '@/modules/fleet/renderer/console-lock';
import { FleetResults } from '@/modules/fleet/renderer/fleet-results';
import { PinDialog, type PinDialogMode } from '@/modules/fleet/renderer/pin-dialog';
import { useBulkActions } from '@/modules/fleet/renderer/use-bulk-actions';
import { useFleet } from '@/modules/fleet/renderer/use-fleet';
import { allTags } from '@/modules/fleet/tags';
import { readStorageValue, writeStorageValue } from '@/renderer/storage';

const allScope = '__all__';
const scopeKey = 'ensemble.console.scope';
const versionKey = 'ensemble.console.version';
const anyVersion = '__any__';
const cardLimit = 120;

type ConsoleDialog = PinDialogMode | 'stop' | 'restart' | null;

// big buttons for event staff: start, stop or restart everything in a scope, or a single station
export function OperatorConsole() {
   const t = useTranslations('console');
   const fleet = useTranslations('fleet');
   const targets = useTranslations('targets');
   const { rows, installs, tags, status, reload } = useFleet();
   const bulk = useBulkActions(installs);
   const lock = useConsoleLock();
   const [scope, setScope] = useState(() => readStorageValue(scopeKey).unwrapOr(null) ?? allScope);
   const [versionChoice, setVersionChoice] = useState(() => readStorageValue(versionKey).unwrapOr(null) ?? anyVersion);
   const [dialog, setDialog] = useState<ConsoleDialog>(null);
   const close = () => setDialog(null);

   const options = allTags(tags);
   const inScope = rows
      .filter((row) => scope === allScope || row.tags.includes(scope))
      .toSorted((first, second) => first.name.localeCompare(second.name, undefined, { numeric: true }));
   const versions = [...new Set(inScope.flatMap((row) => row.gameVersions))].toSorted((first, second) =>
      second.localeCompare(first, undefined, { numeric: true })
   );
   // a version remembered from an earlier event may not exist in this scope, in which case it is shown but flagged
   const wanted = versionChoice === anyVersion ? null : versionChoice;
   const lacking = wanted ? inScope.filter((row) => !row.gameVersions.includes(wanted)) : [];
   const readyIds = inScope.filter((row) => row.status === 'ready').map((row) => row.id);
   const names = new Map(rows.map((row) => [row.id, row.name]));
   const results = bulk.results;

   if (status === 'loading') return <LoadingPanel />;
   if (status === 'error') return <ErrorPanel message={fleet('loadError')} onRetry={reload} />;

   return (
      <div className="flex min-h-0 flex-1 flex-col">
         <div className="flex shrink-0 flex-col gap-4 border-b px-4 pt-4 pb-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex min-w-0 flex-1 items-baseline gap-2">
                  <h1 className="min-w-0 truncate text-lg leading-tight font-semibold">{t('title')}</h1>
                  <span className="text-muted-foreground text-sm">
                     {t('summary', { ready: readyIds.length, notReady: inScope.length - readyIds.length })}
                  </span>
               </div>
               <Select
                  value={scope}
                  disabled={lock.locked}
                  onValueChange={(value) => {
                     setScope(value);
                     void writeStorageValue(scopeKey, value);
                  }}
               >
                  <SelectTrigger variant="filter" size="compact" aria-label={t('scope')}>
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value={allScope}>{t('scopeAll')}</SelectItem>
                     {options.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                           {tag}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
               <Select
                  value={versionChoice}
                  disabled={lock.locked}
                  onValueChange={(value) => {
                     setVersionChoice(value);
                     void writeStorageValue(versionKey, value);
                  }}
               >
                  <SelectTrigger variant="filter" size="compact" aria-label={t('version')}>
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value={anyVersion}>{t('versionAny')}</SelectItem>
                     {wanted && !versions.includes(wanted) ? <SelectItem value={wanted}>{wanted}</SelectItem> : null}
                     {versions.map((version) => (
                        <SelectItem key={version} value={version}>
                           {version}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
               {lock.locked ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setDialog('enter')}>
                     <Lock data-icon="inline-start" />
                     {t('lock.unlock')}
                  </Button>
               ) : lock.hasPin ? (
                  <>
                     <Button type="button" variant="outline" size="sm" onClick={lock.lock}>
                        <Lock data-icon="inline-start" />
                        {t('lock.action')}
                     </Button>
                     <Button type="button" variant="ghost" size="sm" onClick={() => setDialog('remove')}>
                        {t('lock.removePin')}
                     </Button>
                  </>
               ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setDialog('set')}>
                     <Lock data-icon="inline-start" />
                     {t('lock.setPin')}
                  </Button>
               )}
            </div>

            <div className="flex flex-wrap gap-3">
               <Button
                  type="button"
                  size="lg"
                  disabled={bulk.busy || readyIds.length === 0}
                  onClick={() => void bulk.run('launch', readyIds, null, wanted)}
               >
                  <Play data-icon="inline-start" />
                  {t('launchAll')}
               </Button>
               <Button type="button" variant="outline" size="lg" disabled={bulk.busy || readyIds.length === 0} onClick={() => setDialog('stop')}>
                  <Square data-icon="inline-start" />
                  {t('stopAll')}
               </Button>
               <Button type="button" variant="outline" size="lg" disabled={bulk.busy || readyIds.length === 0} onClick={() => setDialog('restart')}>
                  <RotateCcw data-icon="inline-start" />
                  {t('restartAll')}
               </Button>
            </div>
         </div>

         <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-6 text-sm sm:px-8">
            {wanted && lacking.length > 0 ? <WarningLine>{t('missingSummary', { count: lacking.length, version: wanted })}</WarningLine> : null}

            {results ? (
               <FleetResults
                  action={results.action}
                  outcomes={results.outcomes}
                  names={names}
                  busy={bulk.busy}
                  failedCount={bulk.failedIds.length}
                  onRetry={() => void bulk.run(results.action, bulk.failedIds, null, bulk.version)}
                  onDismiss={bulk.dismiss}
               />
            ) : null}

            {inScope.length === 0 ? (
               <EmptyPanel description={rows.length === 0 ? fleet('empty') : t('empty')} />
            ) : (
               <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3">
                  {inScope.slice(0, cardLimit).map((row) => {
                     const outcome = results?.outcomes.get(row.id);
                     const ready = row.status === 'ready';
                     return (
                        <li key={row.id} className="bg-card flex min-w-0 flex-col gap-3 rounded-lg border p-3">
                           <div className="flex min-w-0 items-center gap-2">
                              {row.kind === 'quest' ? <QuestIcon className="size-5 shrink-0" /> : <Monitor className="size-5 shrink-0" />}
                              <span className="min-w-0 flex-1 truncate font-medium">{row.name}</span>
                              {outcome?.status === 'running' ? (
                                 <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                              ) : outcome?.status === 'ok' ? (
                                 <CircleCheck className="text-primary size-4 shrink-0" />
                              ) : outcome?.status === 'failed' ? (
                                 <CircleX className="text-destructive size-4 shrink-0" />
                              ) : ready && wanted && !row.gameVersions.includes(wanted) ? (
                                 <Badge variant="secondary">{t('missingBadge', { version: wanted })}</Badge>
                              ) : !ready ? (
                                 <Badge variant={row.status === 'unpaired' ? 'secondary' : 'destructive'}>{targets(`status.${row.status}`)}</Badge>
                              ) : null}
                           </div>
                           <div className="flex gap-2">
                              <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 className="flex-1"
                                 disabled={bulk.busy || !ready}
                                 onClick={() => void bulk.run('launch', [row.id], null, wanted)}
                              >
                                 <Play data-icon="inline-start" />
                                 {t('launch')}
                              </Button>
                              <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 className="flex-1"
                                 disabled={bulk.busy || !ready}
                                 onClick={() => void bulk.run('restart', [row.id], null, wanted)}
                              >
                                 <RotateCcw data-icon="inline-start" />
                                 {t('restart')}
                              </Button>
                           </div>
                        </li>
                     );
                  })}
               </ul>
            )}
            {inScope.length > cardLimit ? <p className="text-muted-foreground text-xs">{t('more', { count: inScope.length - cardLimit })}</p> : null}
         </div>

         <ConfirmDialog
            open={dialog === 'stop' || dialog === 'restart'}
            title={t(`confirm.${dialog === 'restart' ? 'restart' : 'stop'}.title`)}
            description={t(`confirm.${dialog === 'restart' ? 'restart' : 'stop'}.description`, { count: readyIds.length })}
            confirmLabel={t(`confirm.${dialog === 'restart' ? 'restart' : 'stop'}.confirm`)}
            onOpenChange={(open) => {
               if (!open) close();
            }}
            onConfirm={() => {
               const action = dialog === 'restart' ? 'restart' : 'stop';
               close();
               void bulk.run(action, readyIds, null, wanted);
            }}
         />
         {dialog === 'set' || dialog === 'enter' || dialog === 'remove' ? (
            <PinDialog
               mode={dialog}
               onOpenChange={close}
               onSubmit={async (pin) => {
                  if (dialog === 'set') {
                     await lock.setPin(pin);
                     return true;
                  }
                  return dialog === 'enter' ? lock.unlock(pin) : lock.removePin(pin);
               }}
            />
         ) : null}
      </div>
   );
}
