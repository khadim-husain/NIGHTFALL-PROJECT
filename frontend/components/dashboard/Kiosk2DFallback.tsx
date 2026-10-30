'use client';

import React from 'react';
import { useApp } from '@/lib/AppContext';
import { Printer, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export function Kiosk2DFallback() {
  const { kiosks, selectedKiosk, setSelectedKiosk, selectedZone, selectedStatus, zoomLevel } = useApp();

  const filteredKiosks = kiosks.filter((k) => {
    const matchZone = selectedZone === 'All Zones' || k.zone === selectedZone;
    const matchStatus =
      selectedStatus === 'All Statuses' ||
      (selectedStatus === 'Online' && k.status !== 'Offline' && k.status !== 'Error') ||
      k.status === selectedStatus;
    return matchZone && matchStatus;
  });

  return (
    <div className="w-full h-full p-6 flex flex-col justify-between bg-gradient-to-b from-slate-50 to-white select-none overflow-hidden">
      {/* 2D Architectural Layout Container */}
      <div
        className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-stretch transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
      >
        {/* Zone A: Front Lobby */}
        <div className="rounded-2xl border-2 border-blue-400/40 bg-blue-50/20 p-4 flex flex-col justify-between relative shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
              Zone A • Front Lobby
            </span>
            <span className="text-[11px] text-blue-700 font-semibold">4 Kiosks</span>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 items-center">
            {kiosks
              .filter((k) => k.zone === 'Zone A')
              .map((k) => {
                const isSelected = selectedKiosk.id === k.id;
                const isWarning = k.id === 'K03';
                return (
                  <button
                    key={k.id}
                    onClick={() => setSelectedKiosk(k)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105 ring-4 ring-blue-100'
                        : isWarning
                        ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-extrabold text-sm">{k.id}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-blue-100' : 'text-slate-500'
                      }`}
                    >
                      {k.status}
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="text-[10px] text-slate-400 text-center mt-2">
            Main Entrance & Visitor Walk-in
          </div>
        </div>

        {/* Zone B: Main Floor */}
        <div className="rounded-2xl border-2 border-purple-400/40 bg-purple-50/20 p-4 flex flex-col justify-between relative shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold text-xs shadow-xs">
              Zone B • Main Floor
            </span>
            <span className="text-[11px] text-purple-700 font-semibold">4 Kiosks</span>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 items-center">
            {kiosks
              .filter((k) => k.zone === 'Zone B')
              .map((k) => {
                const isSelected = selectedKiosk.id === k.id;
                const isPrinting = k.id === 'K05';
                return (
                  <button
                    key={k.id}
                    onClick={() => setSelectedKiosk(k)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md scale-105 ring-4 ring-purple-100'
                        : isPrinting
                        ? 'bg-blue-50 border-blue-400 text-blue-900 animate-pulse'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-purple-300 hover:bg-purple-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-extrabold text-sm">{k.id}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isPrinting ? 'bg-blue-500' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-purple-100' : 'text-slate-500'
                      }`}
                    >
                      {isPrinting ? 'Printing 68%' : k.status}
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="text-[10px] text-slate-400 text-center mt-2">
            Central Staff & General Print Fleet
          </div>
        </div>

        {/* Zone C: Production */}
        <div className="rounded-2xl border-2 border-teal-400/40 bg-teal-50/20 p-4 flex flex-col justify-between relative shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="px-3 py-1 rounded-lg bg-teal-600 text-white font-bold text-xs shadow-xs">
              Zone C • Production
            </span>
            <span className="text-[11px] text-teal-700 font-semibold">4 Kiosks</span>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1 items-center">
            {kiosks
              .filter((k) => k.zone === 'Zone C')
              .map((k) => {
                const isSelected = selectedKiosk.id === k.id;
                const isError = k.id === 'K12';
                return (
                  <button
                    key={k.id}
                    onClick={() => setSelectedKiosk(k)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-md scale-105 ring-4 ring-teal-100'
                        : isError
                        ? 'bg-red-50 border-red-400 text-red-700 hover:bg-red-100'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-extrabold text-sm">{k.id}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isError ? 'bg-red-500 animate-ping' : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-[10px] ${
                        isSelected ? 'text-teal-100' : isError ? 'text-red-600 font-bold' : 'text-slate-500'
                      }`}
                    >
                      {k.status}
                    </span>
                  </button>
                );
              })}
          </div>

          <div className="text-[10px] text-slate-400 text-center mt-2">
            High-Speed Commercial Duplex Line
          </div>
        </div>
      </div>
    </div>
  );
}

