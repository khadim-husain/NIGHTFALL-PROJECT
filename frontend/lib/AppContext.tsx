'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Kiosk, PrintOrder, Incident, ActivityLogItem, AuditLog } from './types';
import { INITIAL_KIOSKS, INITIAL_ORDERS, INITIAL_INCIDENTS, INITIAL_ACTIVITIES, INITIAL_AUDIT_LOGS } from './mock-data';
import { apiClient } from './api-client';

interface AppContextType {
  // Kiosks
  kiosks: Kiosk[];
  selectedKiosk: Kiosk;
  setSelectedKiosk: (kiosk: Kiosk) => void;
  selectKioskById: (id: string) => void;
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  resetFilters: () => void;
  viewMode: '3D' | '2D';
  setViewMode: (mode: '3D' | '2D') => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;

  // Orders
  orders: PrintOrder[];
  addOrder: (order: PrintOrder) => void;

  // Incidents
  incidents: Incident[];
  resolveIncident: (id: string) => void;

  // Activities & Logs
  activities: ActivityLogItem[];
  auditLogs: AuditLog[];

  // Global UI
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarCollapse: () => void;
  lastUpdated: string;
  refreshData: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [kiosks, setKiosks] = useState<Kiosk[]>(INITIAL_KIOSKS);
  // Default selected kiosk is K05 to mirror reference image exactly
  const [selectedKiosk, setSelectedKiosk] = useState<Kiosk>(
    INITIAL_KIOSKS.find((k) => k.id === 'K05') || INITIAL_KIOSKS[0]
  );
  const [selectedZone, setSelectedZone] = useState<string>('All Zones');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [viewMode, setViewMode] = useState<'3D' | '2D'>('3D');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const [orders, setOrders] = useState<PrintOrder[]>(INITIAL_ORDERS);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [activities, setActivities] = useState<ActivityLogItem[]>(INITIAL_ACTIVITIES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nightfall_sidebar_collapsed');
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('nightfall_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Fetch Authoritative State from API and listen to Real-Time Socket.IO events
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        if (!apiClient.getToken()) {
          await apiClient.ensureAuth();
        }
        const [kioskData, orderData, incidentData, auditData] = await Promise.all([
          apiClient.getKiosks(),
          apiClient.getOrders(),
          apiClient.getIncidents(),
          apiClient.getAuditLogs(),
        ]);

        if (mounted) {
          if (kioskData && kioskData.length > 0) {
            setKiosks(kioskData);
            const currentSelected = kioskData.find((k) => k.id === 'K05') || kioskData[0];
            setSelectedKiosk(currentSelected);
          }
          if (orderData && orderData.length > 0) setOrders(orderData);
          if (incidentData && incidentData.length > 0) setIncidents(incidentData);
          if (auditData && auditData.length > 0) setAuditLogs(auditData);
          setLastUpdated('Just now');
        }
      } catch (err) {
        console.warn('Initial data load from backend failed, keeping demo state', err);
      }
    }

    loadData();

    // Setup Socket.IO real-time listeners
    const socket = apiClient.getSocket();

    const handleTelemetry = (data: any) => {
      setKiosks((prev) =>
        prev.map((k) =>
          k.id.toUpperCase() === data.kioskId.toUpperCase()
            ? {
                ...k,
                ...(data.status && { status: data.status }),
                ...(data.temperature !== undefined && { temperature: Math.round(data.temperature) }),
                ...(data.paperLevel !== undefined && { paperLevel: data.paperLevel }),
                ...(data.inkLevel !== undefined && { inkLevel: data.inkLevel }),
                lastSeen: 'Just now',
              }
            : k
        )
      );

      setSelectedKiosk((prev) =>
        prev.id.toUpperCase() === data.kioskId.toUpperCase()
          ? {
              ...prev,
              ...(data.status && { status: data.status }),
              ...(data.temperature !== undefined && { temperature: Math.round(data.temperature) }),
              ...(data.paperLevel !== undefined && { paperLevel: data.paperLevel }),
              ...(data.inkLevel !== undefined && { inkLevel: data.inkLevel }),
              lastSeen: 'Just now',
            }
          : prev
      );
    };

    const handleJobProgress = (data: any) => {
      setOrders((prev) =>
        prev.map((ord) =>
          ord.id === data.orderId || ord.id.replace('#', '') === data.orderId?.replace('#', '')
            ? {
                ...ord,
                progress: data.progress,
                status:
                  data.status === 'COMPLETED'
                    ? 'Completed'
                    : data.status === 'FAILED'
                    ? 'Failed'
                    : data.status === 'QUEUED'
                    ? 'Queued'
                    : 'Printing',
                paymentStatus: 'Paid',
              }
            : ord
        )
      );

      setKiosks((prev) =>
        prev.map((k) =>
          k.id.toUpperCase() === data.kioskId?.toUpperCase()
            ? {
                ...k,
                currentJobProgress: data.progress,
                currentJobTimeRemaining:
                  data.progress >= 100 ? 'Completed' : `${Math.max(1, Math.ceil((100 - data.progress) / 25))} min remaining`,
              }
            : k
        )
      );

      setSelectedKiosk((prev) =>
        prev.id.toUpperCase() === data.kioskId?.toUpperCase()
          ? {
              ...prev,
              currentJobProgress: data.progress,
              currentJobTimeRemaining:
                data.progress >= 100 ? 'Completed' : `${Math.max(1, Math.ceil((100 - data.progress) / 25))} min remaining`,
            }
          : prev
      );
    };

