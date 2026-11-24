import { Bookmark } from 'lucide-react';
import { useTranslations } from 'use-intl';

import { Button } from '@/components/ui/button';
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import type { SavedView } from '@/modules/fleet/renderer/use-saved-views';

export type FleetDialogKind = 'matchMods' | 'pushMaps' | 'addTag' | 'removeTag' | 'unmod' | 'saveView';

export function FleetViewsMenu({
   views,
   currentQuery,
   onApply,
   onOpen,
   onRemove
}: {
   views: readonly SavedView[];
   currentQuery: string;
   onApply: (query: string) => void;
   onOpen: (kind: FleetDialogKind) => void;
   onRemove: (name: string) => void;
}) {
   const t = useTranslations('fleet');
   const current = views.find((view) => view.query === currentQuery);

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label={t('views.title')}>
               <Bookmark />
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('views.title')}</DropdownMenuLabel>
            {views.length === 0 ? <DropdownMenuItem disabled>{t('views.empty')}</DropdownMenuItem> : null}
            {views.map((view) => (
               <DropdownMenuItem key={view.name} onSelect={() => onApply(view.query)}>
                  {view.name}
               </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={currentQuery.trim() === ''} onSelect={() => onOpen('saveView')}>
               {t('views.saveCurrent')}
            </DropdownMenuItem>
            {current ? (
               <DropdownMenuItem onSelect={() => onRemove(current.name)}>{t('views.delete', { name: current.name })}</DropdownMenuItem>
            ) : null}
         </DropdownMenuContent>
      </DropdownMenu>
   );
}
