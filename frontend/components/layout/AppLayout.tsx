'use client';

import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useApp } from '@/lib/AppContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-nf-bg text-nf-navy font-sans antialiased relative">
      {/* Left Sidebar: Fixed on viewport, never scrolls away */}
      <Sidebar />

      {/* Right Content Stream with dynamic responsive sidebar offset */}
      <div
        className={`flex flex-col min-w-0 w-full min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <TopNavbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
