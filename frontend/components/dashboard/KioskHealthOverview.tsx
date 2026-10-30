'use client';

import React from 'react';
import Link from 'next/link';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export function KioskHealthOverview() {
  const { kiosks } = useApp();

  // Dynamic distribution calculations from current state
  const total = kiosks.length;
  const onlineCount = kiosks.filter((k) => k.status !== 'Offline' && k.status !== 'Error').length;
  const idleCount = kiosks.filter((k) => !k.currentJobId && k.status === 'Online').length;
  const busyCount = kiosks.filter((k) => k.currentJobId || k.status === 'Busy').length;
  const offlineCount = kiosks.filter((k) => k.status === 'Offline').length;
  const errorCount = kiosks.filter((k) => k.status === 'Error').length;

  const data = [
    { name: 'Online', value: onlineCount, color: '#06B6D4' },
    { name: 'Idle', value: idleCount, color: '#38BDF8' },
    { name: 'Busy', value: busyCount, color: '#F59E0B' },
    { name: 'Offline', value: offlineCount || 1, color: '#64748B' },
    { name: 'Error', value: errorCount || 1, color: '#EF4444' },
  ];

  const zoneA = kiosks.filter((k) => k.zone === 'Zone A').length;
  const zoneB = kiosks.filter((k) => k.zone === 'Zone B').length;
  const zoneC = kiosks.filter((k) => k.zone === 'Zone C').length;

  return (
    <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card flex flex-col justify-between h-full min-h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-nf-border/60">
        <h2 className="text-base font-bold text-nf-navy">Kiosk Health Overview</h2>
        <Link
          href="/kiosks"
          className="text-xs font-semibold text-nf-blue hover:text-nf-blue-hover flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Center Donut Chart and Legend */}
      <div className="py-2 flex items-center justify-between gap-2">
        {/* Donut Chart Container with Center Label */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(val: any) => [`${val} kiosks`]}
                contentStyle={{
                  backgroundColor: '#0F172A',
                  color: '#FFF',
                  borderRadius: '8px',
                  fontSize: '11px',
                  border: 'none',
                }}
              />
              <Pie
                data={data}
                innerRadius={46}
                outerRadius={62}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-extrabold text-nf-navy leading-none">
              {total}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Total Kiosks
            </span>
          </div>
        </div>

        {/* Legend List matching reference */}
        <div className="space-y-1.5 text-xs font-medium flex-1 pl-2 sm:pl-4 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] flex-shrink-0" />
              <span className="truncate">Online</span>
            </div>
            <span className="font-bold text-nf-navy ml-2">{onlineCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] flex-shrink-0" />
              <span className="truncate">Idle</span>
            </div>
            <span className="font-bold text-nf-navy ml-2">{idleCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
              <span className="truncate">Busy</span>
            </div>
            <span className="font-bold text-nf-navy ml-2">{busyCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] flex-shrink-0" />
              <span className="truncate">Offline</span>
            </div>
            <span className="font-bold text-nf-navy ml-2">{offlineCount || 1}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-600 truncate">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] flex-shrink-0" />
              <span className="truncate">Error</span>
            </div>
            <span className="font-bold text-nf-navy ml-2">{errorCount || 1}</span>
          </div>
        </div>
      </div>

      {/* Bottom Zone Distribution matching reference */}
      <div className="pt-3 border-t border-nf-border/60">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Zone Distribution
        </span>
        <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 text-[11px]">Zone A</span>
              <span className="text-blue-600 font-bold">{zoneA}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-blue-600 h-1.5 rounded-full w-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 text-[11px]">Zone B</span>
              <span className="text-purple-600 font-bold">{zoneB}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-purple-600 h-1.5 rounded-full w-full" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-500 text-[11px]">Zone C</span>
              <span className="text-teal-600 font-bold">{zoneC}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className="bg-teal-600 h-1.5 rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

