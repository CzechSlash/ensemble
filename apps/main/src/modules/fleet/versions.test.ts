import { expect, test } from 'vite-plus/test';

import { hasVersion, pickInstall } from '@/modules/fleet/versions';
import type { InstallSummary } from '@/modules/installs/contract';

const install = (id: string, version: string | null) => ({ id, version }) as InstallSummary;
const installs = [install('a', '1.40.0'), install('b', '1.29.1'), install('c', '1.40.0_5754'), install('d', null)];

test('picks the first install when no version is wanted', () => {
   expect(pickInstall(installs, null)?.id).toBe('a');
   expect(pickInstall([], null)).toBeUndefined();
});

test('picks the install with the wanted version, ignoring the store build suffix', () => {
   expect(pickInstall(installs, '1.29.1')?.id).toBe('b');
   expect(pickInstall([install('x', '1.40.0_5754')], '1.40.0')?.id).toBe('x');
   expect(pickInstall(installs, '1.35.0')).toBeUndefined();
   expect(hasVersion(installs, '1.29.1')).toBe(true);
   expect(hasVersion(installs, '1.35.0')).toBe(false);
});
