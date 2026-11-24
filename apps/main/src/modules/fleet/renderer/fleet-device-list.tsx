import { Monitor } from 'lucide-react';
import { useTranslations } from 'use-intl';

import { selectionState, type CollectionSelection } from '@/components/collection/selection';
import { QuestIcon } from '@/components/headset-icons';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MasterDetail, MasterDetailPane, MasterDetailRow, VirtualMasterDetailList } from '@/components/ui/master-detail';

import { FleetGroupMenu } from '@/modules/fleet/renderer/fleet-group-menu';
import type { FleetRow } from '@/modules/fleet/rows';

export function connectionLabel(
   row: FleetRow,
   t: ReturnType<typeof useTranslations<'fleet'>>,
   targets: ReturnType<typeof useTranslations<'targets'>>
) {
   if (row.via) return targets('via', { name: t(`connection.${row.connection ?? 'remote'}`), host: row.via });
   return row.connection ? t(`connection.${row.connection}`) : '';
}

// the device list and its detail pane, laid out like the maps and mods lists
export function FleetDeviceList({
   rows,
   selection,
   activeId,
   onActivate,
   pane
}: {
   rows: readonly FleetRow[];
   selection: CollectionSelection;
   activeId: string | null;
   onActivate: (id: string | null) => void;
   pane: React.ReactNode;
}) {
   const t = useTranslations('fleet');
   const targets = useTranslations('targets');
   const ids = rows.map((row) => row.id);
   const selectedCount = ids.filter((id) => selection.selected.has(id)).length;

   return (
      <MasterDetail>
         <VirtualMasterDetailList
            items={[...rows]}
            getItemId={(row) => row.id}
            estimateSize={56}
            selectedId={activeId}
            onSelect={onActivate}
            aria-label={t('title')}
            header={
               <div className="bg-muted/20 text-muted-foreground sticky top-0 z-10 flex min-h-10 items-center gap-2 border-b px-3 py-2 text-xs backdrop-blur">
                  <Checkbox
                     aria-label={t('selectAll')}
                     checked={selectionState(selectedCount, ids.length)}
                     onCheckedChange={() => selection.toggleAll(ids)}
                  />
                  <span>{t('selectCount', { count: rows.length })}</span>
                  <FleetGroupMenu rows={rows} selection={selection} />
               </div>
            }
         >
            {(row) => (
               <MasterDetailRow id={row.id} aria-selected={row.id === activeId} className="min-h-14" onClick={() => onActivate(row.id)}>
                  <Checkbox
                     checked={selection.selected.has(row.id)}
                     aria-label={t('selectOne', { name: row.name })}
                     onClick={(event) => event.stopPropagation()}
                     onCheckedChange={() => selection.toggle(row.id)}
                  />
                  {row.kind === 'quest' ? <QuestIcon className="size-5 shrink-0" /> : <Monitor className="size-5 shrink-0" />}
                  <div className="min-w-0 flex-1 overflow-hidden">
                     <div className="flex min-w-0 items-center gap-1.5">
                        <p className="min-w-0 truncate font-medium">{row.name}</p>
                        {row.status !== 'ready' ? (
                           <Badge variant={row.status === 'unpaired' ? 'secondary' : 'destructive'}>{targets(`status.${row.status}`)}</Badge>
                        ) : null}
                     </div>
                     <p className="text-muted-foreground mt-1 truncate text-xs">
                        {[t(`kind.${row.kind}`), connectionLabel(row, t, targets), row.gameVersions.join(', ')].filter(Boolean).join(' · ')}
                     </p>
                  </div>
                  {row.tags.slice(0, 2).map((tag) => (
                     <Badge key={tag} variant="outline" className="hidden sm:inline-flex">
                        {tag}
                     </Badge>
                  ))}
               </MasterDetailRow>
            )}
         </VirtualMasterDetailList>

         <MasterDetailPane>{pane}</MasterDetailPane>
      </MasterDetail>
   );
}
