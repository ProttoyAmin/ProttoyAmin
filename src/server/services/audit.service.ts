import "server-only";

import { getRepositories } from "@/server/db/registry";

export interface AuditEntry {
  actorEmail: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

/**
 * Writes an immutable record of every admin mutation.
 * Audit failures never break the operation they describe.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const repositories = await getRepositories();
    await repositories.auditLogs.create({
      actorEmail: entry.actorEmail,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      metadata: entry.metadata,
      ip: entry.ip,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[audit] failed to record entry:", error);
  }
}
