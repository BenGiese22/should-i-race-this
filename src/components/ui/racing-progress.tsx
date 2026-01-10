"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ProgressBar } from "@/lib/recommendations/types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./tooltip"

interface RacingProgressProps {
  progressBar: ProgressBar;
  className?: string;
  showIcon?: boolean;
  showValue?: boolean;
}

export function RacingProgress({ 
  progressBar, 
  className, 
  showIcon = true, 
  showValue = true 
}: RacingProgressProps) {
  const { value, gradient, icon, tooltip } = progressBar;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn("flex items-center gap-2", className)}
            role="progressbar"
            aria-valuenow={Math.round(value)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${Math.round(value)}%. ${tooltip}`}
            aria-describedby="racing-progress-tooltip"
            tabIndex={0}
          >
            {showIcon && (
              <span 
                className="text-sm" 
                aria-hidden="true"
              >
                {icon}
              </span>
            )}
            
            <div className="flex-1 relative">
              {/* Background track */}
              <div 
                className="h-3 w-full rounded-full bg-gray-200 overflow-hidden"
              >
                {/* Progress fill with solid color */}
                <div
                  className="h-full rounded-full transition-all duration-300 ease-out"
                  style={{
                    width: `${Math.max(0, Math.min(100, value))}%`,
                    backgroundColor: gradient.currentColor
                  }}
                />
              </div>
              
              {/* Racing-themed styling overlay */}
              <div className="absolute inset-0 rounded-full border border-gray-300 pointer-events-none" />
            </div>
            
            {showValue && (
              <span className="text-xs font-medium text-gray-600 min-w-[2rem] text-right">
                {Math.round(value)}
              </span>
            )}
          </div>
        </TooltipTrigger>
        
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-gray-900 text-white border-gray-700 bg-opacity-100"
          id="racing-progress-tooltip"
        >
          <p className="text-sm">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}