'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export function ActiveIncidentsCard() {
  const { incidents, activities, selectKioskById } = useApp();

  const openIncidents = incidents.filter((i) => i.status === 'Open').slice(0, 2);
  const recentActivities = activities.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card flex flex-col justify-between h-full min-h-[380px]">
      {/* 1. Active Incidents Section */}
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-nf-border/60">
          <h2 className="text-base font-bold text-nf-navy">Active Incidents</h2>
          <Link
            href="/incidents"
            className="text-xs font-semibold text-nf-blue hover:text-nf-blue-hover flex items-center gap-1 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3 mt-3">
          {openIncidents.length > 0 ? (
            openIncidents.map((incident) => {
              const isError = incident.severity === 'Error';
              return (
                <div
                  key={incident.id}
                  className="flex items-center justify-between group cursor-pointer"
                  onClick={() => selectKioskById(incident.kioskId)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${
                        isError
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {incident.severity}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors block leading-tight truncate">
                        {incident.kioskId} - {incident.zone}
                      </span>
                      <span className="text-[11px] text-slate-500 block leading-tight mt-0.5 truncate">
                        {incident.title}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap ml-2">
                    {incident.timeAgo}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-slate-400 font-medium">
              No active incidents reported.
            </div>
          )}
        </div>
      </div>

      {/* 2. Recent Activity Section matching reference */}
      <div className="pt-3.5 border-t border-nf-border/60 mt-4">
        <div className="flex items-center justify-between pb-2.5">
          <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Recent Activity
          </h3>
          <Link
            href="/audit-logs"
            className="text-xs font-semibold text-nf-blue hover:text-nf-blue-hover flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
          </Link>
        </div>

        <div className="space-y-2.5 mt-1">
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => {
              const circleColor =
                act.type === 'error'
                  ? 'bg-red-100 text-red-600 border border-red-200'
                  : act.kioskId === 'K05'
                  ? 'bg-purple-100 text-purple-600 border border-purple-200'
                  : 'bg-blue-100 text-blue-600 border border-blue-200';

              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between group cursor-pointer text-xs"
                  onClick={() => selectKioskById(act.kioskId)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${circleColor}`}
                    >
                      {act.kioskId}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors block truncate">
                        {act.action}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap ml-2">
                    {act.timeAgo}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-slate-400 font-medium">
              No recent activity recorded.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

