'use client';

import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { FeatureFlagsProvider } from '@/lib/feature-flags';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureFlagsProvider>
      <div className="min-h-screen bg-racing-gray-50 dark:bg-racing-gray-900">
        <DashboardHeader />
        <main>{children}</main>
      </div>
    </FeatureFlagsProvider>
  );
}
