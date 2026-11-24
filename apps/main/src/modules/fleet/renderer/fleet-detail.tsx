import { Monitor } from 'lucide-react';
import { useTranslations } from 'use-intl';

import { QuestIcon } from '@/components/headset-icons';
import { Badge } from '@/components/ui/badge';

import type { FleetRow } from '@/modules/fleet/rows';

// what a single device is: shown at the top of the pane, with no actions of its own
export function FleetDevice({ row }: { row: FleetRow }) {
   const t = useTranslations('fleet');
   const targets = useTranslations('targets');
   const facts: [string, string][] = [
      [t('columns.kind'), t(`kind.${row.kind}`)],
      [
         t('columns.connection'),
         row.via
            ? targets('via', { name: t(`connection.${row.connection ?? 'remote'}`), host: row.via })
            : row.connection
              ? t(`connection.${row.connection}`)
              : '-'
      ],
      [t('columns.version'), row.gameVersions.join(', ') || '-'],
      ...(row.modded === null ? [] : [[t('columns.modded'), t(row.modded ? 'modded.yes' : 'modded.no')] as [string, string]])
   ];

   return (
      <div className="flex min-w-0 flex-col gap-4">
         <div className="flex min-w-0 items-center gap-3">
            {row.kind === 'quest' ? <QuestIcon className="size-6 shrink-0" /> : <Monitor className="size-6 shrink-0" />}
            <h3 className="min-w-0 truncate text-lg leading-tight font-semibold">{row.name}</h3>
            {row.status !== 'ready' ? (
               <Badge variant={row.status === 'unpaired' ? 'secondary' : 'destructive'}>{targets(`status.${row.status}`)}</Badge>
            ) : null}
         </div>

         <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
            {facts.map(([label, value]) => (
               <div key={label} className="contents">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 truncate">{value}</dd>
               </div>
            ))}
            <dt className="text-muted-foreground">{t('columns.tags')}</dt>
            <dd className="flex min-w-0 flex-wrap gap-1.5">
               {row.tags.length > 0 ? (
                  row.tags.map((tag) => (
                     <Badge key={tag} variant="outline">
                        {tag}
                     </Badge>
                  ))
               ) : (
                  <span>-</span>
               )}
            </dd>
         </dl>
      </div>
   );
}
