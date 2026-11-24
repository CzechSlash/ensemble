import { z } from 'zod';

import { defineIpc, request, type IpcResult } from '@/ipc/core';
import { updateTagsRequestSchema, type FleetTags } from '@/modules/fleet/tags';
import { installIdSchema } from '@/modules/installs/contract';
import type { OperationSnapshot } from '@/modules/operations/contract';

const pushSideSchema = z.object({ targetId: z.string().min(1), installId: installIdSchema });
export const pushMapsRequestSchema = z.object({ reference: pushSideSchema, target: pushSideSchema });

export const fleetIpc = defineIpc('fleet', {
   getTags: request().returns<FleetTags>(),
   updateTags: request(updateTagsRequestSchema).returns<FleetTags>(),
   pushMaps: request(pushMapsRequestSchema).returns<IpcResult<OperationSnapshot>>()
});
