import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { FleetTags, UpdateTagsRequest } from '@/modules/fleet/tags';
import { apiKey } from '@/renderer/query/api-query';

const fleetTagsQueryOptions = queryOptions({
   queryKey: apiKey('fleet', 'getTags'),
   queryFn: () => window.encore.fleet.getTags(),
   staleTime: Infinity
});

const noTags: FleetTags = {};

export function useTags() {
   const client = useQueryClient();
   const query = useQuery(fleetTagsQueryOptions);
   const update = useMutation({
      mutationFn: (request: UpdateTagsRequest) => window.encore.fleet.updateTags(request),
      onSuccess: (tags) => client.setQueryData(fleetTagsQueryOptions.queryKey, tags)
   });

   return { tags: query.data ?? noTags, update: update.mutateAsync, updating: update.isPending };
}
