"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { RacingBadge, ConfidenceBadge } from "@/lib/recommendations/types"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./tooltip"

interface RacingBadgeProps {
  badge: RacingBadge;
  className?: string;
}

export function RacingBadgeComponent({ badge, className }: RacingBadgeProps) {
  const { colors, icon, description, racingTheme } = badge;
  
  // Determine badge styling based on racing theme
  const getBadgeStyle = () => {
    if (racingTheme.checkeredFlag) {
      return {
        background: `linear-gradient(45deg, ${colors.primary} 25%, ${colors.accent} 25%, ${colors.accent} 50%, ${colors.primary} 50%, ${colors.primary} 75%, ${colors.accent} 75%)`,
        backgroundSize: '8px 8px'
      };
    }
    
    return {
      backgroundColor: colors.primary,
      borderColor: colors.accent
    };
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 font-semibold text-xs transition-all duration-200 hover:scale-105 max-w-[120px]",
              className
            )}
            style={{
              ...getBadgeStyle(),
              color: colors.text,
              borderColor: colors.accent
            }}
            // Add accessibility attributes
            role="button"
            tabIndex={0}
            aria-label={`Racing badge: ${badge.level}. ${description}`}
            aria-describedby="racing-badge-tooltip"
          >
            <span className="text-sm" aria-hidden="true">{icon}</span>
            <span className="capitalize truncate">{badge.level}</span>
          </div>
        </TooltipTrigger>
        
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-gray-900 text-white border-gray-700 bg-opacity-100"
          id="racing-badge-tooltip"
        >
          <p className="text-sm font-medium">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface ConfidenceBadgeProps {
  badge: ConfidenceBadge;
  className?: string;
}

export function ConfidenceBadgeComponent({ badge, className }: ConfidenceBadgeProps) {
  const { text, color, icon, description } = badge;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border min-h-[24px]",
              className
            )}
            style={{
              backgroundColor: `${color}20`,
              borderColor: color,
              color: color
            }}
            // Add accessibility attributes
            role="button"
            tabIndex={0}
            aria-label={`Confidence level: ${text}. ${description}`}
            aria-describedby="confidence-badge-tooltip"
          >
            <span className="text-xs" aria-hidden="true">{icon}</span>
            <span className="whitespace-nowrap">{text}</span>
          </div>
        </TooltipTrigger>
        
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-gray-900 text-white border-gray-700 bg-opacity-100"
          id="confidence-badge-tooltip"
        >
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}