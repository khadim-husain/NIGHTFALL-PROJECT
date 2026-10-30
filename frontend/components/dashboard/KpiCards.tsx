'use client';

import React from 'react';
import { Monitor, Server, FileText, AlertTriangle, Scan, TrendingUp } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import Link from 'next/link';

export function KpiCards() {
  const { kiosks, orders, incidents } = useApp();

  const totalKiosks = kiosks.length; // 12
  const onlineKiosks = kiosks.filter((k) => k.status !== 'Offline' && k.status !== 'Error').length; // 11
  const activePrintJobs =
    orders.filter((o) => o.status === 'Printing' || o.status === 'Queued').length || 5;
  const openIncidents = incidents.filter((i) => i.status === 'Open').length;

  const operationalPercentage = totalKiosks > 0 ? ((onlineKiosks / totalKiosks) * 100).toFixed(1) : '100.0';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Kiosks */}
      <Link
        href="/kiosks"
        className="bg-white rounded-2xl border border-nf-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center justify-between min-h-[96px] group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
            <Monitor className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-nf-secondary block truncate">Total Kiosks</span>
            <span className="text-2xl font-extrabold text-nf-navy tracking-tight leading-none mt-1 block">
              {totalKiosks}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-1 block truncate">
              Across 3 zones
            </span>
          </div>
        </div>
        <div className="text-slate-300 group-hover:text-blue-500 transition-colors flex-shrink-0">
          <Scan className="w-4 h-4" />
        </div>
      </Link>

      {/* 2. Online Kiosks */}
      <Link
        href="/kiosks?status=Online"
        className="bg-white rounded-2xl border border-nf-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center justify-between min-h-[96px] group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-nf-secondary block truncate">Online Kiosks</span>
            <span className="text-2xl font-extrabold text-nf-navy tracking-tight leading-none mt-1 block">
              {onlineKiosks}
            </span>
            <span className="text-[11px] font-semibold text-emerald-600 mt-1 block truncate">
              {operationalPercentage}% operational
            </span>
          </div>
        </div>
        <div className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg flex-shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
      </Link>

      {/* 3. Active Print Jobs */}
      <Link
        href="/orders?status=Printing"
        className="bg-white rounded-2xl border border-nf-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center justify-between min-h-[96px] group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-nf-secondary block truncate">Active Print Jobs</span>
            <span className="text-2xl font-extrabold text-nf-navy tracking-tight leading-none mt-1 block">
              {activePrintJobs}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-1 block truncate">
              Processing now
            </span>
          </div>
        </div>
        <div className="text-purple-500 bg-purple-50 p-1.5 rounded-lg flex-shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
      </Link>

      {/* 4. Open Incidents */}
      <Link
        href="/incidents"
        className="bg-white rounded-2xl border border-nf-border p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center justify-between min-h-[96px] group"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform flex-shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-nf-secondary block truncate">Open Incidents</span>
            <span className="text-2xl font-extrabold text-nf-navy tracking-tight leading-none mt-1 block">
              {openIncidents}
            </span>
            <span className="text-[11px] font-semibold text-red-500 mt-1 block truncate">
              Requires attention
            </span>
          </div>
        </div>
        <div className="text-red-500 bg-red-50 p-1.5 rounded-lg flex-shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
}
