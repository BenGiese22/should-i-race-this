'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme';
import { useFeatureFlags, MOCK_PROFILE_INFO } from '@/lib/feature-flags';
import type { MockProfileId } from '@/lib/feature-flags';

interface NavItem {
  label: string;
  href: string;
  description: string;
}

const navItems: NavItem[] = [
  {
    label: 'Recommendations',
    href: '/dashboard/recommendations',
    description: 'What should I race?',
  },
  {
    label: 'Performance',
    href: '/dashboard',
    description: 'Your racing history',
  },
];

// SVG icons for navigation
function RecommendationsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function PerformanceIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function LogoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  );
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  '/dashboard/recommendations': RecommendationsIcon,
  '/dashboard': PerformanceIcon,
};

const mockProfileOptions: { value: MockProfileId; label: string }[] = [
  { value: null, label: 'Real Data' },
  { value: 'new_driver', label: 'New Driver' },
  { value: 'road_veteran', label: 'Road Veteran' },
  { value: 'oval_specialist', label: 'Oval Specialist' },
  { value: 'multi_discipline', label: 'Multi-Discipline' },
  { value: 'safety_recovery', label: 'Safety Recovery' },
];

/**
 * Dashboard header with navigation and theme toggle
 * Sticky at the top of the page
 */
export function DashboardHeader() {
  const pathname = usePathname();
  const { flags, setMockProfile } = useFeatureFlags();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-racing-gray-200 dark:border-racing-gray-700 bg-white/80 dark:bg-racing-gray-800/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-racing-gray-900 dark:text-white font-bold text-lg"
          >
            <LogoIcon className="w-6 h-6" />
            <span className="hidden sm:inline">Should I Race This?</span>
            <span className="sm:hidden">SIRT</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              const Icon = iconMap[item.href];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-racing-blue/10 text-racing-blue dark:bg-racing-blue/20'
                      : 'text-racing-gray-600 dark:text-racing-gray-400 hover:bg-racing-gray-100 dark:hover:bg-racing-gray-700 hover:text-racing-gray-900 dark:hover:text-white'
                    }
                  `}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side: Mock profile selector, Theme toggle */}
          <div className="flex items-center gap-2">
            {/* Mock Profile Selector (Debug) */}
            <div className="relative group">
              <select
                value={flags.mockProfile ?? ''}
                onChange={(e) => setMockProfile((e.target.value || null) as MockProfileId)}
                className={`
                  px-2 py-1.5 text-xs rounded-lg cursor-pointer
                  ${flags.mockProfile
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                    : 'bg-racing-gray-100 dark:bg-racing-gray-800 text-racing-gray-600 dark:text-racing-gray-400 border border-transparent'
                  }
                  focus:outline-none focus:ring-2 focus:ring-racing-blue
                `}
                aria-label="Select mock profile"
              >
                {mockProfileOptions.map((option) => (
                  <option key={option.value ?? 'real'} value={option.value ?? ''}>
                    {option.label}
                  </option>
                ))}
              </select>
              {/* Tooltip with profile description */}
              {flags.mockProfile && (
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-racing-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 max-w-xs">
                  <strong>Mock Data Active</strong>
                  <br />
                  {MOCK_PROFILE_INFO[flags.mockProfile].description}
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-racing-gray-900" />
                </div>
              )}
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
