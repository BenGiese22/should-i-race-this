import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Home from '../page';
import { useAuth } from '../../lib/auth/hooks';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock auth hook
jest.mock('../../lib/auth/hooks', () => ({
  useAuth: jest.fn(),
}));

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) {
    return <img src={src} alt={alt} {...props} />;
  };
});

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
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
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useAuth as jest.Mock).mockReturnValue(mockAuth);
    (mockSearchParams.get as jest.Mock).mockReturnValue(null);
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
      expect(screen.getByRole('main')).toHaveClass('min-h-screen');
    });
  });

  describe('Unauthenticated State', () => {
    it('should display landing page with value proposition', () => {
      render(<Home />);

      expect(screen.getByText('Should I Race This?')).toBeInTheDocument();
      expect(screen.getByText(/Make smarter racing decisions/)).toBeInTheDocument();
      expect(screen.getByText('Performance Analytics')).toBeInTheDocument();
      expect(screen.getByText('Smart Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Secure iRacing Integration')).toBeInTheDocument();
    });

    it('should display login button with image', () => {
      render(<Home />);

      const loginButton = screen.getByRole('button');
      expect(loginButton).toBeInTheDocument();
      
      const loginImage = screen.getByAltText('Login with iRacing');
      expect(loginImage).toBeInTheDocument();
      expect(loginImage).toHaveAttribute('src', '/login_with_iracing_button.png');
    });

    it('should call login function when login button is clicked', () => {
      render(<Home />);

      const loginButton = screen.getByRole('button');
      fireEvent.click(loginButton);

      expect(mockAuth.login).toHaveBeenCalledTimes(1);
    });

    it('should display how it works section', () => {
      render(<Home />);

      expect(screen.getByText('How It Works')).toBeInTheDocument();
      expect(screen.getByText('Connect')).toBeInTheDocument();
      expect(screen.getByText('Analyze')).toBeInTheDocument();
      expect(screen.getByText('Recommend')).toBeInTheDocument();
      expect(screen.getByText('Improve')).toBeInTheDocument();
    });

    it('should display security features', () => {
      render(<Home />);

      expect(screen.getByText('Secure OAuth2')).toBeInTheDocument();
      expect(screen.getByText('No Data Sharing')).toBeInTheDocument();
      expect(screen.getByText('Always Free')).toBeInTheDocument();
    });
  });

  describe('Authenticated State', () => {
    const mockUser = {
      id: 'test-id',
      iracingCustomerId: 123456,
      displayName: 'Test Driver',
      licenseClasses: [
        { category: 'road', level: 'B', safetyRating: 3.5, iRating: 1500 },
        { category: 'oval', level: 'C', safetyRating: 4.0, iRating: 1200 },
      ],
      createdAt: '2024-01-01T00:00:00Z',
      lastSyncAt: '2024-01-01T00:00:00Z',
    };

    it('should display welcome message when user is authenticated', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: mockUser,
      });

      render(<Home />);

      expect(screen.getByText('Welcome to the Track!')).toBeInTheDocument();
      expect(screen.getByText(/Your iRacing account is now connected/)).toBeInTheDocument();
    });

    it('should display user profile information', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: mockUser,
      });

      render(<Home />);

      expect(screen.getByText('Driver Profile')).toBeInTheDocument();
      expect(screen.getByText('Test Driver')).toBeInTheDocument();
      expect(screen.getByText('123456')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // License classes count
    });

    it('should display license classes information', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: mockUser,
      });

      render(<Home />);

      expect(screen.getByText('road:')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('oval:')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('should display dashboard and logout buttons', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: mockUser,
      });

      render(<Home />);

      expect(screen.getByText('View Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Test API Connection')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should call logout function when logout button is clicked', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: mockUser,
      });

      render(<Home />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockAuth.logout).toHaveBeenCalledTimes(1);
    });

    it('should open API test in new window when test button is clicked', () => {
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: mockUser,
      });

      // Mock window.open
      const mockOpen = jest.fn();
      Object.defineProperty(window, 'open', {
        value: mockOpen,
        writable: true,
      });

      render(<Home />);

      const testButton = screen.getByText('Test API Connection');
      fireEvent.click(testButton);

      expect(mockOpen).toHaveBeenCalledWith('/api/auth/me', '_blank');
    });
  });

  describe('Auth Success State', () => {
    it('should display success state when auth=success in URL params', () => {
      (mockSearchParams.get as jest.Mock).mockReturnValue('success');

      render(<Home />);

      expect(screen.getByText('Welcome to the Track!')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for mobile and desktop', () => {
      // Ensure we're in unauthenticated state
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: null,
        loading: false,
      });
      (mockSearchParams.get as jest.Mock).mockReturnValue(null);

      render(<Home />);

      const main = screen.getByRole('main');
      expect(main).toHaveClass('min-h-screen');

      // Check for responsive grid classes in unauthenticated state
      const valuePropsSection = screen.getByText('Performance Analytics').closest('div')?.parentElement;
      expect(valuePropsSection).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3');
    });

    it('should have responsive text sizing', () => {
      // Ensure we're in unauthenticated state
      (useAuth as jest.Mock).mockReturnValue({
        ...mockAuth,
        user: null,
        loading: false,
      });
      (mockSearchParams.get as jest.Mock).mockReturnValue(null);

      render(<Home />);

      const heading = screen.getByText('Should I Race This?');
      expect(heading).toHaveClass('text-5xl', 'md:text-6xl');
    });
  });
});