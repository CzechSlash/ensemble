import { Play, Square, Wrench, X } from 'lucide-react';
import { useTranslations } from 'use-intl';

import type { CollectionSelection } from '@/components/collection/selection';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { FleetDialogKind } from '@/modules/fleet/renderer/fleet-actions';
import { FleetDevice } from '@/modules/fleet/renderer/fleet-detail';
import type { FleetRow } from '@/modules/fleet/rows';

const listLimit = 100;

// the one right pane: who the actions apply to, and the actions.
// the same actions appear for one device or many; only the heading changes
export function FleetPane({
   targets,
   picked,
   selection,
   busy,
   onLaunch,
   onStop,
   onPatch,
   onOpen
}: {
   targets: readonly FleetRow[];
   picked: readonly FleetRow[];
   selection: CollectionSelection;
   busy: boolean;
   onLaunch: () => void;
   onStop: () => void;
   onPatch: () => void;
   onOpen: (kind: FleetDialogKind) => void;
}) {
   const t = useTranslations('fleet');
   const ready = targets.filter((row) => row.status === 'ready');
   const quests = ready.filter((row) => row.kind === 'quest');
   const single = targets.length === 1 ? targets[0] : undefined;

   return (
      <div className="flex min-w-0 flex-col gap-5 p-5 pr-7">
         {single ? (
            <FleetDevice row={single} />
         ) : (
            <div className="min-w-0">
               <h3 className="text-lg leading-tight font-semibold">
                  {targets.length > 0 ? t('selection.title', { count: targets.length }) : t('selection.none')}
               </h3>
               <p className="text-muted-foreground mt-1 text-sm">
                  {targets.length > 0
                     ? [
                          t('selection.summary', { ready: ready.length, quests: quests.length }),
                          targets.length > ready.length ? t('selection.offline', { count: targets.length - ready.length }) : null
                       ]
                          .filter(Boolean)
                          .join(' · ')
                     : t('selection.hint')}
               </p>
            </div>
         )}

         {targets.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
               <Button type="button" size="sm" disabled={busy || ready.length === 0} onClick={onLaunch}>
                  <Play data-icon="inline-start" />
                  {t('launch')}
               </Button>
               <Button type="button" variant="outline" size="sm" disabled={busy || ready.length === 0} onClick={onStop}>
                  <Square data-icon="inline-start" />
                  {t('stop')}
               </Button>
               <Button type="button" variant="outline" size="sm" disabled={busy || quests.length === 0} onClick={onPatch}>
                  <Wrench data-icon="inline-start" />
                  {t('menu.patch')}
               </Button>
               <Button type="button" variant="outline" size="sm" disabled={busy || quests.length === 0} onClick={() => onOpen('unmod')}>
                  {t('menu.unmod')}
               </Button>
               <Button type="button" variant="outline" size="sm" disabled={busy || ready.length === 0} onClick={() => onOpen('matchMods')}>
                  {t('menu.matchMods')}
               </Button>
               <Button type="button" variant="outline" size="sm" disabled={busy || ready.length === 0} onClick={() => onOpen('pushMaps')}>
                  {t('menu.pushMaps')}
               </Button>
               <Button type="button" variant="outline" size="sm" onClick={() => onOpen('addTag')}>
                  {t('menu.addTag')}
               </Button>
               <Button type="button" variant="outline" size="sm" onClick={() => onOpen('removeTag')}>
                  {t('menu.removeTag')}
               </Button>
            </div>
         ) : null}

         {picked.length > 1 ? (
            <section className="overflow-hidden rounded-lg border">
               <div className="bg-muted/20 flex min-h-10 items-center gap-2 border-b px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{t('selection.devices')}</span>
                  <Button type="button" variant="ghost" size="xs" className="ml-auto" onClick={selection.clear}>
                     {t('clearSelection')}
                  </Button>
               </div>
               <ul className="max-h-56 overflow-y-auto">
                  {picked.slice(0, listLimit).map((row) => (
                     <li key={row.id} className="flex min-h-10 items-center gap-2 border-b px-3 py-1 text-sm last:border-b-0">
                        <span className="min-w-0 flex-1 truncate">{row.name}</span>
                        {row.status !== 'ready' ? <Badge variant="secondary">{t(`mapLegend.${row.status}`)}</Badge> : null}
                        <Button
                           type="button"
                           variant="ghost"
                           size="icon-xs"
                           aria-label={t('selection.remove', { name: row.name })}
                           onClick={() => selection.toggle(row.id)}
                        >
                           <X />
                        </Button>
                     </li>
                  ))}
                  {picked.length > listLimit ? (
                     <li className="text-muted-foreground px-3 py-2 text-xs">{t('selection.more', { count: picked.length - listLimit })}</li>
                  ) : null}
               </ul>
            </section>
         ) : null}
      </div>
   );
}
