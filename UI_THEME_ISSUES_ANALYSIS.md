# UI Theme/Style Inconsistencies Analysis

## Date: February 2, 2026
## Testing Environment: Puppeteer Browser Automation

---

## Issues Identified

### 1. **Dashboard Page - Dropdown Styling Inconsistencies**

#### Location: Performance Analytics Dashboard (`/dashboard`)

#### Problem Areas:

**A. "Group By" Dropdown (Top Section)**
- **Dark Mode**: Dropdown appears completely black with no visible text
- **Light Mode**: Works correctly with proper contrast
- **Issue**: Missing or incorrect dark mode text color styling

**B. "Rows" Dropdown (Bottom Pagination)**
- **Dark Mode**: Dropdown appears completely black with no visible text
- **Light Mode**: Works correctly with proper contrast  
- **Issue**: Same as Group By - missing dark mode text color

**C. Search Input Field**
- **Both Modes**: Appears to work correctly
- **No issues detected**

---

## Root Cause Analysis

### Current Styling (from `src/app/dashboard/page.tsx`):

```tsx
// Group By Dropdown (Line ~350)
className="w-full px-3 py-2 border border-racing-gray-300 dark:border-racing-gray-600 rounded-lg bg-white dark:bg-racing-gray-800 text-racing-gray-900 dark:text-white focus:ring-2 focus:ring-racing-blue focus:border-transparent"

// Rows Dropdown (Line ~707)
className="px-2 py-1 text-sm border border-racing-gray-300 dark:border-racing-gray-600 rounded bg-white dark:bg-racing-gray-800 text-racing-gray-900 dark:text-white focus:ring-2 focus:ring-racing-blue focus:border-transparent"
```

### The Problem:
The styling **looks correct** in the code with `dark:text-white`, but the dropdowns are rendering with black text on dark background in the browser. This suggests:

1. **CSS Specificity Issue**: Another style might be overriding the dark mode text color
2. **Select Element Quirk**: Native `<select>` elements may not properly inherit dark mode styles
3. **Option Elements**: The `<option>` elements inside might need explicit styling

---

## Screenshots Captured

1. `homepage-initial.png` - Landing page (dark mode)
2. `dashboard-main.png` - Dashboard after login (dark mode)
3. `dashboard-light-mode.png` - Dashboard in light mode
4. `dashboard-bottom-dropdowns-light.png` - Pagination area (light mode) ✅
5. `dashboard-bottom-dropdowns-dark.png` - Pagination area (dark mode) ❌
6. `recommendations-page.png` - Recommendations page (dark mode)
7. `recommendations-light-mode.png` - Recommendations page (light mode)

---

## Additional Notes from OAuth Flow

### OAuth Integration Observations:
- OAuth flow works smoothly through iRacing's login portal
- Credentials used: bengiese22@gmail.com
- Successfully redirected back to application
- User profile data loaded correctly
- No theme issues on the OAuth pages (external iRacing pages)

---

## Recommendations for Fixes

### Option 1: Add Explicit Option Styling
```tsx
<select className="...existing classes...">
  <option value="series" className="bg-white dark:bg-racing-gray-800 text-racing-gray-900 dark:text-white">
    Series
  </option>
</select>
```

### Option 2: Use CSS Variables
Define select text colors in globals.css with proper dark mode support

### Option 3: Force Color Inheritance
Add `[color-scheme:light] dark:[color-scheme:dark]` to ensure proper rendering

---

## Priority: HIGH
These dropdown visibility issues significantly impact usability in dark mode, which appears to be the default theme.
