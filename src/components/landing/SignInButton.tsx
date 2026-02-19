'use client';

import { Button } from '@/components/ui/button';

interface SignInButtonProps {
  onClick: () => void;
  variant?: 'header' | 'cta';
}

export function SignInButton({ onClick, variant = 'header' }: SignInButtonProps) {
  if (variant === 'cta') {
    return (
      <Button
        onClick={onClick}
        size="lg"
        className="px-8 py-4 bg-[var(--accent-primary)] text-[#1A1D23] font-semibold rounded-lg hover:bg-[var(--accent-primary-bright)] transition-colors text-lg"
      >
        See This Week&apos;s Recommendations
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className="px-4 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-primary)]"
    >
      Sign In
    </Button>
  );
}
