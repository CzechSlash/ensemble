import { z } from 'zod';

import type { TargetId } from '@/modules/targets/contract';

export const maxTaggedDevices = 1024;
export const maxTagsPerDevice = 8;
export const maxTagLength = 32;

export const tagSchema = z.string().trim().min(1).max(maxTagLength);
export const fleetTagsSchema = z.record(z.string().min(1), z.array(tagSchema).max(maxTagsPerDevice));
export const updateTagsRequestSchema = z.object({
   targetIds: z.array(z.string().min(1)).min(1).max(maxTaggedDevices),
   add: z.array(tagSchema).max(maxTagsPerDevice),
   remove: z.array(tagSchema).max(maxTagsPerDevice)
});

export type FleetTags = z.infer<typeof fleetTagsSchema>;
export type UpdateTagsRequest = z.infer<typeof updateTagsRequestSchema>;

export function normalizeTag(tag: string) {
   return tag.trim().replace(/\s+/g, ' ');
}

// tags match case-insensitively but keep the casing they were first written with
export function applyTagUpdate(
   tags: Readonly<FleetTags>,
   request: { targetIds: readonly TargetId[]; add: readonly string[]; remove: readonly string[] }
) {
   const next: FleetTags = { ...tags };
   const removed = new Set(request.remove.map((tag) => normalizeTag(tag).toLowerCase()));
   for (const id of request.targetIds) {
      const kept = (next[id] ?? []).filter((tag) => !removed.has(tag.toLowerCase()));
      const present = new Set(kept.map((tag) => tag.toLowerCase()));
      for (const tag of request.add.map(normalizeTag)) {
         if (tag && !present.has(tag.toLowerCase())) {
            present.add(tag.toLowerCase());
            kept.push(tag);
         }
      }
      if (kept.length === 0) delete next[id];
      else next[id] = kept.slice(0, maxTagsPerDevice);
   }
   return next;
}

export function allTags(tags: Readonly<FleetTags>) {
   const seen = new Map<string, string>();
   for (const list of Object.values(tags)) for (const tag of list) if (!seen.has(tag.toLowerCase())) seen.set(tag.toLowerCase(), tag);
   return [...seen.values()].toSorted((first, second) => first.localeCompare(second));
}
