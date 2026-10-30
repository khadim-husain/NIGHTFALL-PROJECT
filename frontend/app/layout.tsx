import type { Metadata } from 'next';
import './globals.css';
import { ClientProviders } from '@/components/providers/ClientProviders';

export const metadata: Metadata = {
  title: 'Nightfall Nexus — Smart Printing Operations',
  description: 'Enterprise Smart Printing Operations and Kiosk Management Platform',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <body className="bg-nf-bg text-nf-navy antialiased min-h-screen selection:bg-nf-blue-light selection:text-nf-blue">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
