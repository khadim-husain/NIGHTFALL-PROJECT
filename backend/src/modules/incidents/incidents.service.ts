import { prisma } from '../../config/prisma.js';
import { AppError } from '../../middleware/errorHandler.js';
import { EventPublisher } from '../realtime/events.js';
import { IncidentStatus, IncidentSeverity, KioskStatus } from '@prisma/client';

export class IncidentsService {
  private formatIncident(inc: any) {
    const diffMinutes = Math.floor((Date.now() - new Date(inc.createdAt).getTime()) / 60000);
    let timeAgo = 'Just now';
    if (diffMinutes >= 60) {
      timeAgo = `${Math.floor(diffMinutes / 60)} hrs ago`;
    } else if (diffMinutes > 0) {
      timeAgo = `${diffMinutes} min ago`;
    }

    const formattedStatus: 'Open' | 'In Progress' | 'Resolved' =
      inc.status === IncidentStatus.In_Progress ? 'In Progress' : inc.status;

    return {
      id: inc.id,
      severity: inc.severity as 'Error' | 'Warning' | 'Info',
      kioskId: inc.kioskId,
      zone: inc.zone,
      title: inc.title,
      description: inc.description,
      timeAgo,
      timestamp: new Date(inc.createdAt).toISOString().replace('T', ' ').substring(0, 19),
      status: formattedStatus,
      reportedBy: inc.reportedBy,
    };
  }

  public async getIncidents(filters?: { status?: IncidentStatus; severity?: IncidentSeverity; kioskId?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.kioskId) where.kioskId = filters.kioskId;

    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return incidents.map((i) => this.formatIncident(i));
  }

  public async getIncidentById(id: string) {
    const inc = await prisma.incident.findUnique({
      where: { id },
    });

    if (!inc) {
      throw new AppError(`Incident '${id}' not found.`, 404, 'INCIDENT_NOT_FOUND');
    }

    return this.formatIncident(inc);
  }

  public async createIncident(data: {
    kioskId: string;
    zone: string;
    severity: IncidentSeverity;
    title: string;
    description: string;
    reportedBy?: string;
  }) {
    const kiosk = await prisma.kiosk.findUnique({ where: { id: data.kioskId.toUpperCase() } });
    if (!kiosk) throw new AppError('Kiosk not found', 404, 'KIOSK_NOT_FOUND');

    const incId = `INC-${Math.floor(400 + Math.random() * 500)}`;

    const inc = await prisma.incident.create({
      data: {
        id: incId,
        kioskId: kiosk.id,
        zone: data.zone,
        severity: data.severity,
        title: data.title,
        description: data.description,
        status: IncidentStatus.Open,
        reportedBy: data.reportedBy || 'System Sensor',
      },
    });

    // Update kiosk status to Error or Online
    if (data.severity === IncidentSeverity.Error) {
      await prisma.kiosk.update({
        where: { id: kiosk.id },
        data: { status: KioskStatus.Error },
      });
    }

    const formatted = this.formatIncident(inc);
    EventPublisher.publishIncident('created', formatted);

    return formatted;
  }

  public async resolveIncident(id: string, actor: string) {
    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) throw new AppError('Incident not found', 404, 'INCIDENT_NOT_FOUND');

    const updated = await prisma.$transaction(async (tx) => {
      const inc = await tx.incident.update({
        where: { id },
        data: {
          status: IncidentStatus.Resolved,
          resolvedAt: new Date(),
        },
      });

      // Restore kiosk status to Online if no other open error incidents exist
      const otherOpenIncidents = await tx.incident.count({
        where: {
          kioskId: incident.kioskId,
          status: { in: [IncidentStatus.Open, IncidentStatus.In_Progress] },
          severity: IncidentSeverity.Error,
          id: { not: id },
        },
      });

      if (otherOpenIncidents === 0) {
        await tx.kiosk.update({
          where: { id: incident.kioskId },
          data: { status: KioskStatus.Online },
        });
      }

      await tx.auditLog.create({
        data: {
          id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
          actor,
          actorRole: 'System Operator',
          action: 'INCIDENT_RESOLVED',
          resource: `Incident ${id}`,
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          payload: { incidentId: id, kioskId: incident.kioskId },
        },
      });

      return inc;
    });

    const formatted = this.formatIncident(updated);
    EventPublisher.publishIncident('resolved', formatted);
    EventPublisher.publishKioskTelemetry(incident.kioskId, { status: KioskStatus.Online });

    return formatted;
  }
}

export const incidentsService = new IncidentsService();

