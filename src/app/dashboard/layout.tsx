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
      <div className="min-h-screen">
        <DashboardHeader />
        <main>{children}</main>
      </div>
    </FeatureFlagsProvider>
  );
}
