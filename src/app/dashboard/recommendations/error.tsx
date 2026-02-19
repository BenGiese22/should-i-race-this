'use client';

import { useEffect } from 'react';

/**
 * Error boundary for recommendations page
 * 
 * Requirements: 6.4, 6.5
 */
export default function RecommendationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Recommendations page error:', error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="bg-surface border border-border-subtle rounded-xl p-8 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-semantic-danger-bg flex items-center justify-center">
          <svg 
            className="w-6 h-6 text-semantic-danger" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Something went wrong
        </h2>
        
        <p className="text-text-secondary mb-4 max-w-md mx-auto">
          {error.message || 'Unable to load recommendations. Please try again.'}
        </p>
        
        <button
          onClick={reset}
          className="px-4 py-2 bg-racing-blue text-white rounded-lg font-medium hover:bg-racing-blue/90 transition-colors"
        >
          Try Again
        </button>
        
        {error.digest && (
          <p className="mt-4 text-xs text-text-tertiary">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
