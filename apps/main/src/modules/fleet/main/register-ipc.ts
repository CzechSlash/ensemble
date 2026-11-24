import type { IpcMainInvokeEvent } from 'electron';

import { defineIpcHandlers } from '@/ipc/host';
import { fleetIpc } from '@/modules/fleet/ipc';
import type { FleetTagStore } from '@/modules/fleet/main/fleet-tags';
import type { MapSyncService } from '@/modules/maps/main/map-sync';

export function createFleetIpcModule(tags: FleetTagStore, maps: Pick<MapSyncService, 'push'>) {
   return defineIpcHandlers<typeof fleetIpc, IpcMainInvokeEvent>(fleetIpc, {
      getTags: () => tags.get(),
      updateTags: (request) => tags.update(request),
      pushMaps: async ({ reference, target }) => (await maps.push({ first: reference, second: target })).map((started) => started.operation)
   });
}
