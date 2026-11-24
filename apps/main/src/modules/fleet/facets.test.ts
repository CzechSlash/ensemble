import { expect, test } from 'vite-plus/test';

import { applyFacets, facetCounts, noFacets, toggleFacet } from '@/modules/fleet/facets';
import type { FleetRow } from '@/modules/fleet/rows';

const row = (id: string, extra: Partial<FleetRow>): FleetRow => ({
   id,
   name: id,
   kind: 'quest',
   status: 'ready',
   connection: 'wifi',
   via: null,
   gameVersions: ['1.40.0'],
   modded: null,
   tags: [],
   ...extra
});

const rows = [
   row('a', { via: 'Station 1', tags: ['Public'] }),
   row('b', { via: 'Station 1', tags: ['Tourney'], gameVersions: ['1.29.1'] }),
   row('c', { via: 'Station 2', tags: ['Tourney'], status: 'disconnected' }),
   row('Station 1', { kind: 'pc' })
];

test('narrows rows by facet and counts the other values against it', () => {
   const station = toggleFacet(noFacets, 'station', 'Station 1');
   expect(applyFacets(rows, station).map((r) => r.id)).toEqual(['a', 'b', 'Station 1']);
   expect(facetCounts(rows, station, 'tag')).toEqual([
      ['Public', 1],
      ['Tourney', 1],
      ['', 1]
   ]);
   expect(facetCounts(rows, station, 'station')).toEqual([
      ['Station 1', 3],
      ['Station 2', 1]
   ]);
});

test('combines facets and toggles a value off again', () => {
   const picked = toggleFacet(toggleFacet(noFacets, 'tag', 'Tourney'), 'status', 'ready');
   expect(applyFacets(rows, picked).map((r) => r.id)).toEqual(['b']);
   expect(applyFacets(rows, toggleFacet(picked, 'tag', 'Tourney')).map((r) => r.id)).toEqual(['a', 'b', 'Station 1']);
});
