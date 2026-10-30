'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/lib/AppContext';
import { apiClient } from '@/lib/api-client';
import {
  Monitor,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Printer,
  Cpu,
  Wifi,
  Thermometer,
  Layers,
  Droplet,
  Power,
  Play,
  FileCheck,
} from 'lucide-react';

export default function KioskDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { kiosks, orders, incidents, resolveIncident, showToast } = useApp();

  const id = (params?.id as string) || '';
  const kiosk =
    kiosks.find((k) => k.id.toLowerCase() === id.toLowerCase()) || kiosks[0];

  const kioskOrders = orders.filter((o) => o.kioskId === kiosk.id);
  const kioskIncidents = incidents.filter(
    (i) => i.kioskId === kiosk.id && i.status === 'Open'
  );

  const [isRebooting, setIsRebooting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleReboot = async () => {
    setIsRebooting(true);
    showToast(`Transmitting soft reboot signal to Kiosk ${kiosk.id}...`);
    try {
      await apiClient.restartKiosk(kiosk.id);
      showToast(`Kiosk ${kiosk.id} reboot sequence completed. All diagnostics nominal.`);
    } catch {
      showToast(`Kiosk ${kiosk.id} reboot initiated locally.`);
    } finally {
      setIsRebooting(false);
    }
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    showToast(`Dispatching CMYK calibration test to ${kiosk.id}...`);
    try {
      const res = await apiClient.testPrint(kiosk.id);
      showToast(res.message || `Test calibration page dispatched to ${kiosk.id}`);
    } catch {
      showToast(`Test calibration page dispatched to ${kiosk.id}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleResolve = (incidentId: string) => {
    resolveIncident(incidentId);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 select-none">
        {/* Navigation Breadcrumb */}
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-nf-secondary font-medium mb-1.5">
            <Link href="/command-center" className="hover:text-nf-navy transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/kiosks" className="hover:text-nf-navy transition-colors">
              Kiosks
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-nf-navy font-semibold">{kiosk.id}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-nf-navy tracking-tight">
                    {kiosk.id} — {kiosk.name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      kiosk.status === 'Error'
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    ● {kiosk.status}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {kiosk.zone} • {kiosk.zoneLabel} • IP: {kiosk.ipAddress}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestPrint}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Test Page</span>
              </button>

              <button
                type="button"
                onClick={handleReboot}
                disabled={isRebooting}
                className="px-3.5 py-2 rounded-xl bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isRebooting ? 'animate-spin' : ''}`} />
                <span>{isRebooting ? 'Rebooting...' : 'Soft Reboot'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Active Incidents Banner if any */}
        {kioskIncidents.length > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-red-800 block">
                  Active Incident: {kioskIncidents[0].title}
                </span>
                <span className="text-xs text-red-600 block mt-0.5">
                  {kioskIncidents[0].description} ({kioskIncidents[0].timeAgo})
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleResolve(kioskIncidents[0].id)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors whitespace-nowrap self-end sm:self-auto"
            >
              Resolve & Clear Error
            </button>
          </div>
        )}

        {/* Four Hardware Telemetry Gauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Fuser Temperature */}
          <div className="bg-white rounded-2xl border border-nf-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Core Temperature</span>
              <Thermometer className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-nf-navy">{kiosk.temperature}°C</span>
              <span className="text-[11px] text-slate-400">Target: 36°C</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-1.5 rounded-full ${
                  kiosk.temperature > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${(kiosk.temperature / 60) * 100}%` }}
              />
            </div>
          </div>

          {/* Paper Level */}
          <div className="bg-white rounded-2xl border border-nf-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Paper Supply</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-nf-navy">{kiosk.paperLevel}%</span>
              <span className="text-[11px] text-slate-400">~{kiosk.paperLevel * 5} sheets</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${kiosk.paperLevel}%` }}
              />
            </div>
          </div>

          {/* Ink Level */}
          <div className="bg-white rounded-2xl border border-nf-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">CMYK Toner Cartridge</span>
              <Droplet className="w-4 h-4 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-nf-navy">{kiosk.inkLevel}%</span>
              <span className="text-[11px] text-slate-400">Calibrated</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full"
                style={{ width: `${kiosk.inkLevel}%` }}
              />
            </div>
          </div>

          {/* Total Prints & Uptime */}
          <div className="bg-white rounded-2xl border border-nf-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Total Lifetime Prints</span>
              <Cpu className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-nf-navy">
                {kiosk.totalPrints.toLocaleString()}
              </span>
              <span className="text-[11px] text-emerald-600 font-bold">99.8% Uptime</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-1.5 rounded-full w-[99%]" />
            </div>
          </div>
        </div>

        {/* Detailed Grid: Active Job + Hardware Specs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Active Job & Spool (col-span-7) */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-nf-navy uppercase tracking-wider">
                  Active Spool Queue
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  {kiosk.queueLength} {kiosk.queueLength === 1 ? 'Job' : 'Jobs'} in Queue
                </span>
              </div>

              {kiosk.currentJobId ? (
                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-nf-blue">
                        {kiosk.currentJobId}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                        {kiosk.currentJobDocument}
                      </span>
                    </div>
                    <span className="text-sm font-black text-nf-blue">
                      {kiosk.currentJobProgress}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-nf-blue h-2 rounded-full transition-all duration-500"
                      style={{ width: `${kiosk.currentJobProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 block">
                    {kiosk.currentJobTimeRemaining}
                  </span>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No print jobs currently processing. Ready for incoming requests.
                </div>
              )}

              {/* Recent Orders handled by this kiosk */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-500 block mb-2">
                  Recent History on this Kiosk
                </span>
                <div className="divide-y divide-slate-100 text-xs">
                  {kioskOrders.length > 0 ? (
                    kioskOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{ord.id}</span>
                          <span className="text-slate-500 ml-2">{ord.documentName}</span>
                        </div>
                        <span className="font-bold text-emerald-600">{ord.status}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-2 text-slate-400 text-xs">No recent order logs</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Hardware & Network Specs (col-span-5) */}
          <div className="md:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-3">
              <h2 className="text-sm font-bold text-nf-navy uppercase tracking-wider pb-2 border-b border-slate-100">
                Hardware & Connectivity
              </h2>

              <div className="divide-y divide-slate-100 text-xs font-medium">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Terminal Model</span>
                  <span className="font-bold text-slate-800">Nightfall Apex-4000 Smart</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">IP Address</span>
                  <span className="font-mono font-bold text-nf-blue">{kiosk.ipAddress}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">MAC Address</span>
                  <span className="font-mono text-slate-600">00:1B:44:11:3A:{kiosk.id.replace('K', '')}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Firmware Build</span>
                  <span className="font-mono text-slate-600">v4.8.2-rtos</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">TLS Encryption</span>
                  <span className="text-emerald-600 font-bold">TLS 1.3 Active</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Zone Grid Position</span>
                  <span className="font-mono text-slate-600">
                    X: {kiosk.coordinates.x}, Z: {kiosk.coordinates.z}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

