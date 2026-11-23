import { Result, type Err } from 'better-result';

import { setTimeout as delay } from 'node:timers/promises';

export async function abortableSleep(durationMs: number, signal?: AbortSignal) {
   if (durationMs <= 0 || signal?.aborted) return;

   await Result.tryPromise(() => delay(durationMs, undefined, { signal }));
}

export function abortedBy<Failure>(signal: AbortSignal | undefined, failure: () => Failure) {
   let release = () => {};
   const result = new Promise<Err<never, Failure>>((resolve) => {
      if (!signal) return;
      const cancel = () => resolve(Result.err(failure()));
      if (signal.aborted) return cancel();
      signal.addEventListener('abort', cancel, { once: true });
      release = () => signal.removeEventListener('abort', cancel);
   });
   return { result, release: () => release() };
}

// results keep the input order, and `limit` bounds how many `run` calls are in flight at once
export async function mapWithConcurrency<Item, Output>(items: readonly Item[], limit: number, run: (item: Item) => Promise<Output>) {
   const results: Output[] = Array.from({ length: items.length });
   let next = 0;
   const worker = async () => {
      for (let index = next++; index < items.length; index = next++) results[index] = await run(items[index] as Item);
   };
   await Promise.all(Array.from({ length: Math.min(Math.max(1, limit), items.length) }, worker));
   return results;
}
