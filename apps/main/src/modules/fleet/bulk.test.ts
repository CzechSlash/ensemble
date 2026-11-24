import { expect, test } from 'vite-plus/test';

import { runBulk, waitForOperation, type BulkOutcome } from '@/modules/fleet/bulk';

test('runs every target within the limit and keeps going after a failure', async () => {
   let active = 0;
   let peak = 0;
   const outcomes = new Map<string, BulkOutcome | { status: 'running' }>();
   await runBulk(
      ['a', 'b', 'c', 'd', 'e'],
      async (id) => {
         active++;
         peak = Math.max(peak, active);
         await new Promise((resolve) => setTimeout(resolve, 5));
         active--;
         if (id === 'c') throw new Error('offline');
      },
      (id, outcome) => outcomes.set(id, outcome),
      2
   );

   expect(peak).toBe(2);
   expect(outcomes.get('c')).toEqual({ status: 'failed', message: 'offline' });
   expect([...outcomes.values()].filter((outcome) => outcome.status === 'ok')).toHaveLength(4);
});

test('waits for an operation to finish and reports its failure', async () => {
   const statuses = ['running', 'running', 'completed'];
   await waitForOperation(async () => [{ id: 'op', status: statuses.shift() ?? 'completed' }], 'op', { pollMs: 1 });

   await expect(
      waitForOperation(async () => [{ id: 'op', status: 'failed', error: { message: 'no space left' } }], 'op', { pollMs: 1 })
   ).rejects.toThrow('no space left');
   await expect(waitForOperation(async () => [{ id: 'op', status: 'running' }], 'op', { pollMs: 1, timeoutMs: 10 })).rejects.toThrow('timed out');
});
