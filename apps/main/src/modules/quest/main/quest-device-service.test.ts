import { Result } from 'better-result';
import { afterEach, expect, test, vi } from 'vite-plus/test';

import type { AdbClient } from '@/lib/android/adb';
import { createQuestDeviceService } from '@/modules/quest/main/quest-device-service';
import { createQuestMutationLock } from '@/modules/quest/main/quest-mutation-lock';

afterEach(() => vi.useRealTimers());

function fleet(size: number) {
   const calls = { hardwareSerial: 0, packageRunning: 0, packageVersionName: 0 };
   const serials = Array.from({ length: size }, (_, index) => `10.0.0.${index}:5555`);
   const track = async <Value>(value: Value) => {
      await Promise.resolve();
      return Result.ok(value);
   };
   const client = {
      listDevices: async () => Result.ok(serials.map((serial) => ({ serial, state: 'device' as const, model: 'Quest_3', product: 'eureka' }))),
      hardwareSerial: (serial: string) => {
         calls.hardwareSerial += 1;
         return track(`HW-${serial}`);
      },
      packageRunning: () => {
         calls.packageRunning += 1;
         return Result.ok(false);
      },
      packageVersionName: () => {
         calls.packageVersionName += 1;
         return track('1.40.0_5754');
      },
      packagePatched: () => track(true),
      fileExists: () => track(false),
      readTextFile: () => track(''),
      movePath: () => track(undefined),
      packageApkPath: () => track('/data/app/base.apk')
   } as unknown as AdbClient;
   return { client, calls };
}

test('probes headsets a few at a time and only re-asks whether the game runs between full checks', async () => {
   vi.useFakeTimers();
   const { client, calls } = fleet(24);
   const service = createQuestDeviceService({
      provisioner: { resolve: async () => Result.ok('adb') },
      createClient: () => client,
      mutations: createQuestMutationLock()
   });

   service.start();
   await vi.advanceTimersByTimeAsync(1);
   expect(service.listTargets()).toHaveLength(24);
   expect(calls.hardwareSerial).toBe(24);
   expect(calls.packageVersionName).toBe(48);

   await vi.advanceTimersByTimeAsync(10_000);
   expect(calls.hardwareSerial).toBe(24);
   expect(calls.packageVersionName).toBe(48);
   expect(calls.packageRunning).toBe(24 * 2);

   await vi.advanceTimersByTimeAsync(60_000);
   expect(calls.hardwareSerial).toBeGreaterThan(24);
   service.dispose();
});
