import { useSyncExternalStore } from 'react';

import { hashPin, parseLockRecord, verifyPin, type ConsoleLockRecord } from '@/modules/fleet/lock';
import { readStorageValue, removeStorageValue, writeStorageValue } from '@/renderer/storage';

const storageKey = 'ensemble.console.lock';
const listeners = new Set<() => void>();
let record: ConsoleLockRecord | null = parseLockRecord(readStorageValue(storageKey).unwrapOr(null));

function commit(next: ConsoleLockRecord | null) {
   record = next;
   if (next) void writeStorageValue(storageKey, JSON.stringify(next));
   else void removeStorageValue(storageKey);
   for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
   listeners.add(listener);
   return () => listeners.delete(listener);
}

// the lock keeps volunteers on the console and out of the other pages. It lives in this window's storage, so it is a convenience, not security
export function useConsoleLock() {
   const current = useSyncExternalStore(subscribe, () => record);

   return {
      locked: current?.locked ?? false,
      hasPin: current !== null,
      setPin: async (pin: string) => {
         const salt = crypto.randomUUID();
         commit({ salt, hash: await hashPin(pin, salt), locked: false });
      },
      lock: () => {
         if (record) commit({ ...record, locked: true });
      },
      unlock: async (pin: string) => {
         if (!record || !(await verifyPin(record, pin))) return false;
         commit({ ...record, locked: false });
         return true;
      },
      removePin: async (pin: string) => {
         if (!record || !(await verifyPin(record, pin))) return false;
         commit(null);
         return true;
      }
   };
}
