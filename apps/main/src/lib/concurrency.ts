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
