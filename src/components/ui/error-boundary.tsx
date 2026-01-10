'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  isRetrying?: boolean;
  showNetworkStatus?: boolean;
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  retryCount = 0, 
  maxRetries = 3,
  isRetrying = false,
  showNetworkStatus = true
}: ErrorDisplayProps) {
  const errorMessage = error instanceof Error ? error.message : error;
  const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                        errorMessage.toLowerCase().includes('fetch') ||
                        errorMessage.toLowerCase().includes('connection');
  
  const getErrorTitle = () => {
    if (isNetworkError) return 'Connection Problem';
    if (errorMessage.includes('Unauthorized')) return 'Authentication Required';
    if (errorMessage.includes('404')) return 'Data Not Found';
    if (errorMessage.includes('500')) return 'Server Error';
    return 'Something Went Wrong';
  };

  const getErrorDescription = () => {
    if (isNetworkError) {
      return 'Please check your internet connection and try again.';
    }
    if (errorMessage.includes('Unauthorized')) {
      return 'Please log in again to continue.';
    }
    if (errorMessage.includes('404')) {
      return 'The requested data could not be found. It may have been moved or deleted.';
    }
    if (errorMessage.includes('500')) {
      return 'Our servers are experiencing issues. Please try again in a few moments.';
    }
    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  };

  const getActionableGuidance = () => {
    if (isNetworkError) {
      return [
        'Check your internet connection',
        'Try refreshing the page',
        'Disable any VPN or proxy temporarily'
      ];
    }
    if (errorMessage.includes('Unauthorized')) {
      return [
        'Log out and log back in',
        'Clear your browser cache',
        'Check if your session has expired'
      ];
    }
    if (errorMessage.includes('500')) {
      return [
        'Wait a few minutes and try again',
        'Check our status page for known issues',
        'Contact support if the problem continues'
      ];
    }
    return [
      'Refresh the page',
      'Try again in a few moments',
      'Contact support if the issue persists'
    ];
  };

  const canRetry = onRetry && retryCount < maxRetries;
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center space-y-4">
          {/* Error Icon */}
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
            {isNetworkError ? (
              isOnline ? <Wifi className="w-6 h-6 text-red-600" /> : <WifiOff className="w-6 h-6 text-red-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
          </div>

          {/* Error Title */}
          <div className="text-red-800 text-lg font-semibold">
            {getErrorTitle()}
          </div>

          {/* Error Description */}
          <div className="text-red-700 text-sm max-w-md">
            {getErrorDescription()}
          </div>

          {/* Technical Error Details (collapsible) */}
          <details className="text-left w-full max-w-md">
            <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
              Technical Details
            </summary>
            <div className="mt-2 p-3 bg-red-100 rounded text-xs text-red-800 font-mono break-all">
              {errorMessage}
            </div>
          </details>

          {/* Network Status */}
          {showNetworkStatus && (
            <div className="flex items-center gap-2 text-xs text-red-600">
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3" />
                  <span>Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </>
              )}
            </div>
          )}

          {/* Actionable Guidance */}
          <div className="text-left w-full max-w-md">
            <div className="text-sm font-medium text-red-800 mb-2">Try these steps:</div>
            <ul className="text-xs text-red-700 space-y-1">
              {getActionableGuidance().map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">•</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Retry Button */}
          {canRetry && (
            <div className="flex flex-col items-center gap-2">
              <Button 
                onClick={onRetry}
                disabled={isRetrying || !isOnline}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </>
                )}
              </Button>
              
              {retryCount > 0 && (
                <div className="text-xs text-red-600">
                  Attempt {retryCount + 1} of {maxRetries + 1}
                </div>
              )}
            </div>
          )}

          {/* No Retry Available */}
          {!canRetry && onRetry && (
            <div className="text-xs text-red-600">
              Maximum retry attempts reached. Please refresh the page or contact support.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}