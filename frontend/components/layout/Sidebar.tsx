'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Monitor,
  AlertTriangle,
  FileCode,
  Settings,
  ChevronDown,
  User,
  LogOut,
  ShieldAlert,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useApp } from '@/lib/AppContext';

export function Sidebar() {
  const pathname = usePathname();
  const {
    incidents,
    isUserMenuOpen,
    setIsUserMenuOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useApp();

  const openIncidentsCount = incidents.filter((i) => i.status === 'Open').length;

  // Automatically close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, setIsMobileMenuOpen]);

  const navItems = [
    {
      name: 'Command Center',
      href: '/command-center',
      icon: LayoutDashboard,
      active: pathname === '/' || pathname === '/command-center',
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ClipboardList,
      active: pathname.startsWith('/orders'),
    },
    {
      name: 'Kiosks',
      href: '/kiosks',
      icon: Monitor,
      active: pathname.startsWith('/kiosks'),
    },
    {
      name: 'Incidents',
      href: '/incidents',
      icon: AlertTriangle,
      badge: openIncidentsCount > 0 ? openIncidentsCount : undefined,
      active: pathname.startsWith('/incidents'),
    },
    {
      name: 'Audit Logs',
      href: '/audit-logs',
      icon: FileCode,
      active: pathname.startsWith('/audit-logs'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed on viewport on Desktop, Drawer on Mobile */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 h-screen bg-white border-r border-nf-border flex flex-col justify-between select-none transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'translate-x-0 shadow-2xl w-72'
            : '-translate-x-full lg:translate-x-0 ' + (isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64')
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {/* Logo Header: aligned with h-16 navbar */}
          <div
            className={`h-16 px-4 flex items-center border-b border-nf-border flex-shrink-0 ${
              isSidebarCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <BrandLogo collapsed={isSidebarCollapsed} />

            {/* Desktop Collapse/Expand Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-auto"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-slate-500" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Close button on mobile */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isSidebarCollapsed
                      ? 'justify-center p-2.5'
                      : 'justify-between px-3.5 py-2.5'
                  } ${
                    item.active
                      ? 'bg-nf-blue-light text-nf-blue font-bold shadow-xs'
                      : 'text-slate-600 hover:text-nf-navy hover:bg-slate-50'
                  }`}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        item.active ? 'text-nf-blue' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </div>

                  {/* Badge */}
                  {item.badge !== undefined && (
                    isSidebarCollapsed ? (
                      <span className="w-2 h-2 rounded-full bg-nf-red ring-2 ring-white absolute top-2 right-2" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-nf-red text-white text-[10px] font-bold flex items-center justify-center shadow-xs flex-shrink-0">
                        {item.badge}
                      </span>
                    )
                  )}

                  {/* Tooltip on Collapsed Desktop */}
                  {isSidebarCollapsed && (
                    <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1 bg-nf-navy text-white text-xs font-semibold rounded-lg shadow-dropdown pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.name}
                      {item.badge !== undefined && ` (${item.badge})`}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Area */}
        <div className="p-3 border-t border-nf-border relative flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className={`w-full flex items-center rounded-xl hover:bg-slate-50 transition-colors text-left ${
              isSidebarCollapsed ? 'justify-center p-2' : 'justify-between p-2'
            }`}
            title={isSidebarCollapsed ? 'Admin Profile' : undefined}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-xs ring-2 ring-white">
                <span className="uppercase tracking-wider">AD</span>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-nf-navy leading-tight truncate">
                    Admin
                  </span>
                  <span className="text-[11px] text-nf-secondary leading-tight mt-0.5 truncate">
                    System Administrator
                  </span>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            )}
          </button>

          {/* Profile Popover Menu */}
          {isUserMenuOpen && (
            <div
              className={`absolute bg-white rounded-xl shadow-dropdown border border-nf-border p-1.5 z-50 animate-slide-up ${
                isSidebarCollapsed
                  ? 'bottom-2 left-full ml-3 w-48'
                  : 'bottom-16 left-3 right-3'
              }`}
            >
              <Link
                href="/settings"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Profile Settings</span>
              </Link>
              <Link
                href="/incidents"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>Security Center</span>
              </Link>
              <div className="h-px bg-slate-100 my-1" />
              <Link
                href="/login"
                onClick={() => setIsUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Sign Out</span>
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
