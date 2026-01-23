# Schedule Data Pipeline Audit Report

**Date**: January 2025
**Auditor**: Claude Code
**Status**: Issues Identified

---

## Executive Summary

The schedule data pipeline has **multiple issues** that explain why recommendations may show ineligible series and have incorrect license requirements. The core problems are:

1. **License level extraction may be failing** - Falls back to "Rookie" when fields aren't found
2. **Category extraction uses legacy "road" value** - Stored as "road" but user licenses use "sports_car"/"formula_car"
3. **Fixed/open setup detection is inverted** - Uses `!scheduleEntry.fixed_setup` but field may not exist

---

## Data Flow Analysis

### Step 1: API Call
**File**: `src/lib/iracing/schedule.ts:139-157`

```typescript
const seasonsResponse = await makeAuthenticatedRequest(
  userId,
  '/series/seasons',
  {
    season_year: season.year,
    season_quarter: season.quarter,
    include_series: 1
  }
);
```

**API Endpoint**: `/series/seasons` returns an array of season objects, each containing:
- `season_id`, `series_id`, `season_name`
- `schedules[]` - Array of week schedules
- `license_group` - **This is where license comes from** (on season, not schedule entry)

### Step 2: License Extraction
**File**: `src/lib/iracing/schedule.ts:71-85`

```typescript
function extractLicenseLevel(series: any): string {
  if (series.license_group !== undefined) {
    const licenseLevel = LicenseHelper.fromIRacingGroup(series.license_group);
    return licenseLevel;
  }
  if (series.min_license_level !== undefined) {
    const licenseLevel = LicenseHelper.fromIRacingGroup(series.min_license_level);
    return licenseLevel;
  }
  return LicenseLevel.ROOKIE; // ⚠️ FALLBACK - May happen too often
}
```

**Called with**: `seasonData` object (line 215)

**ISSUE**: If the iRacing API response doesn't include `license_group` or `min_license_level` at the expected location, ALL series get "Rookie" license requirement.

### Step 3: Category Extraction
**File**: `src/lib/iracing/schedule.ts:90-98`

```typescript
function extractCategory(scheduleEntry: any): Category {
  if (scheduleEntry.category) {
    return CategoryHelper.fromScheduleCategory(scheduleEntry.category);
  }
  if (scheduleEntry.category_id !== undefined) {
    return mapScheduleCategory(scheduleEntry.category_id);
  }
  return Category.SPORTS_CAR; // ⚠️ FALLBACK
}
```

**Called with**: Individual `scheduleEntry` from the schedules array (line 216)

### Step 4: Category Mapping
**File**: `src/lib/iracing/schedule.ts:104-118`

```typescript
function mapScheduleCategory(categoryId: number | string): Category {
  const id = typeof categoryId === 'string' ? parseInt(categoryId, 10) : categoryId;
  switch (id) {
    case 1: return Category.OVAL;
    case 2: return Category.SPORTS_CAR; // Legacy road -> sports_car
    case 3: return Category.DIRT_OVAL;
    case 4: return Category.DIRT_ROAD;
    case 5: return Category.SPORTS_CAR;
    case 6: return Category.FORMULA_CAR;
    default: return Category.SPORTS_CAR;
  }
}
```

**POTENTIAL ISSUE**: If `scheduleEntry.category` is a string like "road", it goes through `CategoryHelper.fromScheduleCategory()` which maps it correctly. But the stored value might still be the raw string.

### Step 5: Database Storage
**File**: `src/lib/iracing/schedule.ts:218-232`

```typescript
const dbEntry = {
  seriesId,
  seriesName,
  trackId,
  trackName,
  licenseRequired,  // String from extractLicenseLevel
  category,         // String from extractCategory (should be Category enum)
  raceLength,
  hasOpenSetup: !scheduleEntry.fixed_setup, // ⚠️ Boolean inversion
  ...
};
```

**ISSUE with hasOpenSetup**: If `scheduleEntry.fixed_setup` is undefined, `!undefined` = `true`, meaning ALL series would appear as "open setup" by default.

---

## Evidence from Sample Data

From `recommendations_road_response.json`:

```json
{
  "seriesName": "BMW M2 Cup by Nitro Concepts - 2026 Season 1",
  "licenseRequired": "rookie",  // ⚠️ Is this correct?
  "category": "road",           // ⚠️ Should be "sports_car"
  "hasOpenSetup": true
}
```

**Problems Observed**:
1. `category: "road"` - This is the legacy value, NOT the 5-category system
2. `licenseRequired: "rookie"` - BMW M2 Cup might require higher license
3. All `globalStats` are identical (defaults, not real data)

---

## User License Storage

**File**: `src/lib/auth/db.ts:360-376`

User licenses ARE stored with correct 5-category values:
```typescript
function mapLicenseCategory(categoryId: number | string): Category {
  switch (id) {
    case 1: return Category.OVAL;
    case 2: return Category.SPORTS_CAR;
    case 5: return Category.SPORTS_CAR;
    case 6: return Category.FORMULA_CAR;
    ...
  }
}
```

So users have licenses like: `["sports_car", "formula_car", "oval", "dirt_oval", "dirt_road"]`

---

## License Filter Mismatch

**File**: `src/lib/recommendations/license-filter.ts:70-78`

```typescript
const userLicensesInCategory = userHistory.licenseClasses.filter(
  license => license.category === opportunity.category
);

if (userLicensesInCategory.length === 0) {
  console.log(`Debug: User has no license for category ${opportunity.category}`);
  return false;
}
```

**THE ROOT CAUSE**:
- User has license for `category: "sports_car"`
- Schedule entry has `category: "road"`
- Filter: `"sports_car" === "road"` → **FALSE**
- Result: User appears to have no license for "road" category

