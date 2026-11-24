import { createFileRoute } from '@tanstack/react-router';

import { ComplianceCheck } from '@/modules/fleet/renderer/compliance-check';

export const Route = createFileRoute('/compliance')({
   component: ComplianceCheck
});
