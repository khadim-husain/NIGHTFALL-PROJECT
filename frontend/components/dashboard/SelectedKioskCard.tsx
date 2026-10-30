'use client';

import React from 'react';
import Link from 'next/link';
import { Monitor, X, ArrowRight } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export function SelectedKioskCard() {
  const { selectedKiosk, setSelectedKiosk, kiosks } = useApp();

  if (!selectedKiosk) return null;

  const isOnline = selectedKiosk.status !== 'Offline' && selectedKiosk.status !== 'Error';
  const isError = selectedKiosk.status === 'Error';
  const isWarning = selectedKiosk.id === 'K03';

  return (
    <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card flex flex-col justify-between h-[540px] overflow-hidden">
      {/* 1. Header (Kiosk ID + Status Badge + Cycle/Close) */}
      <div className="flex items-center justify-between pb-3 border-b border-nf-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Monitor className="w-4 h-4" />
          </div>
          <span className="text-xl font-extrabold text-nf-navy tracking-tight">
            {selectedKiosk.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isError ? (
            <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Error
            </span>
          ) : isWarning ? (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Warning
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Online
            </span>
          )}

          <button
            type="button"
            onClick={() => {
              const nextKiosk = kiosks.find((k) => k.id !== selectedKiosk.id) || kiosks[0];
              setSelectedKiosk(nextKiosk);
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
            title="Cycle Kiosk"
            aria-label="Cycle Kiosk"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Visual Graphic Artwork + Zone / IP Block */}
      <div className="py-3 flex items-center gap-3.5 border-b border-nf-border flex-shrink-0">
        {/* Isometric Kiosk Visual Artwork */}
        <div className="w-18 h-22 rounded-xl bg-gradient-to-b from-blue-50/80 to-slate-100 border border-blue-100 flex items-center justify-center p-2 relative shadow-inner overflow-hidden flex-shrink-0">
          <div className="w-9 h-14 bg-white rounded-md border border-slate-300 shadow-md relative flex flex-col items-center justify-between p-1">
            <div className="w-6 h-7 bg-blue-600 rounded-xs flex items-center justify-center">
              <span className="text-[7px] text-blue-200 font-bold leading-none">
                {selectedKiosk.id}
              </span>
            </div>
            <div className="w-5 h-1 bg-slate-300 rounded-full" />
            <div className="w-7 h-1.5 bg-slate-200 rounded-xs" />
          </div>
          <div className="w-3 h-3 rounded-full bg-blue-500/20 blur-xs absolute -bottom-1" />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-nf-navy truncate">
            {selectedKiosk.zone} • {selectedKiosk.zoneLabel}
          </span>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
            IP: {selectedKiosk.ipAddress}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-semibold">
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              {selectedKiosk.temperature}°C
            </span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              Paper {selectedKiosk.paperLevel}%
            </span>
            <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
              Ink {selectedKiosk.inkLevel}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Current Job Section */}
      <div className="py-3 border-b border-nf-border flex-shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
          Current Spool
        </span>

        {selectedKiosk.currentJobId ? (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-nf-blue font-bold truncate">{selectedKiosk.currentJobId}</span>
              <span className="text-[11px] text-slate-400 font-medium ml-2 flex-shrink-0">
                {selectedKiosk.currentJobTimeRemaining}
              </span>
            </div>
            <span className="text-xs font-bold text-nf-navy block truncate mt-0.5" title={selectedKiosk.currentJobDocument}>
              {selectedKiosk.currentJobDocument}
            </span>

            {/* Progress Bar */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                <span>Progress</span>
                <span className="text-nf-blue">{selectedKiosk.currentJobProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-nf-blue h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${selectedKiosk.currentJobProgress}%` }}
                />
              </div>
            </div>
          </div>
        ) : selectedKiosk.status === 'Error' ? (
          <div className="p-2.5 bg-red-50 rounded-xl border border-red-200">
            <span className="text-xs font-bold text-red-700 block truncate">
              {selectedKiosk.currentJobDocument || 'Optical Jam Alert'}
            </span>
            <span className="text-[11px] text-red-500 block mt-0.5 truncate">
              Tray optical sensor triggered halt
            </span>
          </div>
        ) : (
          <div className="py-1 text-xs text-slate-400 italic">
            Kiosk is idle and standing by for print jobs.
          </div>
        )}
      </div>

      {/* 4. Hardware Telemetry List */}
      <div className="py-2.5 space-y-1.5 text-xs flex-1 flex flex-col justify-center">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Status</span>
          <span className="font-bold text-nf-navy flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isError ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {selectedKiosk.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Last Seen</span>
          <span className="font-bold text-nf-navy">{selectedKiosk.lastSeen}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Queue Length</span>
          <span className="font-bold text-nf-navy">
            {selectedKiosk.queueLength} {selectedKiosk.queueLength === 1 ? 'job' : 'jobs'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Total Prints</span>
          <span className="font-bold text-nf-navy">
            {selectedKiosk.totalPrints.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 5. View Full Details Button */}
      <div className="pt-2 flex-shrink-0">
        <Link
          href={`/kiosks/${selectedKiosk.id}`}
          className="w-full py-2.5 px-4 bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors"
        >
          <span>View Full Kiosk Telemetry</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