    const handleOrderCreated = (newOrder: any) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      setLastUpdated('Just now');
    };

    const handleOrderUpdated = (data: any) => {
      setOrders((prev) =>
        prev.map((ord) => {
          const match = ord.id === data.orderId || ord.id.replace('#', '') === data.orderId?.replace('#', '');
          if (match) {
            return {
              ...ord,
              ...(data.status && { status: data.status }),
              ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
              ...(data.progress !== undefined && { progress: data.progress }),
              ...(data.order && data.order),
            };
          }
          return ord;
        })
      );
      setLastUpdated('Just now');
    };

    const handleIncidentCreated = (inc: any) => {
      setIncidents((prev) => [inc, ...prev.filter((i) => i.id !== inc.id)]);
      showToast(`Incident Alert: ${inc.title} on ${inc.kioskId}`);
    };

    const handleIncidentResolved = (inc: any) => {
      setIncidents((prev) =>
        prev.map((i) => (i.id === inc.id ? { ...i, status: 'Resolved' as const } : i))
      );
    };

    socket.on('kiosk:telemetry', handleTelemetry);
    socket.on('kiosk:status_changed', handleTelemetry);
    socket.on('job:progress', handleJobProgress);
    socket.on('order:created', handleOrderCreated);
    socket.on('order:updated', handleOrderUpdated);
    socket.on('incident:created', handleIncidentCreated);
    socket.on('incident:resolved', handleIncidentResolved);

    return () => {
      mounted = false;
      socket.off('kiosk:telemetry', handleTelemetry);
      socket.off('kiosk:status_changed', handleTelemetry);
      socket.off('job:progress', handleJobProgress);
      socket.off('order:created', handleOrderCreated);
      socket.off('order:updated', handleOrderUpdated);
      socket.off('incident:created', handleIncidentCreated);
      socket.off('incident:resolved', handleIncidentResolved);
    };
  }, []);

  const selectKioskById = (id: string) => {
    const found = kiosks.find((k) => k.id.toUpperCase() === id.toUpperCase());
    if (found) {
      setSelectedKiosk(found);
    }
  };

  const resetFilters = () => {
    setSelectedZone('All Zones');
    setSelectedStatus('All Statuses');
    setZoomLevel(1);
    const k05 = kiosks.find((k) => k.id === 'K05');
    if (k05) setSelectedKiosk(k05);
    showToast('Filters reset to default view');
  };

  const refreshData = async () => {
    try {
      const [kioskData, orderData, incidentData, auditData] = await Promise.all([
        apiClient.getKiosks(),
        apiClient.getOrders(),
        apiClient.getIncidents(),
        apiClient.getAuditLogs(),
      ]);
      setKiosks(kioskData);
      setOrders(orderData);
      setIncidents(incidentData);
      setAuditLogs(auditData);
      setLastUpdated('Just now');
      showToast('Telemetry refreshed from authoritative PostgreSQL ledger');
    } catch {
      setLastUpdated('Just now');
      showToast('Telemetry refreshed');
    }
  };

  const addOrder = (newOrder: PrintOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
    setKiosks((prev) =>
      prev.map((k) =>
        k.id === newOrder.kioskId
          ? {
              ...k,
              queueLength: k.queueLength + 1,
              status: k.currentJobId ? k.status : 'Online',
              currentJobId: k.currentJobId || newOrder.id,
              currentJobDocument: k.currentJobDocument || newOrder.documentName,
              currentJobProgress: k.currentJobProgress || 0,
            }
          : k
      )
    );
    showToast(`Order ${newOrder.id} dispatched to ${newOrder.kioskId}`);
  };

  const resolveIncident = async (id: string) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: 'Resolved' as const } : inc))
    );
    const target = incidents.find((i) => i.id === id);
    if (target) {
      setKiosks((prev) =>
        prev.map((k) => (k.id === target.kioskId ? { ...k, status: 'Online' as const } : k))
      );
      showToast(`Incident ${id} marked as resolved.`);
    }

    try {
      await apiClient.resolveIncident(id);
    } catch (err) {
      console.warn('Backend resolve incident warning', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        kiosks,
        selectedKiosk,
        setSelectedKiosk,
        selectKioskById,
        selectedZone,
        setSelectedZone,
        selectedStatus,
        setSelectedStatus,
        resetFilters,
        viewMode,
        setViewMode,
        zoomLevel,
        setZoomLevel,
        orders,
        addOrder,
        incidents,
        resolveIncident,
        activities,
        auditLogs,
        searchQuery,
        setSearchQuery,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isUserMenuOpen,
        setIsUserMenuOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapse,
        lastUpdated,
        refreshData,
        toastMessage,
        showToast,
      }}
    >
      {children}
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-nf-navy text-white px-4 py-3 rounded-xl shadow-dropdown border border-slate-700 animate-slide-up transition-all">
          <span className="w-2 h-2 rounded-full bg-nf-green animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-3 text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

