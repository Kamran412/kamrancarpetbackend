import { Request } from "express";
import prisma from "@/config/prisma";

/**
 * Writes an entry to the ActivityLog table. Failures are swallowed (logged
 * to stderr) so that logging can never break the primary request — this is
 * a side effect, not a critical path.
 */
export async function logActivity(
  req: Request,
  action: string,
  entity?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.user?.id,
        action,
        entity,
        entityId,
        metadata: metadata as any,
        ipAddress: req.ip,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Failed to write activity log:", err);
  }
}
