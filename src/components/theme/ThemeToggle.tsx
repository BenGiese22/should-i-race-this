'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Theme toggle dropdown with Light/Dark/System options
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-24 h-9 rounded-lg bg-racing-gray-200 dark:bg-racing-gray-700 animate-pulse" />
    );
  }

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      className="px-3 py-2 text-sm rounded-lg bg-racing-gray-100 dark:bg-racing-gray-800 text-racing-gray-700 dark:text-racing-gray-200 focus:outline-none focus:ring-2 focus:ring-racing-blue cursor-pointer"
      aria-label="Select theme"
    >
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
