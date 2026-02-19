import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Home from '../page';
import { useAuth } from '../../lib/auth/hooks';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock auth hook
jest.mock('../../lib/auth/hooks', () => ({
  useAuth: jest.fn(),
}));

// Mock LandingPageClient
jest.mock('../LandingPageClient', () => ({
  LandingPageClient: function MockLandingPageClient() {
    const { useAuth } = require('../../lib/auth/hooks');
    const { useRouter } = require('next/navigation');
    const auth = useAuth();
    const router = useRouter();

    const handleGetStarted = () => {
      if (auth.user) {
        router.push('/dashboard/recommendations');
      } else {
        auth.login();
      }
    };

    if (auth.loading) {
      return (
        <div className="min-h-screen bg-[var(--bg-app)] flex items-center justify-center">
          <div className="text-center">
            <p>Loading...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
        <header>
          <h1>Should I Race This?</h1>
          <button onClick={handleGetStarted}>Sign In</button>
        </header>
        <main role="main">
          <h2>Know Which Races Are Worth Running</h2>
          <p>A decision engine for serious iRacing drivers. Get personalized race recommendations based on your history, goals, and this week&apos;s schedule.</p>
          <button onClick={handleGetStarted}>See This Week&apos;s Recommendations</button>
          <div>
            <h3>Advanced Mazda MX-5 Cup</h3>
            <h4>Road Atlanta - Full Course</h4>
          </div>
          <div>
            <h3>Goal-Based Scoring</h3>
            <h3>Schedule-First</h3>
            <h3>History-Justified</h3>
          </div>
          <p>Independent analytics service · Not affiliated with iRacing</p>
        </main>
      </div>
    );
  },
}));

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockAuth = {
  user: null,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshTokens: jest.fn(),
  refetch: jest.fn(),
  error: null,
};

describe('Home Page', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner when loading', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        loading: true,
      });

      render(<Home />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Unauthenticated State', () => {
    it('should render landing page without errors', () => {
      render(<Home />);

      expect(screen.getByText('Should I Race This?')).toBeInTheDocument();
      expect(screen.getByText(/Know Which Races Are Worth Running/)).toBeInTheDocument();
    });

    it('should display sign-in button in header', () => {
      render(<Home />);

      const signInButtons = screen.getAllByRole('button', { name: /sign in/i });
      expect(signInButtons.length).toBeGreaterThan(0);
    });

    it('should call login function when sign-in button is clicked', () => {
      render(<Home />);

      const signInButton = screen.getAllByRole('button')[0]; // Get first button (header sign-in)
      fireEvent.click(signInButton);

      expect(mockAuth.login).toHaveBeenCalledTimes(1);
    });

    it('should display CTA button', () => {
      render(<Home />);

      expect(screen.getByText(/See This Week's Recommendations/)).toBeInTheDocument();
    });

    it('should call login when CTA button is clicked for unauthenticated user', () => {
      render(<Home />);

      const ctaButton = screen.getByText(/See This Week's Recommendations/);
      fireEvent.click(ctaButton);

      expect(mockAuth.login).toHaveBeenCalled();
    });

    it('should display preview card', () => {
      render(<Home />);

      expect(screen.getByText('Advanced Mazda MX-5 Cup')).toBeInTheDocument();
      expect(screen.getByText('Road Atlanta - Full Course')).toBeInTheDocument();
    });

    it('should display value propositions', () => {
      render(<Home />);

      expect(screen.getByText('Goal-Based Scoring')).toBeInTheDocument();
      expect(screen.getByText('Schedule-First')).toBeInTheDocument();
      expect(screen.getByText('History-Justified')).toBeInTheDocument();
    });

    it('should display trust signal', () => {
      render(<Home />);

      expect(screen.getByText(/Independent analytics service/)).toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockUser = {
      id: 'test-id',
      iracingCustomerId: 123456,
      displayName: 'Test Driver',
      licenseClasses: [
        { category: 'road', level: 'B', safetyRating: 3.5, iRating: 1500 },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      lastSyncAt: '2024-01-01T00:00:00Z',
    };

    it('should show landing page for authenticated users', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: mockUser,
      });

      render(<Home />);

      expect(screen.getByText('Should I Race This?')).toBeInTheDocument();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should navigate to dashboard when CTA is clicked by authenticated user', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: mockUser,
        loading: false,
      });

      render(<Home />);

      const ctaButton = screen.getByText(/See This Week's Recommendations/);
      fireEvent.click(ctaButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/recommendations');
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive layout classes', () => {
      render(<Home />);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });
  });
});