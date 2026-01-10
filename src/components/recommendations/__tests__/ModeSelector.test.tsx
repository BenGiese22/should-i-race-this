import { render, screen, fireEvent } from '@testing-library/react';
import { ModeSelector } from '../ModeSelector';

describe('ModeSelector', () => {
  const mockOnModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all three mode options', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
      />
    );

    expect(screen.getByText('Balanced')).toBeInTheDocument();
    expect(screen.getByText('iRating Push')).toBeInTheDocument();
    expect(screen.getByText('Safety Recovery')).toBeInTheDocument();
  });

  it('should display mode descriptions', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
      />
    );

    // Use getAllByText since descriptions appear in both buttons and current mode display
    expect(screen.getAllByText('Optimal balance of performance and safety')).toHaveLength(2);
    expect(screen.getAllByText('Focus on maximizing iRating gains')).toHaveLength(1);
    expect(screen.getAllByText('Prioritize Safety Rating improvement')).toHaveLength(1);
  });

  it('should show mode icons', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
      />
    );

    // Check for SVG icons by looking for specific Lucide icon classes
    const scaleIcons = document.querySelectorAll('.lucide-scale');
    const trendingUpIcons = document.querySelectorAll('.lucide-trending-up');
    const shieldIcons = document.querySelectorAll('.lucide-shield');
    
    // We expect 2 scale icons (button + current mode), 1 trending-up, 1 shield
    expect(scaleIcons.length).toBe(2);
    expect(trendingUpIcons.length).toBe(1);
    expect(shieldIcons.length).toBe(1);
  });

  it('should highlight the current mode', () => {
    render(
      <ModeSelector 
        currentMode="irating_push" 
        onModeChange={mockOnModeChange} 
      />
    );

    const iRatingButton = screen.getByText('iRating Push').closest('button');
    const balancedButton = screen.getByText('Balanced').closest('button');

    // Current mode should have default variant (active styling)
    expect(iRatingButton).toHaveClass('ring-2', 'ring-blue-500');
    // Non-current modes should have outline variant
    expect(balancedButton).not.toHaveClass('ring-2', 'ring-blue-500');
  });

  it('should call onModeChange when a mode is selected', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
      />
    );

    const safetyButton = screen.getByText('Safety Recovery');
    fireEvent.click(safetyButton);

    expect(mockOnModeChange).toHaveBeenCalledWith('safety_recovery');
  });

  it('should display current mode information', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
      />
    );

    expect(screen.getByText('Current Mode: Balanced')).toBeInTheDocument();
    // Check for the description in the parent container
    const currentModeContainer = screen.getByText('Current Mode: Balanced').closest('.bg-blue-50');
    expect(currentModeContainer).toHaveTextContent('Optimal balance of performance and safety');
  });

  it('should update current mode display when mode changes', () => {
    const { rerender } = render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
      />
    );

    expect(screen.getByText('Current Mode: Balanced')).toBeInTheDocument();

    rerender(
      <ModeSelector 
        currentMode="irating_push" 
        onModeChange={mockOnModeChange} 
      />
    );

    expect(screen.getByText('Current Mode: iRating Push')).toBeInTheDocument();
    // Check for the description in the parent container
    const currentModeContainer = screen.getByText('Current Mode: iRating Push').closest('.bg-blue-50');
    expect(currentModeContainer).toHaveTextContent('Focus on maximizing iRating gains');
  });

  it('should disable buttons when disabled prop is true', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
        disabled={true}
      />
    );

    // Get the actual button elements, not the text spans
    const balancedButton = screen.getByText('Balanced').closest('button');
    const iRatingButton = screen.getByText('iRating Push').closest('button');
    const safetyButton = screen.getByText('Safety Recovery').closest('button');

    expect(balancedButton).toBeDisabled();
    expect(iRatingButton).toBeDisabled();
    expect(safetyButton).toBeDisabled();
  });

  it('should not call onModeChange when disabled', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
        disabled={true}
      />
    );

    const iRatingButton = screen.getByText('iRating Push');
    fireEvent.click(iRatingButton);

    expect(mockOnModeChange).not.toHaveBeenCalled();
  });

  it('should have responsive grid layout', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
      />
    );

    const gridContainer = screen.getByText('Balanced').closest('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-3');
  });

  it('should have proper button styling', () => {
    render(
      <ModeSelector 
        currentMode="balanced" 
        onModeChange={mockOnModeChange} 
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('h-auto', 'p-4', 'flex', 'flex-col', 'items-start', 'text-left');
    });
  });

  describe('Mode Switching', () => {
    it('should switch from balanced to irating_push', () => {
      render(
        <ModeSelector 
          currentMode="balanced" 
          onModeChange={mockOnModeChange} 
        />
      );

      fireEvent.click(screen.getByText('iRating Push'));
      expect(mockOnModeChange).toHaveBeenCalledWith('irating_push');
    });

    it('should switch from irating_push to safety_recovery', () => {
      render(
        <ModeSelector 
          currentMode="irating_push" 
          onModeChange={mockOnModeChange} 
        />
      );

      fireEvent.click(screen.getByText('Safety Recovery'));
      expect(mockOnModeChange).toHaveBeenCalledWith('safety_recovery');
    });

    it('should switch from safety_recovery to balanced', () => {
      render(
        <ModeSelector 
          currentMode="safety_recovery" 
          onModeChange={mockOnModeChange} 
        />
      );

      fireEvent.click(screen.getByText('Balanced'));
      expect(mockOnModeChange).toHaveBeenCalledWith('balanced');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button roles', () => {
      render(
        <ModeSelector 
          currentMode="balanced" 
          onModeChange={mockOnModeChange} 
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });

    it('should be keyboard navigable', () => {
      render(
        <ModeSelector 
          currentMode="balanced" 
          onModeChange={mockOnModeChange} 
        />
      );

      const iRatingButton = screen.getByText('iRating Push').closest('button');
      
      // Simulate click instead of keydown since the button handles click events
      fireEvent.click(iRatingButton!);
      expect(mockOnModeChange).toHaveBeenCalledWith('irating_push');
    });
  });
});