---

## Root Cause Analysis: Setup Type Bug

### Current Code (Broken)
**File**: `src/lib/iracing/schedule.ts:226`
```typescript
hasOpenSetup: !scheduleEntry.fixed_setup
```

### The Bug
- If `scheduleEntry.fixed_setup` is `undefined`, then `!undefined` = `true`
- This means ALL series appear as "open setup" when the field is missing

### API Fields Available (from old project research)

The iRacing API provides these fields for setup type at **multiple levels**:

**Season/Series Level:**
```typescript
schedule.fixed_setup: boolean
schedule.open_setup: boolean
seasonList[].fixed_setup: boolean
seasonList[].open_setup: boolean
```

**Schedule Entry (Week) Level:**
```typescript
week.fixed_setup: boolean  // Per-week override
```

### Correct Implementation (from old project)
**File**: `should-i-race-this-old/src/server/ingest/schedule.ts:289-296, 357`

```typescript
// Get series-level defaults
const seriesFixed = schedule.fixed_setup ??
  seasonList.find((s) => s.season_id === selectedSeasonId)?.fixed_setup ?? null;
const seriesOpen = schedule.open_setup ??
  seasonList.find((s) => s.season_id === selectedSeasonId)?.open_setup ?? null;

// Per-week, falling back to series default, then false
const isFixedSetup = week.fixed_setup ?? seriesFixed ?? false;
```

### Recommended Fix
```typescript
// Option 1: Use fixed_setup with proper default
const isFixedSetup = scheduleEntry.fixed_setup ?? seasonData.fixed_setup ?? true; // Default to fixed
hasOpenSetup: !isFixedSetup

// Option 2: Check both fields explicitly
hasOpenSetup: seasonData.open_setup === true ||
              (seasonData.fixed_setup === false && scheduleEntry.fixed_setup !== true)
```

---

## Category ID Mapping Discrepancy

### Critical Finding: Different Category Mappings!

**Old project** (`should-i-race-this-old/src/server/ingest/member.ts:27-32`):
```typescript
const CATEGORY_MAP: Record<number, string> = {
  1: "road",     // <-- Note: 1 = road
  2: "oval",     // <-- Note: 2 = oval
  3: "dirt_road",
  4: "dirt_oval",
};
```

**New project** (`src/lib/iracing/schedule.ts:104-118`):
```typescript
switch (id) {
  case 1: return Category.OVAL;       // <-- Note: 1 = oval
  case 2: return Category.SPORTS_CAR; // <-- Note: 2 = sports_car (legacy road)
  case 3: return Category.DIRT_OVAL;
  case 4: return Category.DIRT_ROAD;
  case 5: return Category.SPORTS_CAR;
  case 6: return Category.FORMULA_CAR;
}
```

**This is a MISMATCH!** The old and new projects interpret category IDs differently.

### Investigation Needed
Need to verify with actual API responses what the correct category_id mapping is:
- Is `1` = road/sports_car or oval?
- Is `2` = oval or road?

---

## Recommended Fixes

### Fix 1: Fix hasOpenSetup Logic

```typescript
// Current (buggy)
hasOpenSetup: !scheduleEntry.fixed_setup

// Fixed - check season level first, then schedule entry
const isFixedSetup = scheduleEntry.fixed_setup ?? seasonData.fixed_setup ?? true;
hasOpenSetup: !isFixedSetup
```

### Fix 2: Add Defensive Logging for License Level

```typescript
function extractLicenseLevel(series: any): string {
  console.log('extractLicenseLevel - checking fields:', {
    license_group: series.license_group,
    min_license_level: series.min_license_level,
    series_id: series.series_id
  });

  if (series.license_group !== undefined) {
    return LicenseHelper.fromIRacingGroup(series.license_group);
  }

  console.warn(`No license_group found for series ${series.series_id}, defaulting to Rookie`);
  return LicenseLevel.ROOKIE;
}
```

### Fix 3: Verify Category ID Mapping

Create a debug endpoint that logs raw API responses to verify:
1. What `category_id` values actually come from the API
2. How they map to road/oval/dirt categories
3. Whether sports_car vs formula_car distinction is available

### Fix 4: Ensure Category is Normalized on Storage

```typescript
// Before storing
const category = CategoryHelper.normalize(extractCategory(scheduleEntry));
```

### Fix 5: Migration Script for Existing Data

```sql
-- Check current category distribution
SELECT DISTINCT category, COUNT(*) FROM schedule_entries GROUP BY category;

-- If 'road' values exist, they need migration
UPDATE schedule_entries SET category = 'sports_car' WHERE category = 'road';
```

---

## Validation Queries

Run these to diagnose current data:

```sql
-- Check what categories are stored
SELECT DISTINCT category, COUNT(*) FROM schedule_entries GROUP BY category;

-- Check what license levels are stored
SELECT DISTINCT license_required, COUNT(*) FROM schedule_entries GROUP BY license_required;

-- Check if any non-rookie licenses exist
SELECT * FROM schedule_entries WHERE license_required != 'Rookie' LIMIT 10;

-- Check user license categories
SELECT DISTINCT category FROM license_classes;
```

---

## Next Steps

1. **Validate hypothesis**: Run debug endpoint to see raw API response
2. **Check database values**: Run SQL queries above
3. **Add better logging**: Instrument the sync process
4. **Fix category mapping**: Ensure "road" → "sports_car" transformation happens
5. **Fix license extraction**: Understand where iRacing puts `license_group`
6. **Re-sync data**: After fixes, clear and resync schedule data
