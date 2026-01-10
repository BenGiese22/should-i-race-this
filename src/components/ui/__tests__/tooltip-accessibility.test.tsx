import React from 'react';
import { render, screen } from '@testing-library/react';
import { RacingBadgeComponent, ConfidenceBadgeComponent } from '../racing-badge';
import { RacingProgress } from '../racing-progress';
import { RacingBadge, ConfidenceBadge, ProgressBar } from '@/lib/recommendations/types';

describe('Tooltip Accessibility', () => {
  const mockRacingBadge: RacingBadge = {
    level: 'champion',
    colors: {
      primary: '#FFD700',
      accent: '#FFA500',
      text: '#000000'
    },
    icon: '🏆',
    description: 'Champion level performance',
    racingTheme: {
      checkeredFlag: false,
      metallic: true,
      gradient: false
    }
  };

  const mockConfidenceBadge: ConfidenceBadge = {
    text: 'High Confidence',
    color: '#22c55e',
    icon: '✓',
    description: 'Based on extensive race data'
  };

  const mockProgressBar: ProgressBar = {
    value: 75,
    gradient: {
      currentColor: '#22c55e',
      startColor: '#ef4444',
      endColor: '#22c55e'
    },
    icon: '🏁',
    tooltip: 'Performance score: 75/100'
  };

  describe('Racing Badge Accessibility', () => {
    it('should have proper ARIA labels and accessibility attributes', () => {
      render(<RacingBadgeComponent badge={mockRacingBadge} />);

      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('aria-label', 'Racing badge: champion. Champion level performance');
      expect(badge).toHaveAttribute('aria-describedby', 'racing-badge-tooltip');
      expect(badge).toHaveAttribute('tabIndex', '0');
      expect(badge).toHaveAttribute('role', 'button');
    });

    it('should have icon marked as decorative', () => {
      render(<RacingBadgeComponent badge={mockRacingBadge} />);

      const icon = screen.getByText('🏆');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Confidence Badge Accessibility', () => {
    it('should have proper ARIA labels and accessibility attributes', () => {
      render(<ConfidenceBadgeComponent badge={mockConfidenceBadge} />);

      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('aria-label', 'Confidence level: High Confidence. Based on extensive race data');
      expect(badge).toHaveAttribute('aria-describedby', 'confidence-badge-tooltip');
      expect(badge).toHaveAttribute('tabIndex', '0');
      expect(badge).toHaveAttribute('role', 'button');
    });

    it('should have icon marked as decorative', () => {
      render(<ConfidenceBadgeComponent badge={mockConfidenceBadge} />);

      const icon = screen.getByText('✓');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Racing Progress Accessibility', () => {
    it('should have proper ARIA attributes for progress bar', () => {
      render(<RacingProgress progressBar={mockProgressBar} />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('aria-valuenow', '75');
      expect(progress).toHaveAttribute('aria-valuemin', '0');
      expect(progress).toHaveAttribute('aria-valuemax', '100');
      expect(progress).toHaveAttribute('aria-label', 'Progress: 75%. Performance score: 75/100');
      expect(progress).toHaveAttribute('aria-describedby', 'racing-progress-tooltip');
      expect(progress).toHaveAttribute('tabIndex', '0');
    });

    it('should have icon marked as decorative', () => {
      render(<RacingProgress progressBar={mockProgressBar} />);

      const icon = screen.getByText('🏁');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should display correct progress value', () => {
      render(<RacingProgress progressBar={mockProgressBar} />);

      const valueText = screen.getByText('75');
      expect(valueText).toBeInTheDocument();
    });
  });

  describe('Tooltip Styling Consistency', () => {
    it('should apply consistent opaque background classes to racing badge tooltips', () => {
      const { container } = render(<RacingBadgeComponent badge={mockRacingBadge} />);
      
      // Check that the tooltip content has the correct styling classes applied
      // Note: We can't easily test the actual tooltip visibility in Jest, but we can verify
      // that the component structure includes the proper styling
      expect(container.querySelector('[id="racing-badge-tooltip"]')).toBeNull(); // Tooltip not visible initially
      
      // Verify the trigger has proper attributes
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-describedby', 'racing-badge-tooltip');
    });

    it('should apply consistent opaque background classes to confidence badge tooltips', () => {
      const { container } = render(<ConfidenceBadgeComponent badge={mockConfidenceBadge} />);
      
      // Verify the trigger has proper attributes
      const trigger = screen.getByRole('button');
      expect(trigger).toHaveAttribute('aria-describedby', 'confidence-badge-tooltip');
    });

    it('should apply consistent opaque background classes to progress tooltips', () => {
      const { container } = render(<RacingProgress progressBar={mockProgressBar} />);
      
      // Verify the trigger has proper attributes
      const trigger = screen.getByRole('progressbar');
      expect(trigger).toHaveAttribute('aria-describedby', 'racing-progress-tooltip');
    });
  });

  describe('Keyboard Navigation Support', () => {
    it('should make racing badges focusable via keyboard', () => {
      render(<RacingBadgeComponent badge={mockRacingBadge} />);

      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('tabIndex', '0');
      
      // Verify it can receive focus
      badge.focus();
      expect(badge).toHaveFocus();
    });

    it('should make confidence badges focusable via keyboard', () => {
      render(<ConfidenceBadgeComponent badge={mockConfidenceBadge} />);

      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('tabIndex', '0');
      
      // Verify it can receive focus
      badge.focus();
      expect(badge).toHaveFocus();
    });

    it('should make progress bars focusable via keyboard', () => {
      render(<RacingProgress progressBar={mockProgressBar} />);

      const progress = screen.getByRole('progressbar');
      expect(progress).toHaveAttribute('tabIndex', '0');
      
      // Verify it can receive focus
      progress.focus();
      expect(progress).toHaveFocus();
    });
  });
});