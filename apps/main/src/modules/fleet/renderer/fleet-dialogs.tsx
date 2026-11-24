import { useState } from 'react';

import { useTranslations } from 'use-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { FleetRow } from '@/modules/fleet/rows';

function DialogShell({
   title,
   description,
   confirmLabel,
   confirmDisabled,
   onConfirm,
   onOpenChange,
   children
}: {
   title: string;
   description: string;
   confirmLabel: string;
   confirmDisabled: boolean;
   onConfirm: () => void;
   onOpenChange: (open: boolean) => void;
   children: React.ReactNode;
}) {
   const common = useTranslations('common');

   return (
      <Dialog open onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-md">
            <DialogHeader>
               <DialogTitle>{title}</DialogTitle>
               <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="flex min-w-0 flex-col gap-3 text-sm">{children}</div>
            <DialogFooter>
               <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  {common('cancel')}
               </Button>
               <Button type="button" size="sm" disabled={confirmDisabled} onClick={onConfirm}>
                  {confirmLabel}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
}

// mods and maps are copied from one device, so the operator picks which device is the reference
export function FleetReferenceDialog({
   kind,
   count,
   references,
   onStart,
   onOpenChange
}: {
   kind: 'mods' | 'maps';
   count: number;
   references: readonly FleetRow[];
   onStart: (referenceId: string) => void;
   onOpenChange: (open: boolean) => void;
}) {
   const t = useTranslations('fleet');
   const [referenceId, setReferenceId] = useState('');

   return (
      <DialogShell
         title={t(`dialog.${kind}.title`)}
         description={t(`dialog.${kind}.description`, { count })}
         confirmLabel={t('dialog.start')}
         confirmDisabled={referenceId === ''}
         onConfirm={() => onStart(referenceId)}
         onOpenChange={onOpenChange}
      >
         <div className="flex flex-col gap-2">
            <Label>{t('dialog.reference')}</Label>
            <Select value={referenceId} onValueChange={setReferenceId}>
               <SelectTrigger aria-label={t('dialog.reference')}>
                  <SelectValue placeholder={t('dialog.referencePlaceholder')} />
               </SelectTrigger>
               <SelectContent>
                  {references.map((row) => (
                     <SelectItem key={row.id} value={row.id}>
                        {row.name}
                        {row.gameVersions.length > 0 ? ` · ${row.gameVersions.join(', ')}` : ''}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>
      </DialogShell>
   );
}

export function FleetTagDialog({
   mode,
   count,
   existing,
   onApply,
   onOpenChange
}: {
   mode: 'add' | 'remove';
   count: number;
   existing: readonly string[];
   onApply: (tag: string) => void;
   onOpenChange: (open: boolean) => void;
}) {
   const t = useTranslations('fleet');
   const [tag, setTag] = useState('');

   return (
      <DialogShell
         title={t(`dialog.${mode}Tag.title`)}
         description={t(`dialog.${mode}Tag.description`, { count })}
         confirmLabel={t(`dialog.${mode}Tag.confirm`)}
         confirmDisabled={tag.trim() === ''}
         onConfirm={() => onApply(tag)}
         onOpenChange={onOpenChange}
      >
         <div className="flex flex-col gap-2">
            <Label htmlFor="fleet-tag-name">{t('tagName')}</Label>
            <Input id="fleet-tag-name" autoFocus value={tag} maxLength={32} onChange={(event) => setTag(event.target.value)} />
         </div>
         {existing.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
               {existing.map((name) => (
                  <button key={name} type="button" className="cursor-default" onClick={() => setTag(name)}>
                     <Badge variant="outline">{name}</Badge>
                  </button>
               ))}
            </div>
         ) : null}
      </DialogShell>
   );
}

export function FleetSaveViewDialog({ onSave, onOpenChange }: { onSave: (name: string) => void; onOpenChange: (open: boolean) => void }) {
   const t = useTranslations('fleet');
   const [name, setName] = useState('');

   return (
      <DialogShell
         title={t('views.saveTitle')}
         description={t('views.saveDescription')}
         confirmLabel={t('views.save')}
         confirmDisabled={name.trim() === ''}
         onConfirm={() => onSave(name.trim())}
         onOpenChange={onOpenChange}
      >
         <div className="flex flex-col gap-2">
            <Label htmlFor="fleet-view-name">{t('views.name')}</Label>
            <Input id="fleet-view-name" autoFocus value={name} maxLength={60} onChange={(event) => setName(event.target.value)} />
         </div>
      </DialogShell>
   );
}
