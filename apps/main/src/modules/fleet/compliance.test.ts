import { expect, test } from 'vite-plus/test';

import { compareToReference, formatReport, type ComplianceMod, type ComplianceResult } from '@/modules/fleet/compliance';

const mod = (id: string, version: string | null = '1.0.0'): ComplianceMod => ({ id, name: id.toUpperCase(), version });
const reference = { gameVersion: '1.40.0', mods: [mod('a'), mod('b', '2.0.0')] };

test('a device that matches the reference has no issues', () => {
   expect(compareToReference(reference, { gameVersion: '1.40.0', mods: [mod('b', '2.0.0'), mod('a')] })).toEqual([]);
});

test('a different game version is the only issue reported', () => {
   expect(compareToReference(reference, { gameVersion: '1.29.1', mods: [] })).toEqual([{ kind: 'gameVersion', expected: '1.40.0', found: '1.29.1' }]);
   expect(compareToReference(reference, { gameVersion: null, mods: [] })).toEqual([{ kind: 'gameVersion', expected: '1.40.0', found: null }]);
});

test('missing, extra and mismatched mods are reported', () => {
   const issues = compareToReference(reference, { gameVersion: '1.40.0', mods: [mod('b', '2.1.0'), mod('c')] });
   expect(issues).toEqual([
      { kind: 'missing', name: 'A', version: '1.0.0' },
      { kind: 'version', name: 'B', expected: '2.0.0', found: '2.1.0' },
      { kind: 'extra', name: 'C' }
   ]);
});

test('mods without a known version are not flagged as mismatched', () => {
   expect(compareToReference({ gameVersion: '1', mods: [mod('a', null)] }, { gameVersion: '1', mods: [mod('a', '3.0.0')] })).toEqual([]);
});

test('the report lists every device with its issues', () => {
   const results = new Map<string, ComplianceResult>([
      ['one', { status: 'pass' }],
      ['two', { status: 'fail', issues: [{ kind: 'extra', name: 'C' }] }],
      ['three', { status: 'error', message: 'offline' }]
   ]);
   const names = new Map([
      ['one', 'Station 1'],
      ['two', 'Station 2'],
      ['three', 'Station 3']
   ]);
   expect(formatReport(results, names, 'Station 1')).toBe(
      [
         'Compliance check against Station 1',
         'PASS  Station 1',
         'FAIL  Station 2',
         '      - C is not in the reference',
         'ERROR Station 3: offline'
      ].join('\n')
   );
});
