import { io } from './socket.js';
import { logger } from '../../config/logger.js';

export const RealtimeEvents = {
  // Kiosk updates
  KIOSK_HEARTBEAT: 'kiosk:heartbeat',
  KIOSK_STATUS_CHANGED: 'kiosk:status_changed',
  KIOSK_TELEMETRY: 'kiosk:telemetry',

  // Job updates
  JOB_CLAIMED: 'job:claimed',
  JOB_PROGRESS: 'job:progress',
  JOB_COMPLETED: 'job:completed',
  JOB_FAILED: 'job:failed',

  // Order updates
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',

  // Operational incidents & logs
  INCIDENT_CREATED: 'incident:created',
  INCIDENT_RESOLVED: 'incident:resolved',
  AUDIT_LOG_ENTRY: 'audit:log_entry',

  // Dashboard KPIs
  DASHBOARD_REFRESH: 'dashboard:refresh',
} as const;

export class EventPublisher {
  public static publishKioskTelemetry(kioskId: string, data: any) {
    if (!io) return;
    const payload = {
      kioskId,
      timestamp: new Date().toISOString(),
      ...data,
    };
    io.to('ops:kiosks').to(`kiosk:${kioskId}`).emit(RealtimeEvents.KIOSK_TELEMETRY, payload);
    io.to('ops:dashboard').emit(RealtimeEvents.KIOSK_STATUS_CHANGED, payload);
  }

  public static publishJobProgress(payload: {
    jobId: string;
    orderId: string;
    kioskId: string;
    customerId?: string;
    progress: number;
    status: string;
    version: number;
  }) {
    if (!io) return;
    const eventData = {
      timestamp: new Date().toISOString(),
      ...payload,
    };
    // Emit to all connected clients and specific rooms
    io.emit(RealtimeEvents.JOB_PROGRESS, eventData);
    io.emit(RealtimeEvents.ORDER_UPDATED, eventData);
    io.to('ops:dashboard').to(`kiosk:${payload.kioskId}`).emit(RealtimeEvents.JOB_PROGRESS, eventData);

    if (payload.customerId) {
      io.to(`user:${payload.customerId}`).emit(RealtimeEvents.ORDER_UPDATED, eventData);
    }
  }

  public static publishOrderCreated(order: any) {
    if (!io) return;
    io.emit(RealtimeEvents.ORDER_CREATED, order);
    io.to('ops:dashboard').emit(RealtimeEvents.ORDER_CREATED, order);
    if (order.customerId) {
      io.to(`user:${order.customerId}`).emit(RealtimeEvents.ORDER_CREATED, order);
    }
  }

  public static publishOrderUpdated(data: any) {
    if (!io) return;
    io.emit(RealtimeEvents.ORDER_UPDATED, data);
    io.to('ops:dashboard').emit(RealtimeEvents.ORDER_UPDATED, data);
  }

  public static publishIncident(type: 'created' | 'resolved', incident: any) {
    if (!io) return;
    const eventName = type === 'created' ? RealtimeEvents.INCIDENT_CREATED : RealtimeEvents.INCIDENT_RESOLVED;
    io.to('ops:incidents').to('ops:dashboard').emit(eventName, incident);
  }

  public static publishAuditLog(log: any) {
    if (!io) return;
    io.to('ops:dashboard').emit(RealtimeEvents.AUDIT_LOG_ENTRY, log);
  }
}

