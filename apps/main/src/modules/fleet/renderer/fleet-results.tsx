import { CircleCheck, CircleX, Loader2 } from 'lucide-react';
import { useTranslations } from 'use-intl';

import { Button } from '@/components/ui/button';

import type { BulkResults } from '@/modules/fleet/bulk';
import type { BulkActionKind } from '@/modules/fleet/renderer/use-bulk-actions';

export function FleetResults({
   action,
   outcomes,
   names,
   busy,
   failedCount,
   onRetry,
   onDismiss
}: {
   action: BulkActionKind;
   outcomes: BulkResults;
   names: ReadonlyMap<string, string>;
   busy: boolean;
   failedCount: number;
   onRetry: () => void;
   onDismiss: () => void;
}) {
   const t = useTranslations('fleet');
   const succeeded = [...outcomes.values()].filter((outcome) => outcome.status === 'ok').length;

   return (
      <section className="bg-card flex max-h-56 shrink-0 flex-col overflow-hidden rounded-lg border text-sm">
         <div className="bg-muted/20 flex min-h-10 shrink-0 items-center gap-2 border-b px-3 py-2">
            <span className="font-medium">{t(`resultsTitle.${action}`)}</span>
            <span className="text-muted-foreground text-xs">{t('summaryResult', { ok: succeeded, failed: failedCount })}</span>
            <span className="grow" />
            {failedCount > 0 && !busy ? (
               <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                  {t('retryFailed')}
               </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onDismiss}>
               {t('dismiss')}
            </Button>
         </div>
         <ul className="min-h-0 overflow-y-auto">
            {[...outcomes].map(([id, outcome]) => (
               <li key={id} className="flex min-h-10 items-center gap-3 border-b px-3 py-2 last:border-b-0">
                  {outcome.status === 'running' ? (
                     <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                  ) : outcome.status === 'ok' ? (
                     <CircleCheck className="text-primary size-4 shrink-0" />
                  ) : (
                     <CircleX className="text-destructive size-4 shrink-0" />
                  )}
                  <span className="min-w-0 truncate font-medium">{names.get(id) ?? id}</span>
                  {outcome.status === 'failed' ? <span className="text-muted-foreground min-w-0 truncate text-xs">{outcome.message}</span> : null}
               </li>
            ))}
         </ul>
      </section>
   );
}
