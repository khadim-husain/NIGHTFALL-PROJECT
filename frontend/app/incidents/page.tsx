'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/lib/AppContext';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Check,
  RotateCcw,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { Incident } from '@/lib/types';

export default function IncidentsPage() {
  const { incidents, resolveIncident, selectKioskById, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | 'Open' | 'Resolved'>('Open');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Error' | 'Warning' | 'Info'>('All');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const filteredIncidents = incidents.filter((inc) => {
    const matchesTab = activeTab === 'All' || inc.status === activeTab;
    const matchesSeverity = severityFilter === 'All' || inc.severity === severityFilter;
    return matchesTab && matchesSeverity;
  });

  const handleResolve = (id: string) => {
    resolveIncident(id);
    setSelectedIncident(null);
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
              <span className="text-nf-navy font-semibold">Incidents</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nf-navy tracking-tight">
              Incident Response & Health Alerts
            </h1>
            <p className="text-xs md:text-sm text-nf-secondary mt-0.5">
              Triage hardware alerts, paper stalls, temperature spikes, and maintenance tickets
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span>{incidents.filter((i) => i.status === 'Open').length} Active Issues</span>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {(['All', 'Open', 'Resolved'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-white text-nf-navy shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Severity Pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Severity:</span>
            {(['All', 'Error', 'Warning', 'Info'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  severityFilter === sev
                    ? 'bg-nf-blue text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Incidents Table / Cards */}
        <div className="bg-white rounded-2xl border border-nf-border shadow-card overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredIncidents.length > 0 ? (
              filteredIncidents.map((inc) => {
                const isError = inc.severity === 'Error';
                const isWarning = inc.severity === 'Warning';
                const isOpen = inc.status === 'Open';

                return (
                  <div
                    key={inc.id}
                    className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* Severity icon box */}
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isError
                            ? 'bg-red-100 text-red-600'
                            : isWarning
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-600'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isError
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : isWarning
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {inc.severity}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-400">
                            {inc.id}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-bold text-slate-700">
                            {inc.kioskId} ({inc.zone})
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">{inc.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                          {inc.description}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                          <span>Reported {inc.timeAgo}</span>
                          <span>•</span>
                          <span>Source: {inc.reportedBy}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex items-center gap-2.5 self-end md:self-center">
                      <Link
                        href={`/kiosks/${inc.kioskId}`}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Inspect {inc.kioskId}
                      </Link>

                      {isOpen ? (
                        <button
                          type="button"
                          onClick={() => handleResolve(inc.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Resolve Issue</span>
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-slate-400 text-xs">
                No incidents found for the selected filter.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

