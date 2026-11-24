import { readJsonFileOrDefault, writeJsonFileAtomic } from '@/lib/filesystem/json';
import { createSerialQueue } from '@/lib/state/machine';
import { applyTagUpdate, fleetTagsSchema, maxTaggedDevices, type FleetTags, type UpdateTagsRequest } from '@/modules/fleet/tags';

import { join } from 'node:path';

export type FleetTagStore = ReturnType<typeof createFleetTags>;

// tags live on the control PC only, so stock Encore stations and the Quest companion never see them
export function createFleetTags(options: { dataPath: string }) {
   const storePath = join(options.dataPath, 'fleet-tags.json');
   const writeQueue = createSerialQueue();
   const loaded = readJsonFileOrDefault(storePath, fleetTagsSchema, { defaultValue: {} });

   async function get(): Promise<FleetTags> {
      await writeQueue.idle();
      return current();
   }

   let cache: FleetTags | null = null;
   async function current() {
      cache ??= await loaded;
      return cache;
   }

   async function update(request: UpdateTagsRequest) {
      return writeQueue.run(async () => {
         const next = applyTagUpdate(await current(), request);
         const entries = Object.entries(next).slice(-maxTaggedDevices);
         cache = Object.fromEntries(entries);
         await writeJsonFileAtomic(storePath, cache, fleetTagsSchema, { root: options.dataPath });
         return cache;
      });
   }

   return { get, update };
}
