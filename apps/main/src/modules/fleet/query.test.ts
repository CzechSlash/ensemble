import { expect, test } from 'vite-plus/test';

import { formatFleetQuery, parseFleetQuery, scopeFleetQuery } from '@/modules/fleet/query';

test('parses key:value terms, quoted values, comma OR and leftover text', () => {
   const query = parseFleetQuery('quest 3 station:"Station 1" tag:Public,Tourney type:quest tag:none');
   expect(query.text).toBe('quest 3');
   expect([...query.facets.station]).toEqual(['Station 1']);
   expect([...query.facets.tag]).toEqual(['Public', 'Tourney', '']);
   expect([...query.facets.kind]).toEqual(['quest']);
});

test('leaves unknown keys as plain text and round-trips', () => {
   expect(parseFleetQuery('foo:bar').text).toBe('foo:bar');
   const text = 'station:"Station 1" tag:Public tag:none lobby';
   expect(formatFleetQuery(parseFleetQuery(text))).toBe(text);
});

test('scoping replaces a facet value and clears it on a second click', () => {
   const scoped = scopeFleetQuery('lobby tag:Public', 'tag', 'Tourney');
   expect(scoped).toBe('tag:Tourney lobby');
   expect(scopeFleetQuery(scoped, 'tag', 'Tourney')).toBe('lobby');
   expect(scopeFleetQuery(scoped, 'tag', null)).toBe('lobby');
});
