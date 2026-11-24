import { afterEach, expect, test } from 'vite-plus/test';

import { createFleetTags } from '@/modules/fleet/main/fleet-tags';

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const folders: string[] = [];
afterEach(async () => {
   await Promise.all(folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })));
});

test('tags persist across restarts', async () => {
   const dataPath = await mkdtemp(join(tmpdir(), 'ensemble-tags-'));
   folders.push(dataPath);

   await createFleetTags({ dataPath }).update({ targetIds: ['quest:A', 'quest:B'], add: ['Public'], remove: [] });
   const restarted = createFleetTags({ dataPath });
   expect(await restarted.get()).toEqual({ 'quest:A': ['Public'], 'quest:B': ['Public'] });

   await restarted.update({ targetIds: ['quest:A'], add: ['Tourney'], remove: ['public'] });
   expect(await createFleetTags({ dataPath }).get()).toEqual({ 'quest:A': ['Tourney'], 'quest:B': ['Public'] });
});
