'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
 * Dashboard header with navigation
 * Sticky at the top of the page
 */
export function DashboardHeader() {
  const pathname = usePathname();
  const { flags, setMockProfile } = useFeatureFlags();
  const [isProUser, setIsProUser] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-text-primary font-bold text-lg"
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
                      ? 'bg-[var(--accent-primary-glow)] text-[var(--accent-primary-bright)]'
                      : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                    }
                  `}
                >
                  {Icon && <Icon className="w-5 h-5" />}
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side: Pro toggle + Mock profile selector + Logout */}
          <div className="flex items-center gap-2">
            {/* Pro/Free Toggle (Dev Only) */}
            <button
              onClick={() => setIsProUser(!isProUser)}
              className={`
                px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                ${isProUser
                  ? 'bg-[var(--accent-primary)] text-[var(--bg-app)] border border-[var(--accent-primary)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-medium)]'
                }
                hover:opacity-80
              `}
              aria-label="Toggle Pro/Free view"
            >
              {isProUser ? 'Pro View' : 'Free View'}
            </button>

            {/* Mock Profile Selector (Debug) */}
            <div className="relative group">
              <select
                value={flags.mockProfile ?? ''}
                onChange={(e) => setMockProfile((e.target.value || null) as MockProfileId)}
                className={`
                  px-2 py-1.5 text-xs rounded-lg cursor-pointer
                  ${flags.mockProfile
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-elevated text-text-secondary border border-transparent'
                  }
                  focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]
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
                <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-elevated text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 max-w-xs">
                  <strong>Mock Data Active</strong>
                  <br />
                  {MOCK_PROFILE_INFO[flags.mockProfile].description}
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-elevated" />
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all
                ${isLoggingOut
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30'
                }
              `}
              aria-label="Logout"
              title="Logout and re-authenticate"
            >
              <svg 
                className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {isLoggingOut ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                )}
              </svg>
              <span className="hidden sm:inline">
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// Export the pro user state for use in child components
export function useProUserState() {
  const [isProUser, setIsProUser] = useState(false);
  
  // Listen to storage events to sync across components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dev_pro_mode') {
        setIsProUser(e.newValue === 'true');
      }
    };
    
    // Check initial value
    const stored = localStorage.getItem('dev_pro_mode');
    if (stored) {
      setIsProUser(stored === 'true');
    }
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  const toggleProUser = () => {
    const newValue = !isProUser;
    setIsProUser(newValue);
    localStorage.setItem('dev_pro_mode', String(newValue));
    // Dispatch custom event for same-window updates
    window.dispatchEvent(new CustomEvent('pro-mode-change', { detail: newValue }));
  };
  
  return { isProUser, toggleProUser };
}
