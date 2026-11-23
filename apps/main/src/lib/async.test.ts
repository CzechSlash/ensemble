import { expect, test } from 'vite-plus/test';

import { mapWithConcurrency } from '@/lib/async';

import { setTimeout as delay } from 'node:timers/promises';

test('keeps input order and never runs more than the limit at once', async () => {
   let active = 0;
   let peak = 0;
   const results = await mapWithConcurrency([5, 1, 4, 2, 3, 6, 7], 3, async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await delay(value);
      active -= 1;
      return value * 2;
   });

   expect(results).toEqual([10, 2, 8, 4, 6, 12, 14]);
   expect(peak).toBe(3);
});

test('handles an empty list', async () => {
   expect(await mapWithConcurrency([], 4, async (value: number) => value)).toEqual([]);
});
