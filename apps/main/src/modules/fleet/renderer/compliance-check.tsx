import { useState } from 'react';

import { CircleCheck, CircleX, Copy, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'use-intl';

import { EmptyPanel, ErrorPanel, LoadingPanel } from '@/components/state/state-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { describeIssue, formatReport } from '@/modules/fleet/compliance';
import { useCompliance } from '@/modules/fleet/renderer/use-compliance';
import { useFleet } from '@/modules/fleet/renderer/use-fleet';
import { allTags } from '@/modules/fleet/tags';
import { readStorageValue, writeStorageValue } from '@/renderer/storage';

const allScope = '__all__';
const scopeKey = 'ensemble.compliance.scope';
const referenceKey = 'ensemble.compliance.reference';

// checks that every station runs the same Beat Saber version and mods as one reference station
export function ComplianceCheck() {
   const t = useTranslations('compliance');
   const fleet = useTranslations('fleet');
   const { rows, installs, tags, status, reload } = useFleet();
   const check = useCompliance(installs);
   const [scope, setScope] = useState(() => readStorageValue(scopeKey).unwrapOr(null) ?? allScope);
   const [remembered, setRemembered] = useState(() => readStorageValue(referenceKey).unwrapOr(null));
   const [copied, setCopied] = useState(false);

   const candidates = rows
      .filter((row) => row.status === 'ready' && (installs.get(row.id)?.length ?? 0) > 0)
      .toSorted((first, second) => first.name.localeCompare(second.name, undefined, { numeric: true }));
   const inScope = candidates.filter((row) => scope === allScope || row.tags.includes(scope));
   const referenceId = candidates.some((row) => row.id === remembered) ? remembered : null;
   const names = new Map(rows.map((row) => [row.id, row.name]));
   const outcomes = [...check.results];
   const passed = outcomes.filter(([, result]) => result.status === 'pass').length;
   const failed = outcomes.filter(([, result]) => result.status === 'fail').length;
   const errored = outcomes.filter(([, result]) => result.status === 'error').length;

   if (status === 'loading') return <LoadingPanel />;
   if (status === 'error') return <ErrorPanel message={fleet('loadError')} onRetry={reload} />;

   const copyReport = async () => {
      const text = formatReport(check.results, names, names.get(check.referenceId ?? '') ?? '');
      try {
         await navigator.clipboard.writeText(text);
         setCopied(true);
         setTimeout(() => setCopied(false), 2_000);
      } catch {
         setCopied(false);
      }
   };

   return (
      <div className="flex min-h-0 flex-1 flex-col">
         <div className="flex shrink-0 flex-col gap-3 border-b px-4 pt-4 pb-4 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex min-w-0 flex-1 items-baseline gap-2">
                  <h1 className="min-w-0 truncate text-lg leading-tight font-semibold">{t('title')}</h1>
                  <span className="text-muted-foreground text-sm">{t('hint')}</span>
               </div>
               <Select
                  value={referenceId ?? ''}
                  onValueChange={(value) => {
                     setRemembered(value);
                     void writeStorageValue(referenceKey, value);
                  }}
               >
                  <SelectTrigger variant="filter" size="compact" aria-label={t('reference')}>
                     <SelectValue placeholder={t('referencePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                     {candidates.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                           {row.name}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
               <Select
                  value={scope}
                  onValueChange={(value) => {
                     setScope(value);
                     void writeStorageValue(scopeKey, value);
                  }}
               >
                  <SelectTrigger variant="filter" size="compact" aria-label={t('scope')}>
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value={allScope}>{t('scopeAll')}</SelectItem>
                     {allTags(tags).map((tag) => (
                        <SelectItem key={tag} value={tag}>
                           {tag}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <Button
                  type="button"
                  size="lg"
                  disabled={check.busy || referenceId === null || inScope.length === 0}
                  onClick={() => referenceId && void check.run(referenceId, [...new Set([referenceId, ...inScope.map((row) => row.id)])])}
               >
                  <ShieldCheck data-icon="inline-start" />
                  {t('run')}
               </Button>
               {outcomes.length > 0 ? (
                  <>
                     <span className="text-muted-foreground text-sm">{t('summary', { passed, failed, errored })}</span>
                     <span className="grow" />
                     <Button type="button" variant="outline" size="sm" disabled={check.busy} onClick={() => void copyReport()}>
                        <Copy data-icon="inline-start" />
                        {copied ? t('copied') : t('copy')}
                     </Button>
                     <Button type="button" variant="ghost" size="sm" disabled={check.busy} onClick={check.dismiss}>
                        {fleet('dismiss')}
                     </Button>
                  </>
               ) : null}
            </div>
         </div>

         <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-6 text-sm sm:px-8">
            {outcomes.length === 0 ? (
               <EmptyPanel description={candidates.length === 0 ? t('noDevices') : referenceId === null ? t('pickReference') : t('ready')} />
            ) : (
               <ul className="bg-card overflow-hidden rounded-lg border">
                  {outcomes.map(([id, result]) => (
                     <li key={id} className="flex flex-col gap-1 border-b px-3 py-2 last:border-b-0">
                        <div className="flex min-h-8 items-center gap-3">
                           {result.status === 'running' ? (
                              <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                           ) : result.status === 'pass' ? (
                              <CircleCheck className="text-primary size-4 shrink-0" />
                           ) : result.status === 'fail' ? (
                              <CircleX className="text-destructive size-4 shrink-0" />
                           ) : (
                              <TriangleAlert className="text-muted-foreground size-4 shrink-0" />
                           )}
                           <span className="min-w-0 flex-1 truncate font-medium">{names.get(id) ?? id}</span>
                           {id === check.referenceId ? <Badge variant="secondary">{t('referenceBadge')}</Badge> : null}
                           {result.status === 'error' ? (
                              <span className="text-muted-foreground min-w-0 truncate text-xs">{result.message}</span>
                           ) : null}
                        </div>
                        {result.status === 'fail' ? (
                           <ul className="text-muted-foreground flex flex-col gap-0.5 pb-1 pl-7 text-xs">
                              {result.issues.map((issue) => (
                                 <li key={describeIssue(issue)}>{describeIssue(issue)}</li>
                              ))}
                           </ul>
                        ) : null}
                     </li>
                  ))}
               </ul>
            )}
         </div>
      </div>
   );
}
