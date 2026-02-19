'use client';

import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import { SignInButton } from '@/components/landing/SignInButton';
import { Target, Calendar, TrendingUp } from 'lucide-react';
import { LicenseBadge } from '@/components/racing/LicenseBadge';

export function LandingPageClient() {
  const { user, loading, login } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard/recommendations');
    } else {
      login();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl text-[var(--text-primary)]">Should I Race This?</h1>
            <SignInButton onClick={handleGetStarted} variant="header" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
          <div className="space-y-8 sm:space-y-12">
            
            {/* Hero Section */}
            <div className="space-y-4 sm:space-y-6 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                Know Which Races Are Worth Running
              </h2>
              <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed">
                A decision engine for serious iRacing drivers. Get personalized race recommendations based on your history, goals, and this week&apos;s schedule.
              </p>
              <div className="pt-4">
                <SignInButton onClick={handleGetStarted} variant="cta" />
              </div>
            </div>

            {/* Preview Card - Shows what users will see */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
                  <div>
                    <div className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wide mb-2">
                      Top Pick for You
                    </div>
                    <h3 className="mb-2 text-[var(--text-primary)] text-lg sm:text-xl font-semibold">Advanced Mazda MX-5 Cup</h3>
                    <h4 className="text-[var(--text-secondary)] text-base sm:text-lg">Road Atlanta - Full Course</h4>
                  </div>
                  <LicenseBadge license="C" />
                </div>
                
                <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <div>
                    <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Next Race</div>
                    <div className="text-[var(--text-primary)] font-semibold text-sm sm:text-base">6:00 PM EST</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Length</div>
                    <div className="text-[var(--text-primary)] font-semibold text-sm sm:text-base">25 minutes</div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-1">Confidence</div>
                    <div className="text-[var(--accent-primary)] font-semibold stat-number text-sm sm:text-base">92%</div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--border-subtle)]">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Based on 18 races in this series, you average +3.2 position gains with 1.8 incidents per race. Road Atlanta timing aligns with your typical schedule.
                  </p>
                </div>
              </div>
            </div>

            {/* Value Props - What this does */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-8">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-[var(--accent-info)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Goal-Based Scoring</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Balance iRating gains with safety risk, or optimize for a specific goal like rating recovery.
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[var(--accent-info)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Schedule-First</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  See what&apos;s available this week with your owned content and typical racing windows.
                </p>
              </div>
              
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[var(--accent-info)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">History-Justified</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  Every recommendation is based on your actual performance patterns and race outcomes.
                </p>
              </div>
            </div>

            {/* Trust Signal */}
            <div className="text-center pt-8">
              <p className="text-sm text-[var(--text-tertiary)]">
                Independent analytics service · Not affiliated with iRacing
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
