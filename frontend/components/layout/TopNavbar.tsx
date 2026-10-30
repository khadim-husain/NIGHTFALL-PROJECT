'use client';

import React from 'react';
import { Search, Bell, AlertTriangle, Menu, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useRouter } from 'next/navigation';

export function TopNavbar() {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    incidents,
    selectKioskById,
  } = useApp();

  const openIncidents = incidents.filter((i) => i.status === 'Open');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim().toUpperCase();
    if (q.startsWith('K') && q.length <= 3) {
      selectKioskById(q);
      router.push('/command-center');
    } else if (q.includes('ORD') || q.includes('NF')) {
      router.push('/orders');
    } else {
      router.push(`/orders?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-nf-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Hamburger Toggle + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 text-slate-600 hover:text-nf-navy hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search kiosks, orders, or documents..."
              className="w-full bg-[#F4F7FB] hover:bg-[#EEF2F8] focus:bg-white text-xs font-semibold text-nf-navy placeholder-slate-400 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-nf-blue/30 focus:outline-none focus:ring-2 focus:ring-nf-blue/10 transition-all duration-150"
            />
          </div>
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
        {/* System Online Status Badge */}
        <div className="hidden sm:flex items-center gap-2.5 pl-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="w-4 h-4 rounded-full bg-emerald-400/20 absolute -inset-0.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-nf-navy leading-tight">
              System Online
            </span>
            <span className="text-[11px] text-nf-secondary leading-tight">
              All 12 kiosks active
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block" />

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="w-9 h-9 rounded-xl border border-nf-border hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {openIncidents.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-nf-red text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs">
                {openIncidents.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-dropdown border border-nf-border py-2 z-50 animate-slide-up">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-nf-navy uppercase tracking-wider">
                  Operational Alerts ({openIncidents.length})
                </span>
                <span
                  onClick={() => setIsNotificationsOpen(false)}
                  className="text-[11px] text-nf-blue hover:underline cursor-pointer font-semibold"
                >
                  Close
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {openIncidents.length > 0 ? (
                  openIncidents.map((inc) => (
                    <div
                      key={inc.id}
                      onClick={() => {
                        selectKioskById(inc.kioskId);
                        setIsNotificationsOpen(false);
                        router.push('/command-center');
                      }}
                      className="px-4 py-3 hover:bg-slate-50 flex items-start gap-3 cursor-pointer transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {inc.kioskId} - {inc.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {inc.description}
                        </p>
                        <span className="text-[10px] text-slate-400 font-medium block mt-1">
                          {inc.timeAgo}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                    All kiosks running with zero active alerts.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
