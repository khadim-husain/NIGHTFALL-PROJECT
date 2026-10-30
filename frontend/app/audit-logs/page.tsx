'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/lib/AppContext';
import {
  FileCode,
  Search,
  Filter,
  ChevronRight,
  ShieldCheck,
  Eye,
  Download,
  X,
  Code,
} from 'lucide-react';
import { AuditLog } from '@/lib/types';

export default function AuditLogsPage() {
  const { auditLogs, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    return (
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor.toLowerCase().includes(search.toLowerCase()) ||
      log.resource.toLowerCase().includes(search.toLowerCase()) ||
      log.ipAddress.includes(search)
    );
  });

  const handleExport = () => {
    try {
      showToast('Generating compliance audit log CSV...');
      const headers = ['Log ID', 'Timestamp', 'Actor', 'Actor Role', 'Action', 'Resource Target', 'Status', 'IP Address', 'Payload Details'];
      const rows = filteredLogs.map((log) => [
        `"${log.id}"`,
        `"${log.timestamp}"`,
        `"${log.actor}"`,
        `"${log.actorRole}"`,
        `"${log.action}"`,
        `"${log.resource}"`,
        `"${log.status}"`,
        `"${log.ipAddress}"`,
        `"${JSON.stringify(log.payload || {}).replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nightfall-audit-logs-${new Date().toISOString().substring(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      showToast(`Exported ${filteredLogs.length} audit records to CSV.`);
    } catch {
      showToast('Export failed. Please try again.');
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
              <span className="text-nf-navy font-semibold">Audit Logs</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nf-navy tracking-tight">
              Administrative Audit Logs
            </h1>
            <p className="text-xs md:text-sm text-nf-secondary mt-0.5">
              Immutable ledger of operator actions, kiosk commands, and security authorizations
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl flex items-center gap-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, actor email, or resource..."
              className="w-full bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-nf-blue/20 focus:bg-white transition-all"
            />
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            Showing <strong>{filteredLogs.length}</strong> events
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white rounded-2xl border border-nf-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-nf-border">
                  <th className="py-3 px-5">Event ID</th>
                  <th className="py-3 px-5">Timestamp</th>
                  <th className="py-3 px-5">Actor</th>
                  <th className="py-3 px-5">Action Type</th>
                  <th className="py-3 px-5">Target Resource</th>
                  <th className="py-3 px-5">Client IP</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-600">{log.id}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{log.timestamp}</td>
                    <td className="py-3.5 px-5">
                      <span className="font-bold text-slate-900 block">{log.actor}</span>
                      <span className="text-[10px] text-slate-400 block">{log.actorRole}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-nf-blue bg-blue-50 px-2 py-0.5 rounded-md text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 font-bold text-slate-800">{log.resource}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-500">{log.ipAddress}</td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1 text-slate-400 hover:text-nf-blue rounded-lg hover:bg-blue-50 transition-colors"
                        title="View JSON Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* JSON Inspector Modal */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-dropdown border border-nf-border max-w-lg w-full p-6 animate-slide-up space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-nf-blue" />
                  <span className="text-sm font-bold text-nf-navy">
                    Audit Payload: {selectedLog.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-1">
                <div>
                  <strong>Action:</strong> {selectedLog.action}
                </div>
                <div>
                  <strong>Actor:</strong> {selectedLog.actor} ({selectedLog.actorRole})
                </div>
                <div>
                  <strong>Resource:</strong> {selectedLog.resource}
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto max-h-60">
                <pre>{JSON.stringify(selectedLog.payload || {}, null, 2)}</pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

