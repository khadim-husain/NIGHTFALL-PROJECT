'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeaderSection } from '@/components/dashboard/HeaderSection';
import { KpiCards } from '@/components/dashboard/KpiCards';
import { OperationsCenterCard } from '@/components/dashboard/OperationsCenterCard';
import { SelectedKioskCard } from '@/components/dashboard/SelectedKioskCard';
import { RecentPrintJobsTable } from '@/components/dashboard/RecentPrintJobsTable';
import { KioskHealthOverview } from '@/components/dashboard/KioskHealthOverview';
import { ActiveIncidentsCard } from '@/components/dashboard/ActiveIncidentsCard';
import { QuickActionsFooter } from '@/components/dashboard/QuickActionsFooter';

export default function CommandCenterPage() {
  return (
    <AppLayout>
      {/* 1. Header with Breadcrumb, Title & Live Refresh */}
      <HeaderSection />

      {/* 2. Four KPI Cards */}
      <KpiCards />

      {/* 3. Main Center Visualization Area (3D Operations Center + Selected Kiosk Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-stretch">
        <div className="lg:col-span-8 xl:col-span-9">
          <OperationsCenterCard />
        </div>
        <div className="lg:col-span-4 xl:col-span-3">
          <SelectedKioskCard />
        </div>
      </div>

      {/* 4. Lower Analytics & Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5">
          <RecentPrintJobsTable />
        </div>
        <div className="lg:col-span-4">
          <KioskHealthOverview />
        </div>
        <div className="lg:col-span-3">
          <ActiveIncidentsCard />
        </div>
      </div>

      {/* 5. Quick Actions, Status, and Brand Banner */}
      <QuickActionsFooter />
    </AppLayout>
  );
}

