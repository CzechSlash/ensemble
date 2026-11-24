import type { FleetRow } from '@/modules/fleet/rows';

export const facetNames = ['station', 'tag', 'version', 'status', 'kind'] as const;
export type FacetName = (typeof facetNames)[number];
export type FacetSelection = Readonly<Record<FacetName, ReadonlySet<string>>>;

export const emptyFacetValue = '';
export const noFacets: FacetSelection = { station: new Set(), tag: new Set(), version: new Set(), status: new Set(), kind: new Set() };

// a headset reached through a station belongs to that station; everything else is its own station
export function facetValues(row: FleetRow, facet: FacetName): string[] {
   switch (facet) {
      case 'station':
         return [row.via ?? (row.kind === 'quest' ? emptyFacetValue : row.name)];
      case 'tag':
         return row.tags.length > 0 ? row.tags : [emptyFacetValue];
      case 'version':
         return row.gameVersions.length > 0 ? row.gameVersions : [emptyFacetValue];
      case 'status':
         return [row.status];
      case 'kind':
         return [row.kind];
   }
}

function matches(row: FleetRow, selection: FacetSelection, skip?: FacetName) {
   return facetNames.every((facet) => {
      const chosen = selection[facet];
      return facet === skip || chosen.size === 0 || facetValues(row, facet).some((value) => chosen.has(value));
   });
}

export function applyFacets(rows: readonly FleetRow[], selection: FacetSelection) {
   return rows.filter((row) => matches(row, selection));
}

// counts ignore the facet being counted, so its own values stay clickable while others narrow it
export function facetCounts(rows: readonly FleetRow[], selection: FacetSelection, facet: FacetName) {
   const counts = new Map<string, number>();
   for (const row of rows) {
      if (!matches(row, selection, facet)) continue;
      for (const value of new Set(facetValues(row, facet))) counts.set(value, (counts.get(value) ?? 0) + 1);
   }
   for (const value of selection[facet]) if (!counts.has(value)) counts.set(value, 0);
   // the empty bucket (no tag, direct connection) goes last
   return [...counts].toSorted(
      ([first, a], [second, b]) =>
         Number(first === emptyFacetValue) - Number(second === emptyFacetValue) || b - a || first.localeCompare(second, undefined, { numeric: true })
   );
}

export function toggleFacet(selection: FacetSelection, facet: FacetName, value: string): FacetSelection {
   const next = new Set(selection[facet]);
   if (!next.delete(value)) next.add(value);
   return { ...selection, [facet]: next };
}

export function hasFacets(selection: FacetSelection) {
   return facetNames.some((facet) => selection[facet].size > 0);
}
