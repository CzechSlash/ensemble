import { createFileRoute } from '@tanstack/react-router';

import { OperatorConsole } from '@/modules/fleet/renderer/operator-console';

export const Route = createFileRoute('/console')({
   component: OperatorConsole
});
