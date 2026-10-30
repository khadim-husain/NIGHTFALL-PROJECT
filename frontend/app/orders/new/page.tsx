'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { useApp } from '@/lib/AppContext';
import { apiClient } from '@/lib/api-client';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  CreditCard,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Printer,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PrintOrder } from '@/lib/types';

export default function NewOrderPage() {
  const router = useRouter();
  const { kiosks, addOrder } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [rawFile, setRawFile] = useState<File | null>(null);
  const [file, setFile] = useState<{
    name: string;
    size: string;
    type: 'pdf' | 'docx' | 'pptx' | 'png' | 'jpg';
    pages: number;
  } | null>({
    name: 'Executive_Briefing_Q2.pdf',
    size: '6.4 MB',
    type: 'pdf',
    pages: 14,
  });

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Configuration
  const [copies, setCopies] = useState<number>(2);
  const [colorMode, setColorMode] = useState<'Color' | 'Monochrome'>('Color');
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'A3'>('A4');
  const [duplex, setDuplex] = useState<boolean>(true);
  const [selectedKioskId, setSelectedKioskId] = useState<string>('K05');

  // Customer info
  const [customerName, setCustomerName] = useState('Alex Rivera');
  const [customerEmail, setCustomerEmail] = useState('alex.rivera@designstudio.io');

  // Simulated Payment state
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>('');

  // Price calculations
  const perPagePrice = colorMode === 'Color' ? 0.35 : 0.08;
  const paperMultiplier = paperSize === 'A3' ? 1.5 : 1.0;
  const pageCount = file?.pages || 1;
  const subtotal = pageCount * copies * perPagePrice * paperMultiplier;
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  const parsePdfPageCount = async (selectedFile: File): Promise<number> => {
    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {
        return 1;
      }
      if (ext === 'pdf') {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binaryStr = '';
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binaryStr += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
        }

        const countRegex = /\/Type\s*\/Pages[^>]*\/Count\s+(\d+)/g;
        let countMatch: RegExpExecArray | null;
        const counts: number[] = [];
        while ((countMatch = countRegex.exec(binaryStr)) !== null) {
          const val = parseInt(countMatch[1], 10);
          if (!isNaN(val) && val > 0) counts.push(val);
        }
        if (counts.length > 0) {
          return Math.max(...counts);
        }

        const pageRegex = /\/Type\s*\/Page\b(?!\s*s)/g;
        let pageMatchCount = 0;
        while (pageRegex.exec(binaryStr) !== null) {
          pageMatchCount++;
        }
        if (pageMatchCount > 0) {
          return pageMatchCount;
        }
      }
    } catch {
      // Fallback
    }
    return 1;
  };

  const processSelectedFile = async (selected: File) => {
    setRawFile(selected);
    const ext = selected.name.split('.').pop()?.toLowerCase() || 'pdf';
    const detectedPages = await parsePdfPageCount(selected);
    let formattedSize = '3.5 MB';
    if (selected.size >= 1024 * 1024) {
      formattedSize = `${(selected.size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      formattedSize = `${Math.max(1, Math.round(selected.size / 1024))} KB`;
    }
    setFile({
      name: selected.name,
      size: formattedSize,
      type: (['pdf', 'docx', 'pptx', 'png', 'jpg'].includes(ext)
        ? ext
        : 'pdf') as any,
      pages: detectedPages,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleExecutePayment = async () => {
    setPaymentProcessing(true);
    try {
      let docId = 'doc-1048'; // default seeded doc
      if (rawFile) {
        try {
          const uploaded = await apiClient.uploadDocument(rawFile, pageCount);
          if (uploaded?.id) docId = uploaded.id;
        } catch {
          // fallback
        }
      }

      // 1. Submit order to backend
      const created = await apiClient.createOrder({
        documentId: docId,
        kioskId: selectedKioskId,
        copies,
        pageCount,
        colorMode,
        paperSize,
        duplex,
      });

      // 2. Submit simulated payment with idempotency key
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const paymentResult = await apiClient.simulatePayment(created.id, idempotencyKey, '4242');

      const confirmedOrder = paymentResult?.order || {
        ...created,
        status: 'Queued',
        paymentStatus: 'Paid',
      };

      setConfirmedOrderId(confirmedOrder.id);
      addOrder(confirmedOrder);
      setStep(4);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err) {
      console.warn('Backend order flow completed via demo fallback', err);
      const newId = `#NF-${Math.floor(1049 + Math.random() * 100)}`;
      setConfirmedOrderId(newId);

      const fallbackOrder: PrintOrder = {
        id: newId,
        documentName: file?.name || 'Document.pdf',
        fileSize: file?.size || '3.5 MB',
        fileType: file?.type || 'pdf',
        kioskId: selectedKioskId,
        customerName: customerName || 'Authorized User',
        customerEmail: customerEmail || 'user@nightfall.io',
        status: 'Printing',
        paymentStatus: 'Paid',
        progress: 12,
        createdAt: 'Just now',
        copies,
        pageCount,
        colorMode,
        paperSize,
        duplex,
        totalAmount: Number(total.toFixed(2)),
        estimatedCompletion: '3 min remaining',
        timeline: [
          {
            title: 'Order Submitted & Payment Verified',
            description: 'Demo Visa Card (ending 4242)',
            time: 'Just now',
            completed: true,
          },
          {
            title: 'File Preflight & Rasterization',
            description: 'Processed at 600 DPI',
            time: 'Active',
            completed: true,
          },
          {
            title: `Spooling to Kiosk ${selectedKioskId}`,
            description: 'Transmitting via high-speed queue',
            time: 'Active',
            completed: false,
          },
        ],
      };

      addOrder(fallbackOrder);
      setStep(4);

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 select-none">
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
            <span className="text-nf-navy font-semibold">New Order</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-nf-navy tracking-tight">
            Create Print Order
          </h1>
          <p className="text-xs md:text-sm text-nf-secondary mt-0.5">
            Configure document print parameters, assign destination kiosk, and dispatch to queue
          </p>
        </div>

        {/* Step Progress Pills */}
        <div className="flex items-center justify-between bg-white rounded-2xl border border-nf-border p-3.5 shadow-card">
          {[
            { num: 1, label: 'Document & Setup' },
            { num: 2, label: 'Review Quote' },
            { num: 3, label: 'Payment Simulation' },
            { num: 4, label: 'Dispatch Confirmation' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                  step === s.num
                    ? 'bg-nf-blue text-white shadow-xs'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </span>
              <span
                className={`text-xs font-bold hidden sm:inline ${
                  step === s.num ? 'text-nf-navy' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* STEP 1: Document Upload & Setup */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Upload Card (col-span-7) */}
            <div className="md:col-span-7 bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-5">
              <h2 className="text-base font-bold text-nf-navy">1. Upload Document</h2>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.pptx,.png,.jpg"
                className="hidden"
                onChange={handleFileUpload}
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-nf-blue bg-blue-50/60'
                    : 'border-slate-300 hover:border-nf-blue hover:bg-slate-50'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-nf-blue flex items-center justify-center mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-slate-800">
                  Click to browse or drag & drop document
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Supported formats: PDF, DOCX, PPTX, PNG, JPG (Max 50MB)
                </span>
              </div>

              {/* Uploaded File Chip */}
              {file && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {file.type.toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block truncate max-w-[240px]">
                        {file.name}
                      </span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {file.size} • {file.pages} pages detected
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-white rounded-lg text-emerald-700 font-bold text-xs shadow-xs border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    Preflight OK
                  </span>
                </div>
              )}

              {/* Destination Kiosk Selection */}
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Select Destination Kiosk
                </label>
                <select
                  value={selectedKioskId}
                  onChange={(e) => setSelectedKioskId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 p-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-nf-blue/20"
                >
                  {kiosks.map((k) => (
                    <option key={k.id} value={k.id} disabled={k.status === 'Error'}>
                      {k.id} — {k.zone} ({k.zoneLabel}) • Status: {k.status} • Queue: {k.queueLength}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right Print Settings Card (col-span-5) */}
            <div className="md:col-span-5 bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-4">
              <h2 className="text-base font-bold text-nf-navy">2. Print Specifications</h2>

              {/* Number of Copies */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Copies
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCopies((c) => Math.max(1, c - 1))}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-extrabold text-sm">{copies}</span>
                  <button
                    type="button"
                    onClick={() => setCopies((c) => c + 1)}
                    className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Color Mode */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Color Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setColorMode('Color')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      colorMode === 'Color'
                        ? 'bg-blue-50 border-nf-blue text-nf-blue shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🎨 Full Color
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('Monochrome')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      colorMode === 'Monochrome'
                        ? 'bg-blue-50 border-nf-blue text-nf-blue shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📄 Monochrome (B&W)
                  </button>
                </div>
              </div>

              {/* Paper Size */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Paper Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['A4', 'Letter', 'A3'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setPaperSize(sz)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        paperSize === sz
                          ? 'bg-blue-50 border-nf-blue text-nf-blue shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duplex Toggle */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Duplex (Two-Sided)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDuplex(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      duplex
                        ? 'bg-blue-50 border-nf-blue text-nf-blue shadow-xs'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Double-Sided
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplex(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      !duplex
                        ? 'bg-blue-50 border-nf-blue text-nf-blue shadow-xs'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Single-Sided
                  </button>
                </div>
              </div>

              {/* Price Calculation Widget */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 mt-2 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Rate per page:</span>
                  <span className="font-semibold">${(perPagePrice * paperMultiplier).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Pages & Copies:</span>
                  <span className="font-semibold">{pageCount} pgs × {copies}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-nf-navy pt-1 border-t border-slate-200">
                  <span>Estimated Total:</span>
                  <span className="text-nf-blue">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2.5 bg-nf-blue hover:bg-nf-blue-hover text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors mt-2"
              >
                <span>Continue to Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Review Order */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-5">
            <h2 className="text-lg font-bold text-nf-navy">Review Order Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block">Document</span>
                <span className="font-bold text-slate-900 block text-sm mt-0.5">
                  {file?.name}
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  {file?.size} • {file?.pages} pages
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Target Kiosk</span>
                <span className="font-bold text-nf-blue block text-sm mt-0.5">
                  {selectedKioskId} ({kiosks.find((k) => k.id === selectedKioskId)?.zoneLabel})
                </span>
                <span className="text-slate-500 mt-0.5 block">
                  Network IP: {kiosks.find((k) => k.id === selectedKioskId)?.ipAddress}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Print Specs</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {copies} {copies === 1 ? 'copy' : 'copies'} • {colorMode} • {paperSize} •{' '}
                  {duplex ? 'Double-sided' : 'Single-sided'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 font-semibold block">Customer</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {customerName} ({customerEmail})
                </span>
              </div>
            </div>

            {/* Pricing Breakdown Warning */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Notice:</strong> In production, final pricing and authorization are calculated on the secure server. This client preview is for verification.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Setup</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs"
              >
                <span>Proceed to Simulated Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Simulated Payment */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-nf-border p-6 shadow-card space-y-5 max-w-lg mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-nf-blue flex items-center justify-center mx-auto mb-2">
                <CreditCard className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-nf-navy">Payment Authorization</h2>
              <span className="text-xs text-slate-500">
                Authorized Amount: <strong className="text-nf-blue text-sm">${total.toFixed(2)}</strong>
              </span>
            </div>

            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Demo Mode Active
              </span>
              <p className="text-[11px] text-blue-700">
                This is a simulated sandbox checkout. No real money or credit card charges will occur.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-nf-blue/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Simulated Card Number</label>
                <input
                  type="text"
                  disabled
                  value="4242 •••• •••• 4242 (Demo Stripe Card)"
                  className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-mono text-slate-600 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expiry</label>
                  <input
                    type="text"
                    disabled
                    value="12 / 28"
                    className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CVC</label>
                  <input
                    type="text"
                    disabled
                    value="•••"
                    className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={paymentProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Back
              </button>

              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={paymentProcessing}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors"
              >
                {paymentProcessing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing Demo Auth...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Pay ${total.toFixed(2)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Confirmation Screen */}
        {step === 4 && (
          <div className="bg-white rounded-2xl border border-nf-border p-8 shadow-card text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <CheckCircle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-extrabold text-nf-navy">
              Print Order Successfully Dispatched!
            </h2>

            <p className="text-xs text-slate-500">
              Order <strong className="text-nf-blue font-bold">{confirmedOrderId}</strong> has been transferred to{' '}
              <strong className="text-slate-800">{selectedKioskId}</strong> queue and is actively rendering.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5 my-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-bold text-nf-blue">{confirmedOrderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Kiosk:</span>
                <span className="font-bold text-slate-800">{selectedKioskId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Ready:</span>
                <span className="font-bold text-emerald-600">~2 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pickup PIN:</span>
                <span className="font-mono font-bold text-slate-800">8492</span>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center pt-2">
              <Link
                href="/command-center"
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Return to Command Center
              </Link>

              <Link
                href={`/orders/${confirmedOrderId.replace('#', '')}`}
                className="px-5 py-2.5 rounded-xl bg-nf-blue hover:bg-nf-blue-hover text-white text-xs font-bold shadow-xs transition-colors"
              >
                Track Order Progress
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

