'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  RotateCcw,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { Kiosk2DFallback } from './Kiosk2DFallback';

// Dynamically import 3D canvas with SSR disabled to prevent hydration mismatch
const Kiosk3DScene = dynamic(
  () => import('./Kiosk3DScene').then((mod) => mod.Kiosk3DScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-3 min-h-[400px]">
        <div className="w-8 h-8 border-3 border-nf-blue border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-600">
          Loading 3D Smart Facility...
        </span>
      </div>
    ),
  }
);

export function OperationsCenterCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    selectedZone,
    setSelectedZone,
    selectedStatus,
    setSelectedStatus,
    resetFilters,
    viewMode,
    setViewMode,
    zoomLevel,
    setZoomLevel,
  } = useApp();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(Math.round((z + 0.25) * 100) / 100, 2.5));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(Math.round((z - 0.25) * 100) / 100, 0.5));
  const handleFitView = () => {
    setZoomLevel(1);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nightfall:fit-view'));
    }
  };

  const handlePan = (dx: number, dz: number) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nightfall:pan-view', { detail: { dx, dz } }));
    }
  };

  const toggleFullscreen = () => {
    if (!cardRef.current) return;
    if (!document.fullscreenElement) {
      cardRef.current.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-2xl border border-nf-border shadow-card overflow-hidden flex flex-col transition-all ${isFullscreen ? 'h-screen w-screen fixed inset-0 z-50 rounded-none' : 'h-[540px]'
        } relative group`}
    >
      {/* Top Filter & Control Toolbar */}
      <div className="px-4 py-3 border-b border-nf-border bg-white flex flex-wrap items-center justify-between gap-3 z-10 flex-shrink-0">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zone Filter */}
          <div className="relative">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-nf-navy py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-nf-blue/20 cursor-pointer transition-colors"
            >
              <option value="All Zones">All Zones</option>
              <option value="Zone A">Zone A (Front Lobby)</option>
              <option value="Zone B">Zone B (Main Floor)</option>
              <option value="Zone C">Zone C (Production)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-nf-navy py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-nf-blue/20 cursor-pointer transition-colors"
            >
              <option value="All Statuses">All Statuses</option>
              <option value="Online">Online</option>
              <option value="Idle">Idle</option>
              <option value="Busy">Busy</option>
              <option value="Error">Error</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters Button */}
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>

        {/* Right View Mode Controls */}
        <div className="flex items-center gap-2">
          {/* 3D / 2D Toggle Pill */}
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === '3D'
                  ? 'bg-nf-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-nf-navy'
                }`}
            >
              3D
            </button>
            <button
              type="button"
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === '2D'
                  ? 'bg-nf-blue text-white shadow-xs'
                  : 'text-slate-600 hover:text-nf-navy'
                }`}
            >
              2D
            </button>
          </div>

          {/* Fit View Button */}
          <button
            type="button"
            onClick={handleFitView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
            title="Reset camera and isometric framing"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Fit View</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5 text-slate-500" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full'}</span>
          </button>
        </div>
      </div>

      {/* Main Visualization Canvas or 2D Blueprint */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-gradient-to-b from-[#EFF5FB] to-[#E5EDF7]">
        {viewMode === '3D' ? <Kiosk3DScene /> : <Kiosk2DFallback />}

        {/* Floating Zoom Controls (Top-Left) */}
        <div className="absolute left-4 top-4 flex flex-col items-center gap-1.5 z-10 select-none">
          {/* Zoom In Button */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white active:bg-blue-50 text-slate-700 hover:text-nf-blue shadow-card border border-slate-200 flex items-center justify-center transition-all hover:scale-105"
            title="Zoom In (+25%)"
            aria-label="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Interactive Zoom Level Pill Badge */}
          <button
            type="button"
            onClick={handleFitView}
            className="px-2 py-0.5 rounded-lg bg-white/95 hover:bg-blue-50 text-[10px] font-extrabold text-slate-700 hover:text-nf-blue border border-slate-200 shadow-xs text-center transition-all cursor-pointer min-w-[42px]"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-xl bg-white/95 hover:bg-white active:bg-blue-50 text-slate-700 hover:text-nf-blue shadow-card border border-slate-200 flex items-center justify-center transition-all hover:scale-105"
            title="Zoom Out (-25%)"
            aria-label="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* D-Pad Compass Controller (Bottom-Left) */}
        <div className="absolute left-4 bottom-4 z-10">
          <div className="w-14 h-14 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200 shadow-card flex items-center justify-center relative p-1">
            <button
              type="button"
              onClick={() => handlePan(0, -1)}
              title="Pan Forward"
              className="absolute top-1 p-0.5 text-slate-400 hover:text-nf-blue"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePan(0, 1)}
              title="Pan Backward"
              className="absolute bottom-1 p-0.5 text-slate-400 hover:text-nf-blue"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePan(-1, 0)}
              title="Pan Left"
              className="absolute left-1 p-0.5 text-slate-400 hover:text-nf-blue"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePan(1, 0)}
              title="Pan Right"
              className="absolute right-1 p-0.5 text-slate-400 hover:text-nf-blue"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFitView}
              title="Recenter"
              className="w-4 h-4 rounded-full bg-slate-100 hover:bg-blue-100 border border-slate-300 flex items-center justify-center text-[8px] font-bold text-slate-500 hover:text-nf-blue"
            >
              •
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
