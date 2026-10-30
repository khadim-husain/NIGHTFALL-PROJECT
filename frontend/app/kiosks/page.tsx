'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/lib/AppContext';
import { apiClient } from '@/lib/api-client';
import {
  Monitor,
  Search,
  Filter,
  Grid,
  List,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RotateCcw,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function KiosksPage() {
  const router = useRouter();
  const { kiosks, setSelectedKiosk, showToast } = useApp();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredKiosks = kiosks.filter((k) => {
    const matchesSearch =
      k.id.toLowerCase().includes(search.toLowerCase()) ||
      k.name.toLowerCase().includes(search.toLowerCase()) ||
      k.ipAddress.toLowerCase().includes(search.toLowerCase());

    const matchesZone = zoneFilter === 'All' || k.zone === zoneFilter;
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Online' && k.status !== 'Offline' && k.status !== 'Error') ||
      k.status === statusFilter;

    return matchesSearch && matchesZone && matchesStatus;
  });

  const handleRestartKiosk = async (e: React.MouseEvent, kioskId: string) => {
    e.stopPropagation();
    showToast(`Restart command dispatched to ${kioskId}. System initializing...`);
    try {
      await apiClient.restartKiosk(kioskId);
    } catch (err) {
      console.warn('Backend restart error', err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-nf-secondary font-medium mb-1.5">
              <Link href="/command-center" className="hover:text-nf-navy transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-nf-navy font-semibold">Kiosks</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nf-navy tracking-tight">
              Kiosk Fleet Operations
            </h1>
            <p className="text-xs md:text-sm text-nf-secondary mt-0.5">
              Real-time monitoring, telemetry, and administrative control for all 12 smart kiosks
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-nf-blue shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-nf-blue shadow-xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by Kiosk ID, IP, or location..."
              className="w-full bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-nf-blue/20 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Zone Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['All', 'Zone A', 'Zone B', 'Zone C'].map((z) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoneFilter(z)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    zoneFilter === z
                      ? 'bg-white text-nf-navy shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>

            {/* Status Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {['All', 'Online', 'Error'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-white text-nf-navy shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Content: Grid or Table */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredKiosks.map((kiosk) => {
              const isError = kiosk.status === 'Error';
              const isWarning = kiosk.id === 'K03';
              const isBusy = kiosk.currentJobId !== undefined;

              return (
                <div
                  key={kiosk.id}
                  onClick={() => {
                    setSelectedKiosk(kiosk);
                    router.push(`/kiosks/${kiosk.id}`);
                  }}
                  className={`bg-white rounded-2xl border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer flex flex-col justify-between group ${
                    isError
                      ? 'border-red-300 ring-2 ring-red-100'
                      : isWarning
                      ? 'border-amber-300'
                      : 'border-nf-border hover:border-nf-blue/40'
                  }`}
                >
                  <div>
                    {/* Top Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isError
                              ? 'bg-red-100 text-red-600'
                              : isWarning
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <Monitor className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-base font-extrabold text-nf-navy group-hover:text-nf-blue transition-colors block leading-tight">
                            {kiosk.id}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {kiosk.ipAddress}
                          </span>
                        </div>
                      </div>

                      {/* Status Pill */}
                      {isError ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold border border-red-200">
                          ● Error
                        </span>
                      ) : isWarning ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          ● Warning
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          ● Online
                        </span>
                      )}
                    </div>

                    {/* Zone Info */}
                    <div className="py-3 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Zone Location</span>
                      <span className="font-bold text-slate-800">
                        {kiosk.zone} ({kiosk.zoneLabel})
                      </span>
                    </div>

                    {/* Current Job or Idle */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs my-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Current Activity
                      </span>
                      {kiosk.currentJobId ? (
                        <div className="mt-1">
                          <span className="font-bold text-nf-blue text-xs block truncate">
                            {kiosk.currentJobId} • {kiosk.currentJobDocument}
                          </span>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                              className="bg-nf-blue h-1.5 rounded-full"
                              style={{ width: `${kiosk.currentJobProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : isError ? (
                        <span className="font-bold text-red-600 text-xs block mt-0.5">
                          Paper Jam in Tray 2
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs italic block mt-0.5">
                          Idle • Ready for print spool
                        </span>
                      )}
                    </div>

                    {/* Telemetry Gauge Indicators */}
                    <div className="grid grid-cols-3 gap-2 py-3 text-center text-xs">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold">TEMP</span>
                        <span
                          className={`font-extrabold text-xs mt-0.5 block ${
                            kiosk.temperature > 40 ? 'text-amber-600' : 'text-slate-800'
                          }`}
                        >
                          {kiosk.temperature}°C
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold">PAPER</span>
                        <span className="font-extrabold text-xs text-slate-800 mt-0.5 block">
                          {kiosk.paperLevel}%
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block font-semibold">INK</span>
                        <span className="font-extrabold text-xs text-slate-800 mt-0.5 block">
                          {kiosk.inkLevel}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      Queue: <strong>{kiosk.queueLength}</strong>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleRestartKiosk(e, kiosk.id)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-nf-blue transition-colors"
                      title="Reboot Kiosk"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-2xl border border-nf-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-nf-border">
                    <th className="py-3 px-5">Kiosk ID</th>
                    <th className="py-3 px-5">Zone</th>
                    <th className="py-3 px-5">IP Address</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Current Job</th>
                    <th className="py-3 px-5">Queue</th>
                    <th className="py-3 px-5">Total Prints</th>
                    <th className="py-3 px-5">Telemetry</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {filteredKiosks.map((kiosk) => (
                    <tr
                      key={kiosk.id}
                      onClick={() => router.push(`/kiosks/${kiosk.id}`)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-nf-blue">{kiosk.id}</span>
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-800">
                        {kiosk.zone} ({kiosk.zoneLabel})
                      </td>
                      <td className="py-4 px-5 font-mono text-slate-500">{kiosk.ipAddress}</td>
                      <td className="py-4 px-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1.5 ${
                            kiosk.status === 'Error'
                              ? 'bg-red-50 text-red-600 border border-red-200'
                              : kiosk.id === 'K03'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          ● {kiosk.status}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        {kiosk.currentJobDocument || <span className="text-slate-400">Idle</span>}
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-800">{kiosk.queueLength}</td>
                      <td className="py-4 px-5 text-slate-600">
                        {kiosk.totalPrints.toLocaleString()}
                      </td>
                      <td className="py-4 px-5 text-[11px] text-slate-500">
                        {kiosk.temperature}°C • Paper {kiosk.paperLevel}% • Ink {kiosk.inkLevel}%
                      </td>
                      <td className="py-4 px-5 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

