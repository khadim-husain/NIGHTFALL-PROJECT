'use client';

import React from 'react';
import { AppProvider } from '@/lib/AppContext';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}</AppProvider>;
}

