import React, { useEffect, useState } from 'react';
import { RefreshCw, Check } from 'lucide-react';

interface DataRefreshTimestampProps {
  lastSyncTime: string;
  isRefreshing?: boolean;
  showRefreshConfirmation?: boolean;
}

export function DataRefreshTimestamp({ 
  lastSyncTime, 
  isRefreshing = false,
  showRefreshConfirmation = false 
}: DataRefreshTimestampProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (showRefreshConfirmation) {
      setShowConfirmation(true);
      const timer = setTimeout(() => {
        setShowConfirmation(false);
      }, 4000);
      
      return () => clearTimeout(timer);
    }
  }, [showRefreshConfirmation]);

  return (
    <div className="flex items-center gap-3">
      {/* Refresh confirmation */}
      {showConfirmation && (
        <div 
          className={`
            flex items-center gap-2 px-3 py-1.5 
            bg-[var(--semantic-positive)] bg-opacity-10 
            border border-[var(--semantic-positive)] border-opacity-20
            rounded-md
            transition-all duration-300
            ${showConfirmation ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <Check className="w-3.5 h-3.5 text-[var(--semantic-positive)]" />
          <span className="text-xs font-medium text-[var(--semantic-positive)]">
            Recommendations refreshed
          </span>
        </div>
      )}
      
      {/* Timestamp with refresh indicator */}
      <div className="flex items-center gap-2">
        {isRefreshing && (
          <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-info)] animate-spin" />
        )}
        <span className="text-xs text-[var(--text-tertiary)]">
          {isRefreshing ? 'Updating...' : `Updated ${lastSyncTime}`}
        </span>
      </div>
    </div>
  );
}
