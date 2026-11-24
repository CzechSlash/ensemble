import { ListChecks } from 'lucide-react';
import { useTranslations } from 'use-intl';

import type { CollectionSelection } from '@/components/collection/selection';
import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuCheckboxItem,
   DropdownMenuContent,
   DropdownMenuSub,
   DropdownMenuSubContent,
   DropdownMenuSubTrigger,
   DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

import { emptyFacetValue, facetValues, type FacetName } from '@/modules/fleet/facets';
import type { FleetRow } from '@/modules/fleet/rows';

const groupings: FacetName[] = ['station', 'tag', 'version', 'status', 'kind'];

// picking a whole group is an occasional move, so it lives in a menu that opens on demand rather than taking up the pane
export function FleetGroupMenu({ rows, selection }: { rows: readonly FleetRow[]; selection: CollectionSelection }) {
   const t = useTranslations('fleet');

   const groupsOf = (facet: FacetName) => {
      const groups = new Map<string, string[]>();
      for (const row of rows) for (const value of new Set(facetValues(row, facet))) groups.set(value, [...(groups.get(value) ?? []), row.id]);
      return [...groups].toSorted(
         ([first], [second]) =>
            Number(first === emptyFacetValue) - Number(second === emptyFacetValue) || first.localeCompare(second, undefined, { numeric: true })
      );
   };
   const labelFor = (facet: FacetName, value: string) => {
      if (value === emptyFacetValue) return t(`facets.none.${facet}`);
      if (facet === 'kind') return t(`kind.${value as 'this-pc' | 'pc' | 'quest'}`);
      if (facet === 'status') return t(`mapLegend.${value as 'ready' | 'unpaired' | 'disconnected' | 'incompatible'}`);
      return value;
   };

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="xs" className="ml-auto">
               <ListChecks />
               {t('selection.byGroup')}
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
            {groupings.map((facet) => {
               const groups = groupsOf(facet);
               if (groups.length < 2) return null;
               return (
                  <DropdownMenuSub key={facet}>
                     <DropdownMenuSubTrigger>{t(`facets.${facet}`)}</DropdownMenuSubTrigger>
                     <DropdownMenuSubContent>
                        <ScrollArea className="max-h-72 overflow-y-auto">
                           {groups.map(([value, ids]) => {
                              const picked = ids.filter((id) => selection.selected.has(id)).length;
                              return (
                                 <DropdownMenuCheckboxItem
                                    key={value}
                                    checked={picked === ids.length}
                                    onSelect={(event) => {
                                       event.preventDefault();
                                       selection.toggleAll(ids);
                                    }}
                                 >
                                    <span className="min-w-0 flex-1 truncate">{labelFor(facet, value)}</span>
                                    <span className="text-muted-foreground ml-3 text-xs tabular-nums">
                                       {picked > 0 && picked < ids.length ? `${picked} / ${ids.length}` : ids.length}
                                    </span>
                                 </DropdownMenuCheckboxItem>
                              );
                           })}
                        </ScrollArea>
                     </DropdownMenuSubContent>
                  </DropdownMenuSub>
               );
            })}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
