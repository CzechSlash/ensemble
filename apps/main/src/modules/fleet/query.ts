import { emptyFacetValue, facetNames, noFacets, type FacetName, type FacetSelection } from '@/modules/fleet/facets';

// the search box carries the filters, Tailscale-style: `station:"Station 1" tag:Public,Tourney status:ready free text`
// different keys combine with AND, repeated or comma-separated values for one key with OR
const keyToFacet: Record<string, FacetName> = {
   station: 'station',
   tag: 'tag',
   version: 'version',
   status: 'status',
   type: 'kind',
   kind: 'kind'
};
const facetToKey: Record<FacetName, string> = { station: 'station', tag: 'tag', version: 'version', status: 'status', kind: 'type' };
const noneWord = 'none';
const tokenPattern = /([a-z]+):("[^"]*"|[^\s]*)/gi;

export type FleetQuery = { text: string; facets: FacetSelection };

function unquote(value: string) {
   return value.startsWith('"') && value.endsWith('"') && value.length >= 2 ? value.slice(1, -1) : value;
}

export function parseFleetQuery(input: string): FleetQuery {
   const chosen: Record<FacetName, Set<string>> = { station: new Set(), tag: new Set(), version: new Set(), status: new Set(), kind: new Set() };
   const text = input
      .replace(tokenPattern, (whole, key: string, raw: string) => {
         const facet = keyToFacet[key.toLowerCase()];
         if (!facet || raw === '') return whole;
         const values = raw.startsWith('"') ? [unquote(raw)] : raw.split(',').filter(Boolean);
         for (const value of values) chosen[facet].add(value.toLowerCase() === noneWord ? emptyFacetValue : value);
         return '';
      })
      .replace(/\s+/g, ' ')
      .trim();
   return { text, facets: { ...noFacets, ...chosen } };
}

function formatValue(value: string) {
   if (value === emptyFacetValue) return noneWord;
   return /[\s,"]/.test(value) ? `"${value.replaceAll('"', '')}"` : value;
}

export function formatFleetQuery(query: FleetQuery) {
   const tokens = facetNames.flatMap((facet) => [...query.facets[facet]].map((value) => `${facetToKey[facet]}:${formatValue(value)}`));
   return [...tokens, query.text].filter(Boolean).join(' ');
}

// clicking a value in the tree scopes to just that value; clicking the only chosen value clears it
export function scopeFleetQuery(input: string, facet: FacetName, value: string | null) {
   const query = parseFleetQuery(input);
   const current = query.facets[facet];
   const only = value !== null && current.size === 1 && current.has(value);
   const next = value === null || only ? new Set<string>() : new Set([value]);
   return formatFleetQuery({ ...query, facets: { ...query.facets, [facet]: next } });
}
