'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ChevronRight } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export function RecentPrintJobsTable() {
  const { orders, selectKioskById } = useApp();
  const recentOrders = orders.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Printing':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Printing
          </span>
        );
      case 'Completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'Queued':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold flex items-center gap-1.5 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Queued
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold w-fit">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card flex flex-col justify-between h-full min-h-[380px]">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-nf-border/60">
        <h2 className="text-base font-bold text-nf-navy">Recent Print Jobs</h2>
        <Link
          href="/orders"
          className="text-xs font-semibold text-nf-blue hover:text-nf-blue-hover flex items-center gap-1 transition-colors"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto mt-2 flex-1">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-bold text-slate-400 border-b border-slate-100">
              <th className="py-2.5 font-bold">Job ID</th>
              <th className="py-2.5 font-bold">Document</th>
              <th className="py-2.5 font-bold">Kiosk</th>
              <th className="py-2.5 font-bold">Status</th>
              <th className="py-2.5 font-bold min-w-[120px]">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-medium">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Job ID */}
                  <td className="py-3 pr-2">
                    <Link
                      href={`/orders/${order.id.replace('#', '')}`}
                      className="font-bold text-nf-blue hover:underline"
                    >
                      {order.id}
                    </Link>
                  </td>

                  {/* Document with File Icon */}
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 max-w-[180px]">
                      <div className="w-5 h-5 rounded bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-slate-800 truncate" title={order.documentName}>
                        {order.documentName}
                      </span>
                    </div>
                  </td>

                  {/* Assigned Kiosk */}
                  <td className="py-3 pr-2">
                    <button
                      type="button"
                      onClick={() => selectKioskById(order.kioskId)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-xs transition-colors"
                      title={`Select ${order.kioskId} in 3D Center`}
                    >
                      {order.kioskId}
                    </button>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 pr-4">{getStatusBadge(order.status)}</td>

                  {/* Progress Bar & Percentage */}
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            order.status === 'Completed'
                              ? 'bg-emerald-500'
                              : order.status === 'Queued'
                              ? 'bg-amber-400'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${order.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 w-9 text-right">
                        {order.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-xs text-slate-400 font-medium">
                  No active print jobs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

