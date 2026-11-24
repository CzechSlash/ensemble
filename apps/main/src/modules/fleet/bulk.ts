import { mapWithConcurrency } from '@/lib/concurrency';
import type { TargetId } from '@/modules/targets/contract';

export const bulkConcurrency = 6;

export type BulkOutcome = { status: 'ok' } | { status: 'failed'; message: string };
export type BulkResults = ReadonlyMap<TargetId, BulkOutcome | { status: 'running' }>;

// runs `act` for every target with bounded concurrency; one failure never stops the rest
export async function runBulk(
   targetIds: readonly TargetId[],
   act: (targetId: TargetId) => Promise<void>,
   onUpdate: (targetId: TargetId, outcome: BulkOutcome | { status: 'running' }) => void,
   limit = bulkConcurrency
) {
   await mapWithConcurrency(targetIds, limit, async (targetId) => {
      onUpdate(targetId, { status: 'running' });
      try {
         await act(targetId);
         onUpdate(targetId, { status: 'ok' });
      } catch (error) {
         onUpdate(targetId, { status: 'failed', message: error instanceof Error ? error.message : String(error) });
      }
   });
}

export const operationPollMs = 1_500;
export const operationTimeoutMs = 30 * 60_000;

type PolledOperation = { id: string; status: string; error?: { message: string }; result?: unknown };

// patching and mod installs outlive the call that starts them, so bulk actions poll the target's operation list until it finishes
export async function waitForOperation(
   list: () => Promise<readonly PolledOperation[]>,
   operationId: string,
   options: { pollMs?: number; timeoutMs?: number } = {}
) {
   const pollMs = options.pollMs ?? operationPollMs;
   const deadline = Date.now() + (options.timeoutMs ?? operationTimeoutMs);
   let missingPolls = 0;
   while (Date.now() < deadline) {
      const operation = (await list()).find((candidate) => candidate.id === operationId);
      if (operation?.status === 'completed') return operation;
      if (operation?.status === 'failed' || operation?.status === 'cancelled') {
         throw new Error(operation.error?.message ?? operation.status);
      }
      if (!operation && ++missingPolls > 3) throw new Error('operation disappeared');
      await new Promise((resolve) => setTimeout(resolve, pollMs));
   }
   throw new Error('timed out');
}
