'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/lib/AppContext';
import { apiClient } from '@/lib/api-client';
import { PrintOrder } from '@/lib/types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  ArrowLeft,
  RotateCcw,
  Ban,
  Download,
  ShieldCheck,
  CreditCard,
  Building,
} from 'lucide-react';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { orders, kiosks, addOrder, refreshData, showToast } = useApp();

  const id = (params?.id as string) || '';
  const cleanId = id.replace('#', '').toLowerCase();

  const memoryOrder = orders.find(
    (o) => o.id.replace('#', '').toLowerCase() === cleanId
  );

  const [currentOrder, setCurrentOrder] = useState<PrintOrder | undefined>(memoryOrder);
  const [isLoading, setIsLoading] = useState(!memoryOrder);
  const [isReprinting, setIsReprinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Poll authoritative backend order state every 2.5s for real-time progress
  useEffect(() => {
    let active = true;
    async function fetchLiveOrder() {
      try {
        const live = await apiClient.getOrderById(cleanId);
        if (live && active) {
          setCurrentOrder(live);
          setIsLoading(false);
        }
      } catch {
        if (active) setIsLoading(false);
      }
    }

    fetchLiveOrder();
    const timer = setInterval(fetchLiveOrder, 2500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [cleanId]);

  // Also sync when socket updates memory orders
  useEffect(() => {
    const updated = orders.find((o) => o.id.replace('#', '').toLowerCase() === cleanId);
    if (updated) {
      setCurrentOrder((prev) => (prev ? { ...prev, ...updated } : updated));
    }
  }, [orders, cleanId]);

  const order = currentOrder || memoryOrder;
  const assignedKiosk = kiosks.find((k) => k.id === order?.kioskId);

  const handlePayNow = async () => {
    if (!order) return;
    setIsPaying(true);
    showToast(`Authorizing payment for ${order.id}...`);
    try {
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const res = await apiClient.simulatePayment(order.id, idempotencyKey, '4242');
      if (res?.order) {
        setCurrentOrder(res.order);
        addOrder(res.order);
      }
      showToast(`Payment authorized! Order ${order.id} spooled to printing queue.`);
      refreshData();
    } catch (err: any) {
      showToast(err?.message || 'Payment authorization failed.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleReprint = async () => {
    if (!order) return;
    setIsReprinting(true);
    showToast(`Submitting reprint request for ${order.id}...`);
    try {
      const reprint = await apiClient.reprintOrder(order.id);
      addOrder(reprint);
      showToast(`Reprint ${reprint.id} queued successfully at Kiosk ${reprint.kioskId}!`);
      setTimeout(() => {
        router.push(`/orders/${encodeURIComponent(reprint.id.replace('#', ''))}`);
      }, 700);
    } catch (err: any) {
      showToast(err?.message || `Reprint command queued for ${order.id} on ${order.kioskId}`);
    } finally {
      setIsReprinting(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    setIsCancelling(true);
    try {
      await apiClient.cancelOrder(order.id);
      showToast(`Order ${order.id} has been cancelled.`);
      refreshData();
    } catch (err: any) {
      showToast(err?.message || `Order ${order.id} cancellation requested`);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!order) return;
    setIsDownloading(true);
    showToast(`Downloading official PDF receipt for ${order.id}...`);
    try {
      const blob = await apiClient.downloadReceipt(order.id);
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Receipt-${order.id.replace('#', '')}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(link);
      showToast(`Receipt downloaded: Receipt-${order.id.replace('#', '')}.pdf`);
    } catch (err: any) {
      showToast(err?.message || 'Could not download receipt PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!order) {
    if (isLoading) {
      return (
        <AppLayout>
          <div className="py-24 text-center space-y-4">
            <div className="inline-block w-8 h-8 border-4 border-nf-blue border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">Retrieving order details from operations network...</p>
          </div>
        </AppLayout>
      );
    }
    return (
      <AppLayout>
        <div className="py-16 text-center space-y-4">
          <h2 className="text-xl font-bold text-nf-navy">Order not found</h2>
          <Link
            href="/orders"
            className="px-4 py-2 bg-nf-blue text-white rounded-xl text-xs font-bold inline-block"
          >
            Back to Orders
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 select-none">
        {/* Navigation Breadcrumb */}
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-nf-secondary font-medium mb-1.5">
            <Link href="/command-center" className="hover:text-nf-navy transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <Link href="/orders" className="hover:text-nf-navy transition-colors">
              Orders
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-nf-navy font-semibold">{order.id}</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-nf-navy tracking-tight">
                Order {order.id}
              </h1>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                  order.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : order.status === 'Queued'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : order.status === 'Pending'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    order.status === 'Completed'
                      ? 'bg-emerald-500'
                      : order.status === 'Queued'
                      ? 'bg-amber-500 animate-pulse'
                      : order.status === 'Pending'
                      ? 'bg-blue-500'
                      : 'bg-indigo-500 animate-pulse'
                  }`}
                />
                {order.status}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {order.paymentStatus === 'Pending' && (
                <button
                  type="button"
                  onClick={handlePayNow}
                  disabled={isPaying}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <CreditCard className={`w-3.5 h-3.5 ${isPaying ? 'animate-spin' : ''}`} />
                  <span>{isPaying ? 'Authorizing...' : `Authorize & Pay $${Number(order.totalAmount || 0).toFixed(2)}`}</span>
                </button>
              )}

              {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Ban className={`w-3.5 h-3.5 ${isCancelling ? 'animate-spin' : ''}`} />
                  <span>Cancel Order</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleDownloadReceipt}
                disabled={isDownloading}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Download className={`w-3.5 h-3.5 text-slate-500 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'Generating...' : 'Receipt PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleReprint}
                disabled={isReprinting}
                className="px-3.5 py-2 rounded-xl bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isReprinting ? 'animate-spin' : ''}`} />
                <span>{isReprinting ? 'Queueing...' : 'Reprint Job'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Progress Card (if actively printing or queued) */}
        <div className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-nf-blue flex items-center justify-center">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-400 block">
                  Print Status & Queue Position
                </span>
                <span className="text-sm font-extrabold text-nf-navy block">
                  {order.status === 'Completed'
                    ? 'All pages finished and ready at pickup bin'
                    : order.status === 'Queued'
                    ? `Queued at Kiosk ${order.kioskId} • Waiting for next print slot`
                    : order.status === 'Pending'
                    ? 'Awaiting checkout authorization before release to kiosk'
                    : `Printing duplex pages • ${order.estimatedCompletion || 'In progress'}`}
                </span>
              </div>
            </div>

            <span className="text-2xl font-black text-nf-blue">{order.progress || 0}%</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                order.status === 'Completed'
                  ? 'bg-emerald-500'
                  : order.status === 'Queued'
                  ? 'bg-amber-500'
                  : 'bg-nf-blue'
              }`}
              style={{ width: `${Math.max(order.status === 'Queued' ? 10 : 0, order.progress || 0)}%` }}
            />
          </div>
        </div>

        {/* Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Details & Specs (col-span-7) */}
          <div className="md:col-span-7 space-y-6">
            {/* Document Details Card */}
            <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card space-y-4">
              <h2 className="text-sm font-bold text-nf-navy uppercase tracking-wider">
                Document Specifications
              </h2>

              <div className="flex items-start gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {order.fileType.toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                  <span className="font-extrabold text-slate-900 block truncate text-sm">
                    {order.documentName}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    File Size: {order.fileSize}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">COPIES</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {order.copies}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">PAGES</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {order.pageCount}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">COLOR MODE</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {order.colorMode}
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold">PAPER SIZE</span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {order.paperSize}
                  </span>
                </div>
              </div>
            </div>

            {/* Pricing & Payment Card */}
            <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h2 className="text-sm font-bold text-nf-navy uppercase tracking-wider">
                  Payment & Invoice
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      order.paymentStatus === 'Paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    ● {order.paymentStatus}
                  </span>
                  {order.paymentStatus === 'Pending' && (
                    <button
                      type="button"
                      onClick={handlePayNow}
                      disabled={isPaying}
                      className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Authorize Now</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between text-slate-600">
                  <span>Base Print Charge ({order.pageCount} pgs × {order.copies} copies)</span>
                  <span className="font-bold text-slate-900">
                    ${Number(order.subtotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="py-2 flex justify-between text-slate-600">
                  <span>State & Municipal Sales Tax (8%)</span>
                  <span className="font-bold text-slate-900">
                    ${Number(order.tax || 0).toFixed(2)}
                  </span>
                </div>
                <div className="py-3 flex justify-between text-sm font-extrabold text-nf-navy">
                  <span>Total Amount Paid</span>
                  <span className="text-base text-nf-blue">
                    ${Number(order.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>Stripe Demo Sandbox • Card ending 4242</span>
                </div>
                <span className="font-mono text-slate-400 text-[11px]">
                  TXN-{order.id.replace('#NF-', '').padStart(6, '0')}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Timeline & Kiosk info (col-span-5) */}
          <div className="md:col-span-5 space-y-6">
            {/* Assigned Kiosk Box */}
            <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Assigned Kiosk
              </span>
              <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {order.kioskId}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {assignedKiosk?.zone || 'Zone B'} — {assignedKiosk?.zoneLabel || 'Main Floor'}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      IP: {assignedKiosk?.ipAddress || '192.168.1.105'}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/kiosks/${order.kioskId}`}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-nf-blue hover:bg-slate-50 transition-colors shadow-xs"
                >
                  Inspect Kiosk
                </Link>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="bg-white rounded-2xl border border-nf-border p-5 shadow-card space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Order Activity Timeline
              </span>

              <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(order.timeline || []).map((event: any, idx: number) => (
                  <div key={idx} className="relative flex items-start gap-3 pl-1">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-10 ${
                        event.completed
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {event.completed ? '✓' : idx + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 block">
                          {event.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {event.time}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
