'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Monitor, AlertTriangle, Settings, Activity } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export function QuickActionsFooter() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6 items-stretch">
      {/* 1. Quick Actions Buttons (col-span-5) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-nf-border p-5 shadow-card flex flex-col justify-between">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
          Quick Actions
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {/* New Order */}
          <Link
            href="/orders/new"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </Link>

          {/* Manage Kiosks */}
          <Link
            href="/kiosks"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            <Monitor className="w-3.5 h-3.5 text-slate-500" />
            <span>Manage Kiosks</span>
          </Link>

          {/* View Incidents */}
          <Link
            href="/incidents"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
            <span>View Incidents</span>
          </Link>

          {/* System Settings */}
          <Link
            href="/settings"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>System Settings</span>
          </Link>
        </div>
      </div>

      {/* 2. Connection Status & System Uptime (col-span-4) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-nf-border p-5 shadow-card flex items-center justify-between">
        {/* Connection Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="w-5 h-5 rounded-full bg-emerald-400/20 absolute -inset-1" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              Connection Status
            </span>
            <span className="text-xs font-bold text-slate-800 block">
              Backend Connected
            </span>
            <span className="text-[10px] text-slate-400 font-medium">API v1.0.0</span>
          </div>
        </div>

        <div className="h-10 w-px bg-slate-100" />

        {/* System Uptime */}
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block">
              System Uptime
            </span>
            <span className="text-base font-extrabold text-nf-navy block">
              99.8%
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Last 24 hours</span>
          </div>

          {/* Sparkline Wave SVG */}
          <div className="w-16 h-8 text-emerald-500">
            <svg viewBox="0 0 60 28" fill="none" className="w-full h-full">
              <path
                d="M2 20L12 18L22 22L32 10L42 14L52 6L58 8"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 3. Nightfall Nexus Brand Banner (col-span-3) */}
      <div className="lg:col-span-3 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] p-5 text-white shadow-card relative overflow-hidden flex flex-col justify-center">
        {/* Aurora Glow background */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-blue-500/30 blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black tracking-wider text-blue-400 uppercase">
              NIGHTFALL NEXUS
            </span>
          </div>
          <p className="text-xs font-medium text-slate-300">
            Smarter Printing. A Brighter Future.
          </p>
        </div>
      </div>
    </div>
  );
}

