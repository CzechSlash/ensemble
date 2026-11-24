import { useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';
import { useTranslations } from 'use-intl';

import { CollectionToolbar } from '@/components/collection/collection-toolbar';
import { useCollectionSelection } from '@/components/collection/selection';
import { ConfirmDialog } from '@/components/dialog/confirm-dialog';
import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/state/state-panel';

import { applyFacets } from '@/modules/fleet/facets';
import { parseFleetQuery, scopeFleetQuery } from '@/modules/fleet/query';
import { FleetViewsMenu, type FleetDialogKind } from '@/modules/fleet/renderer/fleet-actions';
import { FleetDeviceList } from '@/modules/fleet/renderer/fleet-device-list';
import { FleetReferenceDialog, FleetSaveViewDialog, FleetTagDialog } from '@/modules/fleet/renderer/fleet-dialogs';
import { FleetFilters } from '@/modules/fleet/renderer/fleet-filters';
import { FleetResults } from '@/modules/fleet/renderer/fleet-results';
import { FleetPane } from '@/modules/fleet/renderer/fleet-selection-panel';
import { useBulkActions } from '@/modules/fleet/renderer/use-bulk-actions';
import { useFleet } from '@/modules/fleet/renderer/use-fleet';
import { useSavedViews } from '@/modules/fleet/renderer/use-saved-views';
import { matchesFleetQuery } from '@/modules/fleet/rows';
import { allTags } from '@/modules/fleet/tags';
import { PageBody } from '@/renderer/shell/page-body';

export const Route = createFileRoute('/fleet')({
   component: FleetRoute
});

const tabBodyClassName = 'flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pt-4 pb-6 text-sm sm:px-8';

function FleetRoute() {
   const t = useTranslations('fleet');
   const { rows, installs, tags, updateTags, status, reload } = useFleet();
   const bulk = useBulkActions(installs);
   const saved = useSavedViews();
   const selection = useCollectionSelection('fleet');
   const [query, setQuery] = useState('');
   const [activeId, setActiveId] = useState<string | null>(null);
   const [dialog, setDialog] = useState<FleetDialogKind | null>(null);

   // actions only ever reach devices that are visible, so a filter can't hide a device that is still selected
   const parsed = parseFleetQuery(query);
   const searched = rows.filter((row) => matchesFleetQuery(row, parsed.text));
   const visible = applyFacets(searched, parsed.facets).toSorted((first, second) =>
      first.name.localeCompare(second.name, undefined, { numeric: true })
   );
   const picked = visible.filter((row) => selection.selected.has(row.id));
   const active = visible.find((row) => row.id === activeId) ?? null;
   // actions apply to the ticked devices, or to the opened device when nothing is ticked
   const targets = picked.length > 0 ? picked : active ? [active] : [];
   const targetIds = targets.map((row) => row.id);
   const readyIds = targets.filter((row) => row.status === 'ready').map((row) => row.id);
   const questIds = targets.filter((row) => row.status === 'ready' && row.kind === 'quest').map((row) => row.id);
   const references = rows.filter((row) => row.status === 'ready' && row.gameVersions.length > 0);
   const names = new Map(rows.map((row) => [row.id, row.name]));
   const results = bulk.results;
   const close = () => setDialog(null);
   const pane = (
      <FleetPane
         targets={targets}
         picked={picked}
         selection={selection}
         busy={bulk.busy}
         onLaunch={() => void bulk.run('launch', readyIds)}
         onStop={() => void bulk.run('stop', readyIds)}
         onPatch={() => void bulk.run('patch', questIds)}
         onOpen={setDialog}
      />
   );

   if (status === 'loading' || status === 'error' || rows.length === 0) {
      return (
         <PageBody className="gap-5">
            <h1 className="text-2xl font-semibold">{t('title')}</h1>
            {status === 'loading' ? <LoadingPanel /> : null}
            {status === 'error' ? <ErrorPanel message={t('loadError')} onRetry={reload} /> : null}
            {status === 'ready' ? <EmptyPanel description={t('empty')} /> : null}
         </PageBody>
      );
   }

   return (
      <>
         <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative flex shrink-0 flex-col gap-3 border-b px-4 pt-4 pb-3 sm:px-8">
               <div className="flex items-center gap-3">
                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                     <h1 className="min-w-0 truncate text-lg leading-tight font-semibold">{t('title')}</h1>
                     <span className="text-muted-foreground text-sm">{t('summary', { visible: visible.length, total: rows.length })}</span>
                  </div>
               </div>

               <FleetFilters
                  rows={searched}
                  selection={parsed.facets}
                  onScope={(facet, value) => setQuery((current) => scopeFleetQuery(current, facet, value))}
               />
            </div>

            <div className={tabBodyClassName}>
               <CollectionToolbar
                  filter={{ value: query, label: t('filter'), onChange: setQuery }}
                  rescan={{ label: t('refresh'), busy: false, onClick: () => void reload() }}
                  menu={<FleetViewsMenu views={saved.views} currentQuery={query} onApply={setQuery} onOpen={setDialog} onRemove={saved.remove} />}
               />

               {results ? (
                  <FleetResults
                     action={results.action}
                     outcomes={results.outcomes}
                     names={names}
                     busy={bulk.busy}
                     failedCount={bulk.failedIds.length}
                     onRetry={() => void bulk.run(results.action, bulk.failedIds, bulk.referenceId, bulk.version)}
                     onDismiss={bulk.dismiss}
                  />
               ) : null}

               {visible.length === 0 ? (
                  <EmptyPanel description={t('noMatches')} />
               ) : (
                  <FleetDeviceList rows={visible} selection={selection} activeId={activeId} onActivate={setActiveId} pane={pane} />
               )}
            </div>
         </div>

         {dialog === 'matchMods' || dialog === 'pushMaps' ? (
            <FleetReferenceDialog
               kind={dialog === 'matchMods' ? 'mods' : 'maps'}
               count={readyIds.length}
               references={references}
               onOpenChange={close}
               onStart={(referenceId) => {
                  close();
                  void bulk.run(dialog === 'matchMods' ? 'mods' : 'maps', readyIds, referenceId);
               }}
            />
         ) : null}
         {dialog === 'addTag' || dialog === 'removeTag' ? (
            <FleetTagDialog
               mode={dialog === 'addTag' ? 'add' : 'remove'}
               count={targetIds.length}
               existing={allTags(tags)}
               onOpenChange={close}
               onApply={(tag) => {
                  close();
                  void updateTags({ targetIds: targetIds, add: dialog === 'addTag' ? [tag] : [], remove: dialog === 'removeTag' ? [tag] : [] });
               }}
            />
         ) : null}
         {dialog === 'saveView' ? (
            <FleetSaveViewDialog
               onOpenChange={close}
               onSave={(name) => {
                  saved.save(name, query);
                  close();
               }}
            />
         ) : null}
         <ConfirmDialog
            open={dialog === 'unmod'}
            title={t('dialog.unmod.title')}
            description={t('dialog.unmod.description', { count: questIds.length })}
            confirmLabel={t('dialog.unmod.confirm')}
            onOpenChange={(open) => {
               if (!open) close();
            }}
            onConfirm={() => {
               close();
               void bulk.run('unmod', questIds);
            }}
         />
      </>
   );
}
