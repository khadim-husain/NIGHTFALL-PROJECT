'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/lib/AppContext';
import {
  Search,
  Plus,
  FileText,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { OrderStatus } from '@/lib/types';

export default function OrdersPage() {
  const router = useRouter();
  const { orders } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.documentName.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.toLowerCase().includes(search.toLowerCase()) ||
      order.kioskId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-nf-secondary font-medium mb-1.5">
              <Link href="/command-center" className="hover:text-nf-navy transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-nf-navy font-semibold">Orders</span>
            </nav>
            <h1 className="text-2xl md:text-3xl font-extrabold text-nf-navy tracking-tight">
              Order Management
            </h1>
            <p className="text-xs md:text-sm text-nf-secondary mt-0.5">
              View, search, and manage all customer print orders across the kiosk fleet
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/orders/new"
              className="px-4 py-2.5 bg-nf-blue hover:bg-nf-blue-hover text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Order</span>
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by Order ID, document, user..."
              className="w-full bg-slate-50 text-xs font-medium text-slate-800 placeholder-slate-400 pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-nf-blue/20 focus:bg-white transition-all"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {['All', 'Printing', 'Completed', 'Queued'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-nf-blue text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-nf-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-nf-border">
                  <th className="py-3 px-5">Order ID</th>
                  <th className="py-3 px-5">Document</th>
                  <th className="py-3 px-5">Customer</th>
                  <th className="py-3 px-5">Kiosk</th>
                  <th className="py-3 px-5">Created</th>
                  <th className="py-3 px-5">Payment</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Amount</th>
                  <th className="py-3 px-5 min-w-[130px]">Progress</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/orders/${order.id.replace('#', '')}`)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                    >
                      {/* ID */}
                      <td className="py-4 px-5">
                        <span className="font-extrabold text-nf-blue">{order.id}</span>
                      </td>

                      {/* Document */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-slate-900 block truncate" title={order.documentName}>
                              {order.documentName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {order.fileSize} • {order.pageCount} pgs • {order.colorMode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-4 px-5">
                        <span className="font-semibold text-slate-800 block">
                          {order.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {order.customerEmail}
                        </span>
                      </td>

                      {/* Kiosk */}
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs">
                          {order.kioskId}
                        </span>
                      </td>

                      {/* Created */}
                      <td className="py-4 px-5 text-slate-500 whitespace-nowrap">
                        {order.createdAt}
                      </td>

                      {/* Payment */}
                      <td className="py-4 px-5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          ● {order.paymentStatus}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        {order.status === 'Printing' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Printing
                          </span>
                        )}
                        {order.status === 'Completed' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        )}
                        {order.status === 'Queued' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Queued
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-4 px-5 font-bold text-slate-900">
                        ${order.totalAmount.toFixed(2)}
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                order.status === 'Completed'
                                  ? 'bg-emerald-500'
                                  : 'bg-nf-blue'
                              }`}
                              style={{ width: `${order.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            {order.progress}%
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id.replace('#', '')}`);
                          }}
                          className="p-1 text-slate-400 hover:text-nf-blue transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      No print orders matching your filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
            <span>
              Showing {filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-nf-navy">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

