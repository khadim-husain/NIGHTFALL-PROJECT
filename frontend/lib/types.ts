export type KioskZone = 'Zone A' | 'Zone B' | 'Zone C';

export type KioskStatus = 'Online' | 'Idle' | 'Busy' | 'Offline' | 'Error';

export interface Kiosk {
  id: string; // 'K01' - 'K12'
  name: string;
  zone: KioskZone;
  zoneLabel: string; // 'Front Lobby' | 'Main Floor' | 'Production'
  status: KioskStatus;
  ipAddress: string;
  currentJobId?: string;
  currentJobDocument?: string;
  currentJobProgress?: number;
  currentJobTimeRemaining?: string;
  lastSeen: string;
  queueLength: number;
  totalPrints: number;
  temperature: number; // in Celsius
  paperLevel: number; // percentage
  inkLevel: number; // percentage
  coordinates: { x: number; y: number; z: number };
}

export type OrderStatus = 'Printing' | 'Completed' | 'Queued' | 'Failed' | 'Pending' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';

export interface PrintOrder {
  id: string; // e.g. '#NF-1048'
  documentName: string;
  fileSize: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'png' | 'jpg';
  kioskId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  progress: number;
  createdAt: string;
  copies: number;
  pageCount: number;
  colorMode: 'Color' | 'Monochrome';
  paperSize: 'A4' | 'A3' | 'Letter';
  duplex: boolean;
  totalAmount: number;
  subtotal?: number;
  tax?: number;
  currency?: string;
  estimatedCompletion?: string;
  timeline: {
    title: string;
    description: string;
    time: string;
    completed: boolean;
  }[];
}

export type IncidentSeverity = 'Error' | 'Warning' | 'Info';
export type IncidentStatus = 'Open' | 'In Progress' | 'Resolved';

export interface Incident {
  id: string;
  severity: IncidentSeverity;
  kioskId: string;
  zone: string;
  title: string;
  description: string;
  timeAgo: string;
  timestamp: string;
  status: IncidentStatus;
  reportedBy: string;
}

export interface ActivityLogItem {
  id: string;
  kioskId: string;
  action: string;
  details: string;
  timeAgo: string;
  type: 'completed' | 'started' | 'error' | 'warning' | 'maintenance';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  ipAddress: string;
  payload?: Record<string, any>;
}

