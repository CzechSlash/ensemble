import { useTranslations } from 'use-intl';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { emptyFacetValue, facetCounts, type FacetName, type FacetSelection } from '@/modules/fleet/facets';
import type { FleetRow } from '@/modules/fleet/rows';

const facets: FacetName[] = ['station', 'tag', 'version', 'status', 'kind'];
const allValue = '__all__';
const noneValue = '__none__';
// Radix selects cannot hold an empty string, so the empty bucket travels under a sentinel
const toItem = (value: string) => (value === emptyFacetValue ? noneValue : value);
const fromItem = (value: string) => (value === noneValue ? emptyFacetValue : value);

// one compact filter select per facet, as on the install pages, with live counts that respect the other filters
export function FleetFilters({
   rows,
   selection,
   onScope
}: {
   rows: readonly FleetRow[];
   selection: FacetSelection;
   onScope: (facet: FacetName, value: string | null) => void;
}) {
   const t = useTranslations('fleet');
   const targets = useTranslations('targets');

   const labelFor = (facet: FacetName, value: string) => {
      if (value === emptyFacetValue) return t(`facets.none.${facet}`);
      if (facet === 'kind') return t(`kind.${value as 'this-pc' | 'pc' | 'quest'}`);
      if (facet === 'status') return targets(`status.${value as 'ready' | 'unpaired' | 'disconnected' | 'incompatible'}`);
      return value;
   };

   return (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
         {facets.map((facet) => {
            const counts = facetCounts(rows, selection, facet);
            if (counts.length < 2 && selection[facet].size === 0) return null;
            const chosen = [...selection[facet]];
            const value = chosen.length === 0 ? allValue : toItem(chosen[0] ?? emptyFacetValue);

            return (
               <Select
                  key={facet}
                  value={chosen.length > 1 ? '' : value}
                  onValueChange={(next) => onScope(facet, next === allValue ? null : fromItem(next))}
               >
                  <SelectTrigger variant="filter" size="compact" aria-label={t(`facets.${facet}`)}>
                     <SelectValue placeholder={t('filterMultiple', { name: t(`facets.${facet}`) })}>
                        {chosen.length === 0 ? t(`facets.all.${facet}`) : `${t(`facets.${facet}`)}: ${labelFor(facet, fromItem(value))}`}
                     </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value={allValue}>{t(`facets.all.${facet}`)}</SelectItem>
                     {counts.map(([entry, count]) => (
                        <SelectItem key={entry} value={toItem(entry)}>
                           {labelFor(facet, entry)}
                           <span className="text-muted-foreground ml-2 text-xs tabular-nums">{count}</span>
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            );
         })}
      </div>
   );
}
