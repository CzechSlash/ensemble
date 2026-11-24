import { useState } from 'react';

import { useTranslations } from 'use-intl';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { pinPattern } from '@/modules/fleet/lock';

export type PinDialogMode = 'set' | 'enter' | 'remove';

// `onSubmit` resolves to false when the PIN was wrong, so the dialog can say so and stay open
export function PinDialog({
   mode,
   onSubmit,
   onOpenChange
}: {
   mode: PinDialogMode;
   onSubmit: (pin: string) => Promise<boolean>;
   onOpenChange: (open: boolean) => void;
}) {
   const t = useTranslations('console.pin');
   const common = useTranslations('common');
   const [pin, setPin] = useState('');
   const [wrong, setWrong] = useState(false);
   const [busy, setBusy] = useState(false);

   const submit = async () => {
      if (!pinPattern.test(pin) || busy) return;
      setBusy(true);
      const accepted = await onSubmit(pin);
      setBusy(false);
      if (accepted) onOpenChange(false);
      else {
         setWrong(true);
         setPin('');
      }
   };

   return (
      <Dialog open onOpenChange={onOpenChange}>
         <DialogContent className="sm:max-w-sm">
            <DialogHeader>
               <DialogTitle>{t(`${mode}Title`)}</DialogTitle>
               <DialogDescription>{t(`${mode}Description`)}</DialogDescription>
            </DialogHeader>
            <form
               className="flex min-w-0 flex-col gap-2 text-sm"
               onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
               }}
            >
               <Label htmlFor="console-pin">{t('label')}</Label>
               <Input
                  id="console-pin"
                  autoFocus
                  type="password"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={pin}
                  aria-invalid={wrong}
                  onChange={(event) => {
                     setWrong(false);
                     setPin(event.target.value.replace(/\D/g, ''));
                  }}
               />
               <p className={wrong ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>{wrong ? t('wrong') : t('hint')}</p>
               <DialogFooter className="mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                     {common('cancel')}
                  </Button>
                  <Button type="submit" size="sm" disabled={!pinPattern.test(pin) || busy}>
                     {t('confirm')}
                  </Button>
               </DialogFooter>
            </form>
         </DialogContent>
      </Dialog>
   );
}
