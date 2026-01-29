/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Safelist classes that are dynamically composed (e.g., license badge colors)
  safelist: [
    // License badge colors - these are returned by getLicenseBadgeClass()
    'bg-red-600', 'text-white', 'border-red-700',       // Rookie
    'bg-orange-600', 'border-orange-700',               // Class D
    'bg-yellow-500', 'text-gray-800', 'border-yellow-600', // Class C
    'bg-green-600', 'border-green-700',                 // Class B
    'bg-blue-600', 'border-blue-700',                   // Class A
    'bg-gray-800', 'border-gray-900',                   // Pro
  ],
  theme: {
    extend: {
      colors: {
        // Racing-themed color palette
        racing: {
          // Primary racing colors
          red: '#DC2626',      // Ferrari red
          blue: '#1E40AF',     // Racing blue
          green: '#059669',    // Success/safety green
          yellow: '#D97706',   // Warning/caution yellow
          black: '#111827',    // Carbon black
          white: '#F9FAFB',    // Pure white
          
          // iRating colors (traditional)
          rookie: '#DEA584',   // Rookie orange
          d: '#FBBF24',        // D class yellow
          c: '#10B981',        // C class green
          b: '#3B82F6',        // B class blue
          a: '#8B5CF6',        // A class purple
          pro: '#EF4444',      // Pro red
          
          // Performance indicators
          improvement: '#10B981', // Green for positive delta
          decline: '#EF4444',     // Red for negative delta
          neutral: '#6B7280',     // Gray for neutral
          
          // UI grays
          gray: {
            50: '#F9FAFB',
            100: '#F3F4F6',
            200: '#E5E7EB',
            300: '#D1D5DB',
            400: '#9CA3AF',
            500: '#6B7280',
            600: '#4B5563',
            700: '#374151',
            800: '#1F2937',
            900: '#111827',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}