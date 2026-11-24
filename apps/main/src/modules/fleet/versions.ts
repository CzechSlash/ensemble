import { displayGameVersion } from '@/modules/fleet/rows';
import type { InstallSummary } from '@/modules/installs/contract';

// with no wanted version a device launches its first install; with one it must have that exact version installed
export function pickInstall(installs: readonly InstallSummary[], version: string | null) {
   if (!version) return installs[0];
   return installs.find((install) => install.version !== null && displayGameVersion(install.version) === version);
}

export function hasVersion(installs: readonly InstallSummary[], version: string) {
   return pickInstall(installs, version) !== undefined;
}
