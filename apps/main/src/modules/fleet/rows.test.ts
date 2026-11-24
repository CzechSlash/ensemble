import { expect, test } from 'vite-plus/test';

import { buildFleetRows, displayGameVersion, matchesFleetQuery } from '@/modules/fleet/rows';
import type { InstallSummary } from '@/modules/installs/contract';
import type { Target } from '@/modules/targets/contract';

const target = (id: string, extra: Partial<Target>): Target => ({ id, kind: 'quest', name: id, status: 'ready', capabilities: [], ...extra });
const install = (version: string | null) => ({ version }) as InstallSummary;

test('builds one row per target with kinds, versions and modded state', () => {
   const rows = buildFleetRows(
      [
         target('local', { kind: 'local', name: 'This PC' }),
         target('remote_a', { kind: 'remote', name: 'Station 1' }),
         target('quest:A', { name: 'Quest 3', connection: 'wifi' }),
         target('quest:B', { name: 'Quest 2', status: 'disconnected', connection: 'remote', via: 'Station 1' })
      ],
      new Map([
         ['local', [install('1.40.0')]],
         ['remote_a', [install('1.40.0'), install('1.29.1'), install('1.40.0')]],
         ['quest:A', [install('1.40.0_5754')]]
      ]),
      new Map([['quest:A', { modded: true, savedPlayerData: false, companionInstalled: true }]]),
      { 'quest:A': ['Public'] }
   );

   expect(rows.map((row) => row.kind)).toEqual(['this-pc', 'pc', 'quest', 'quest']);
   expect(rows[1]?.gameVersions).toEqual(['1.40.0', '1.29.1']);
   expect(rows[2]).toMatchObject({ tags: ['Public'], gameVersions: ['1.40.0'], modded: true, connection: 'wifi' });
   expect(rows[3]).toMatchObject({ gameVersions: [], modded: null, via: 'Station 1', status: 'disconnected' });
});

test('strips the store build suffix and filters by name, host or version', () => {
   expect(displayGameVersion('1.40.0_5754')).toBe('1.40.0');
   expect(displayGameVersion('1.40.0')).toBe('1.40.0');

   const [row] = buildFleetRows(
      [target('quest:B', { name: 'Quest 2', via: 'Station 1' })],
      new Map([['quest:B', [install('1.29.1_4000')]]]),
      new Map()
   );
   expect(row && matchesFleetQuery(row, 'station')).toBe(true);
   expect(row && matchesFleetQuery(row, '1.29')).toBe(true);
   expect(row && matchesFleetQuery(row, 'nope')).toBe(false);
   expect(row && matchesFleetQuery(row, '  ')).toBe(true);
});
