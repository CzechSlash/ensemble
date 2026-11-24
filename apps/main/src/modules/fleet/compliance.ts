export type ComplianceMod = { id: string; name: string; version: string | null };

// what a device has: the Beat Saber version of the checked install and every mod installed on it
export type ComplianceSnapshot = { gameVersion: string | null; mods: readonly ComplianceMod[] };

export type ComplianceIssue =
   | { kind: 'gameVersion'; expected: string; found: string | null }
   | { kind: 'missing'; name: string; version: string | null }
   | { kind: 'extra'; name: string }
   | { kind: 'version'; name: string; expected: string; found: string };

export type ComplianceResult =
   | { status: 'running' }
   | { status: 'pass' }
   | { status: 'fail'; issues: ComplianceIssue[] }
   | { status: 'error'; message: string };

// the reference device is the rulebook: a device passes when it has the same game version and exactly the same mods at the same versions
export function compareToReference(reference: ComplianceSnapshot, device: ComplianceSnapshot): ComplianceIssue[] {
   if (reference.gameVersion !== device.gameVersion) {
      return [{ kind: 'gameVersion', expected: reference.gameVersion ?? '', found: device.gameVersion }];
   }

   const issues: ComplianceIssue[] = [];
   const have = new Map(device.mods.map((mod) => [mod.id, mod]));
   const wanted = new Set(reference.mods.map((mod) => mod.id));

   for (const mod of reference.mods) {
      const found = have.get(mod.id);
      if (!found) issues.push({ kind: 'missing', name: mod.name, version: mod.version });
      else if (mod.version !== null && found.version !== null && mod.version !== found.version) {
         issues.push({ kind: 'version', name: mod.name, expected: mod.version, found: found.version });
      }
   }
   for (const mod of device.mods) {
      if (!wanted.has(mod.id)) issues.push({ kind: 'extra', name: mod.name });
   }
   return issues;
}

export function describeIssue(issue: ComplianceIssue) {
   switch (issue.kind) {
      case 'gameVersion':
         return `Beat Saber ${issue.found ?? 'not installed'} (expected ${issue.expected})`;
      case 'missing':
         return `${issue.name} is missing${issue.version ? ` (expected ${issue.version})` : ''}`;
      case 'extra':
         return `${issue.name} is not in the reference`;
      case 'version':
         return `${issue.name} is ${issue.found} (expected ${issue.expected})`;
   }
}

// plain text for pasting into a tournament log or a chat with the organisers
export function formatReport(results: ReadonlyMap<string, ComplianceResult>, names: ReadonlyMap<string, string>, referenceName: string) {
   const lines = [`Compliance check against ${referenceName}`];
   for (const [id, result] of results) {
      const name = names.get(id) ?? id;
      if (result.status === 'pass') lines.push(`PASS  ${name}`);
      else if (result.status === 'error') lines.push(`ERROR ${name}: ${result.message}`);
      else if (result.status === 'fail') {
         lines.push(`FAIL  ${name}`, ...result.issues.map((issue) => `      - ${describeIssue(issue)}`));
      }
   }
   return lines.join('\n');
}
