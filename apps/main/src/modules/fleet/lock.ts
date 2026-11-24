export const pinPattern = /^\d{4,8}$/;

export type ConsoleLockRecord = { salt: string; hash: string; locked: boolean };

export async function hashPin(pin: string, salt: string) {
   const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${pin}`));
   return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(record: ConsoleLockRecord, pin: string) {
   return (await hashPin(pin, record.salt)) === record.hash;
}

export function parseLockRecord(raw: string | null): ConsoleLockRecord | null {
   if (!raw) return null;
   try {
      const value: unknown = JSON.parse(raw);
      if (typeof value !== 'object' || value === null) return null;
      const { salt, hash, locked } = value as Record<string, unknown>;
      return typeof salt === 'string' && typeof hash === 'string' && typeof locked === 'boolean' ? { salt, hash, locked } : null;
   } catch {
      return null;
   }
}
