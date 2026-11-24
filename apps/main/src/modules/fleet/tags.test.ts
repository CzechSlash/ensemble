import { expect, test } from 'vite-plus/test';

import { allTags, applyTagUpdate, maxTagsPerDevice } from '@/modules/fleet/tags';

test('adds tags once, ignoring case and spacing', () => {
   const tags = applyTagUpdate({}, { targetIds: ['a', 'b'], add: ['Public', ' public ', 'Tourney  A'], remove: [] });
   expect(tags).toEqual({ a: ['Public', 'Tourney A'], b: ['Public', 'Tourney A'] });
});

test('removes tags and drops devices left with none', () => {
   const before = { a: ['Public', 'Spare'], b: ['Spare'] };
   expect(applyTagUpdate(before, { targetIds: ['a', 'b'], add: [], remove: ['spare'] })).toEqual({ a: ['Public'] });
});

test('caps the tags per device and lists each tag once', () => {
   const add = Array.from({ length: maxTagsPerDevice + 3 }, (_, index) => `t${index}`);
   expect(applyTagUpdate({}, { targetIds: ['a'], add, remove: [] }).a).toHaveLength(maxTagsPerDevice);
   expect(allTags({ a: ['Beta', 'alpha'], b: ['ALPHA'] })).toEqual(['alpha', 'Beta']);
});
