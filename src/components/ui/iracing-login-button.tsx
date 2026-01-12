import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * IRacingLoginButton - A custom button component styled to match iRacing's brand
 * 
 * Features:
 * - iRacing brand colors (blue gradient with orange accent border)
 * - Built-in racing flag icon
 * - Hover animations and scaling effects
 * - Two size variants: default and lg
 * - Fully accessible with proper focus states
 * 
 * @example
 * <IRacingLoginButton onClick={handleLogin} size="lg" />
 * <IRacingLoginButton onClick={handleLogin}>Custom Text</IRacingLoginButton>
 */

export interface IRacingLoginButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "default" | "lg"
}

const IRacingLoginButton = React.forwardRef<HTMLButtonElement, IRacingLoginButtonProps>(
  ({ className, size = "default", children, ...props }, ref) => {
    const sizeClasses = {
      default: "h-[60px] px-8 text-base",
      lg: "h-[70px] px-10 text-lg"
    }

    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center font-semibold rounded-lg",
          "transition-all duration-200 transform",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          
          // iRacing brand styling - blue background with orange accent
          "bg-gradient-to-r from-blue-600 to-blue-700",
          "text-white shadow-lg",
          "border-2 border-orange-500",
          
          // Hover effects
          "hover:from-blue-700 hover:to-blue-800",
          "hover:border-orange-400 hover:shadow-xl hover:scale-105",
          "hover:shadow-blue-500/25",
          
          // Active state
          "active:scale-100 active:shadow-md",
          
          // Focus state
          "focus-visible:ring-blue-500",
          
          sizeClasses[size],
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="flex items-center space-x-3">
          {/* iRacing logo placeholder - using a racing flag icon */}
          <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full">
            <svg 
              className="w-5 h-5 text-blue-600" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
              <path d="M21 3v18l-3-3-3 3V3h6z" fill="#f97316"/>
            </svg>
          </div>
          
          <span className="font-bold tracking-wide">
            {children || "Login with iRacing"}
          </span>
        </div>
      </button>
    )
  }
)

IRacingLoginButton.displayName = "IRacingLoginButton"

export { IRacingLoginButton }