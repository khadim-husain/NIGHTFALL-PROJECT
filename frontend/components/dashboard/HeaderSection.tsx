'use client';

import React, { useState } from 'react';
import { Calendar, Clock, RotateCcw, ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import Link from 'next/link';

export function HeaderSection() {
  const { lastUpdated, refreshData } = useApp();
  const [isRotating, setIsRotating] = useState(false);

  const handleRefresh = () => {
    setIsRotating(true);
    refreshData();
    setTimeout(() => setIsRotating(false), 800);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 select-none">
      {/* Left: Breadcrumb and Title */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-nf-secondary font-medium mb-1.5">
          <Link href="/command-center" className="hover:text-nf-navy transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-nf-navy font-semibold">Command Center</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-extrabold text-nf-navy tracking-tight leading-none">
          Command Center
        </h1>
        <p className="text-xs md:text-sm text-nf-secondary mt-1">
          Monitor and manage your printing operations in real-time
        </p>
      </div>

      {/* Right: Date, Time & Live Telemetry Refresh on Same Row */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Date & Time Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-white border border-nf-border rounded-xl shadow-xs text-xs font-semibold text-nf-navy">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar className="w-3.5 h-3.5 text-nf-blue" />
            <span>Apr 27, 2025</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-nf-blue" />
            <span>14:32</span>
          </div>
        </div>

        {/* Live Telemetry Refresh Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-nf-border rounded-xl shadow-xs text-xs text-slate-500">
          <span className="font-medium">Updated {lastUpdated}</span>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1 text-slate-400 hover:text-nf-blue hover:bg-slate-50 rounded-lg transition-colors ml-0.5"
            title="Refresh Telemetry"
            aria-label="Refresh Telemetry"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin text-nf-blue' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
