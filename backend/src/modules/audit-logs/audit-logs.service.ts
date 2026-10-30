import { prisma } from '../../config/prisma.js';

export class AuditLogsService {
  public async getAuditLogs(filters?: { actor?: string; action?: string; status?: any; limit?: number }) {
    const where: any = {};
    if (filters?.actor) {
      where.actor = { contains: filters.actor, mode: 'insensitive' };
    }
    if (filters?.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters?.limit || 50,
    });

    return logs.map((l) => ({
      id: l.id,
      timestamp: new Date(l.timestamp).toISOString().replace('T', ' ').substring(0, 19),
      actor: l.actor,
      actorRole: l.actorRole,
      action: l.action,
      resource: l.resource,
      status: l.status,
      ipAddress: l.ipAddress,
      payload: (l.payload as any) || undefined,
    }));
  }
}

export const auditLogsService = new AuditLogsService();

