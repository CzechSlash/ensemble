import { expect, test } from 'vite-plus/test';

import { hashPin, parseLockRecord, pinPattern, verifyPin } from '@/modules/fleet/lock';

test('a pin verifies only against its own hash and salt', async () => {
   const record = { salt: 'a', hash: await hashPin('1234', 'a'), locked: true };
   expect(await verifyPin(record, '1234')).toBe(true);
   expect(await verifyPin(record, '1235')).toBe(false);
   expect(await hashPin('1234', 'b')).not.toBe(record.hash);
});

test('accepts 4 to 8 digits and ignores damaged stored records', () => {
   expect(['1234', '12345678'].every((pin) => pinPattern.test(pin))).toBe(true);
   expect(['123', '123456789', '12a4', ''].some((pin) => pinPattern.test(pin))).toBe(false);
   expect(parseLockRecord('{"salt":"a","hash":"b","locked":false}')).toEqual({ salt: 'a', hash: 'b', locked: false });
   expect(parseLockRecord('nope')).toBeNull();
   expect(parseLockRecord('{"salt":1}')).toBeNull();
});
