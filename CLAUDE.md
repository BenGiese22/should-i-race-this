# Should I Race This? - Project Context

## CRITICAL: Validation-First Development Principle

**This project has experienced significant issues with:**
- iRacing API data not being pulled correctly
- Data not being clean or properly formatted
- Data mapping issues between API responses and database storage
- Scoring algorithm not behaving as intended

**Core Rule for All Development:**
> Before implementing new features, ALWAYS validate that existing systems are working correctly. Provide clear evidence through tests and manual validation that data flows are accurate.

**When working on this project:**
1. **Verify data accuracy** - Check that API data matches what's stored in the database
2. **Test edge cases** - Ensure null values, missing data, and unexpected formats are handled
3. **Validate calculations** - Confirm scoring factors produce expected results given known inputs
4. **Communicate findings** - Clearly explain what's working and what's not
5. **Fix broken tests first** - Don't add features on top of failing test suites

**The user needs CONFIDENCE that core systems work as intended before building on top of them.**

---

## Project Vision

**"Should I Race This?"** is a data-driven iRacing recommendation system that helps drivers make smarter racing decisions. The core value proposition: analyze a driver's historical performance and current racing schedule to answer the question *"Given my racing history, should I race this particular series/track combination?"*

### Target Audience
- iRacing drivers looking to improve their iRating and/or Safety Rating
- Drivers who want data-driven insights rather than gut feelings
- Planned for broader public use with potential subscription model

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **State Management**: Zustand + React Query (TanStack Query)
- **Authentication**: iRacing OAuth2 with PKCE flow
- **Testing**: Jest + fast-check (property-based) + Playwright (E2E)
- **Deployment**: Vercel

## Core Features

### 8-Factor Scoring Algorithm
Each racing opportunity is scored 0-100 across these factors:
1. **Performance** - Expected position delta based on history
2. **Safety** - Incident risk prediction
3. **Consistency** - Finish position variability
4. **Predictability** - Field strength stability
5. **Familiarity** - Experience with series/track combination
6. **Fatigue Risk** - Race length and time commitment
7. **Attrition Risk** - DNF probability
8. **Time Volatility** - Participation level fluctuations

### Three Recommendation Modes
- **Balanced** - Equal weights across all factors
- **iRating Push** - Prioritizes performance gains, higher risk tolerance
- **Safety Recovery** - Prioritizes incident avoidance, lower risk

### License System
The system uses 5 distinct iRacing license categories:
- `oval`
- `sports_car`
- `formula_car`
- `dirt_oval`
- `dirt_road`

**Important**: Sports car and formula car are separate categories (not merged as "road"). The migration from a merged "road" category is complete, though some UI elements may still need polish.

### Data Scope
- **Primary focus**: Current season + previous season performance
- **Rationale**: Users are (ideally) improving, so historical data from too far back may not be relevant
- **Future consideration**: Option for users to analyze deeper historical data if desired

## Current Development Status

### Kiro Specs Structure
The project uses Kiro for specification management. Specs are in `.kiro/specs/`:

1. **racing-analytics-dashboard** - Core system (Tasks 1-10 complete, Tasks 11-14 pending)
2. **recommendations-refinements** - UI/UX improvements (COMPLETE per tasks.md)
3. **recommendations-analytics-integration** - Data source centralization
4. **theme-system** - Light/dark/system themes (FUTURE)

### Current Priority
1. ~~**Fix broken tests**~~ - ✅ COMPLETE (Jan 2025) - Most tests fixed, some skipped with documentation
2. ~~**Address schedule data issues**~~ - ✅ COMPLETE (Jan 2025) - Pipeline fixed, verified with re-sync
3. **Performance Analytics Dashboard improvements** - See Priority 2 in Next Steps
4. **Navigation & User Flow Rework** - See Priority 3 in Next Steps
5. **Recommendations Page Rework** - See Priority 4 in Next Steps
6. **Return to remaining core tasks** (11-14):
   - Task 11: Performance & Security Optimization
   - Task 12: End-to-End Testing (Playwright)
   - Task 13: Final Integration & Deployment
   - Task 14: Final System Validation
7. **Theme system** - Future feature

## Known Issues & Areas Needing Work

### Test Status (Updated Jan 2025)

**Most tests now passing after fixes. Remaining issues documented below.**

#### Fixed Tests (Previously Broken)
The following tests were fixed during the Jan 2025 test remediation:

1. `license-processing.test.ts` - Fixed license_group mapping expectations (iRacing uses 1=Rookie through 6=Pro)
2. `scoring.property.test.ts` - Fixed familiarity filter logic (AND instead of OR)
3. `real-data-usage.property.test.ts` - Added `noNaN: true` to float generators, updated 'road' → 'sports_car'
4. `page.test.tsx` (dashboard) - Fixed default session type selector ('All Sessions' not 'Race')
5. `modal-card-interaction.property.test.tsx` - Added cleanup() between fast-check iterations
6. `modal-click-outside.property.test.tsx` - Added cleanup(), fixed backdrop selector

#### Skipped Tests (Need Future Work)
**File:** `src/lib/recommendations/__tests__/analytics-integration.property.test.ts`

**5 tests skipped with TODO comments:**
- Property 3c: Handles inconsistent data gracefully
- Property 3d: Maintains scoring consistency
- Property 3e: Applies confidence adjustments correctly
- Property 3: Uses real analytics data for scoring
- Property 3a: Handles empty analytics results

**Root Cause:** These tests require mocking Drizzle ORM's query builder pattern (`.select().from().leftJoin().where()`). The current mock approach doesn't fully support the chained query pattern, and results get cached between fast-check iterations causing false positives/negatives.

**To Fix:** Need to either:
1. Create a proper Drizzle query builder mock that supports method chaining
2. Refactor tests to use integration testing with a test database
3. Extract the query building into a separate testable function

#### Potentially Flaky Tests
**File:** `src/lib/recommendations/__tests__/real-data-usage.property.test.ts`

**Issue:** Property-based tests generate random category values, but the test data may not always include a matching license class for the generated opportunity category. This can cause intermittent failures when the scoring engine can't find a user license for the opportunity's category.

**Mitigation Applied:** Added a `matchingLicense` that always matches the opportunity's category, but edge cases may still occur with certain random data combinations.

### Schedule Data Issues - RESOLVED
**Status:** Fixed as of Jan 2025

The schedule data pipeline was fixed to properly:
- ✅ Extract license requirements from nested API structure (`allowed_licenses[0].min_license_level`)
- ✅ Normalize category names (iRacing uses `sports_car` and `formula_car`, not merged `road`)
- ✅ Handle setup types correctly (fixed vs open from `fixed_setup` boolean)

**Debug endpoints available:**
- `GET /api/debug/schedule-api-structure` - View raw API response structure
- `GET/POST /api/debug/schedule-resync` - Re-sync schedule data with verification

### Testing
- Testing is a **core priority** for this application
- Most test suites now passing
- Property-based tests exist with fast-check (note: require cleanup() between iterations)
- E2E tests with Playwright are incomplete

### UI Polish Needed
- License category display consistency
- Clear indication of sports_car vs formula_car
- Recommendations card layout improvements
- Score visualization refinements

## Development Guidelines

### OAuth Requirements
- **CRITICAL**: Local development MUST run on `http://127.0.0.1:3000`
- iRacing OAuth redirect URI is configured for this exact URL
- If port 3000 is occupied, stop the conflicting process rather than using alternative port

### Session Type Handling
- Recommendations only consider actual race sessions (`sessionType = 'race'`)
- Practice, qualifying, and time trial sessions are excluded from recommendation calculations
- This ensures scoring reflects competitive race performance only

### Official vs Unofficial Races
iRacing has two types of races that affect data quality:

**Official Races:**
- Affect iRating and Safety Rating
- Have valid Strength of Field (SOF) calculations
- Have proper starting positions from qualifying
- Should be the primary data source for recommendations

**Unofficial Races:**
- Do NOT affect iRating (Safety Rating still affected)
- Return `-1` for `event_strength_of_field` from iRacing API
- May return `-1` for `starting_position` (no qualifying, rolling starts)
- Examples: BMW M2 Cup, some rookie series, fun series

**Implications for Recommendations:**
- Unofficial race data should be excluded or weighted lower in scoring calculations
- Position delta calculations should exclude races with `-1` start/finish positions
- SOF-based calculations should exclude races with `-1` SOF
- The `official_session` field from iRacing API is the authoritative source for official status
  - Currently stored in `rawData` JSON field
  - Future improvement: Store as dedicated column for easier querying

**Practice Sessions in Database:**
- The iRacing API can return practice sessions (event_type: 2) alongside races
- Practice sessions have: SOF = -1, starting_position = -1, odd start times (not on :00/:15/:30/:45)
- The `sessionType` column correctly stores "practice" vs "race"
- Analytics queries filter to `sessionType = 'race'` to exclude practice data
- Race details API also filters to only show race sessions

### Data Confidence Levels
Recommendations display confidence based on available data:
- **High Confidence** - 3+ races in series/track combination
- **Estimated** - Cross-series performance analysis
- **No Personal Data** - Using global defaults only

### Position Delta Convention
- **Positive delta** = improvement (started lower position number, finished higher)
- **Negative delta** = decline (started higher position number, finished lower)
- Calculated as: `starting_position - finishing_position`

## File Structure Overview

```
src/
├── app/
│   ├── api/           # API routes
│   │   ├── auth/      # OAuth endpoints
│   │   ├── data/      # Data sync, analytics, schedule
│   │   ├── debug/     # Debug endpoints (development)
│   │   └── recommendations/
│   ├── dashboard/     # Main dashboard pages
│   └── oauth/         # OAuth callback handling
├── components/
│   ├── recommendations/  # Recommendation UI components
│   └── ui/               # Shared UI components
└── lib/
    ├── auth/          # Authentication logic
    ├── db/            # Database schema, analytics queries
    ├── iracing/       # iRacing API client, sync, session types
    ├── recommendations/  # Recommendation engine, scoring
    └── types/         # TypeScript type definitions
```

## Key Orchestrator Files

- `src/lib/recommendations/engine.ts` - Main recommendation orchestrator
- `src/lib/db/analytics.ts` - Performance analytics queries
- `src/lib/auth/hooks.ts` - Authentication state management
- `src/app/api/recommendations/route.ts` - Primary recommendation API

## Testing Commands

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run lint          # ESLint
```

## Database Commands

```bash
npm run db:generate   # Generate Drizzle migrations
npm run db:migrate    # Run migrations
npm run db:studio     # Open Drizzle Studio
npm run db:reset      # Reset database (scripts/)
```

## Next Steps & Planned Improvements

### Priority 1: Fix Broken Tests
Address the 10 failing test suites before adding new features.

### Priority 2: Performance Analytics Dashboard Improvements

**Improvement 1: Group By Selection** ✅ COMPLETE
- Changed "group by" selection from button group to dropdown select
- Matches session type dropdown styling for consistency
- Tests updated to verify dropdown functionality

**Improvement 2: Pagination & Sync UX** ✅ COMPLETE
- Added pagination with default 10 rows per page (options: 10, 25, 50, 100)
- Combined Refresh/Sync into single "Sync" button with tooltip explaining it fetches from iRacing
- Clear sync indication with spinner and "Syncing..." text
- Full pagination controls: first/prev/next/last page buttons
- Removed Session Type filter (only race data is fetched - see Future Considerations)
- Reduced control grid from 4 columns to 3 columns

**Improvement 3: Expandable Row Details** ✅ COMPLETE
- Clickable rows expand inline to show individual race details
- Scrollable container (max-height 208px) for series with many races
- Shows: Date, Track/Series (context-aware), Start, Finish, Δ, Incidents, SOF
- Loading state while fetching race details
- Empty state when no individual race data found
- New API endpoint: `/api/data/analytics/races`
- Tests added for expand/collapse, loading, and data display

### Priority 3: Navigation & User Flow Rework

**Current Flow (Problem):**
- User lands on Performance Dashboard
- Must navigate to Recommendations from there
- Not intuitive for the core value proposition

**Proposed Flow Options:**

**Option A: Landing Page with Clear Choices**
- Two large, clear boxes/cards on landing page:
  1. **Performance Analytics** - "View your historical racing performance"
  2. **Race Recommendations** - "Get personalized race suggestions for this week"
- Each box includes brief description of what user will see
- User explicitly chooses their path

**Option B: Direct to Recommendations**
- Land directly on recommendations (the core feature)
- Performance Analytics accessible via navigation

**Sticky Header Navigation:**
- Add persistent header bar at top of application
- Clear navigation between:
  - Historical Performance Dashboard
  - Recommendations Schedule
- User can easily switch between features at any time

### Priority 4: Recommendations Page Complete Rework (Core Feature)

**This is the subscription-worthy feature that needs significant improvement.**
**Note: Requires confidence in schedule data and scoring algorithm first.**

**Vision:**
1. **Primary Category Default**: User should see schedule for their most frequently raced category (e.g., sports_car if that's what they race most)
2. **Default to Balanced Mode**: Start with balanced recommendation mode
3. **Clear Mode Selection**: Easy switching between Balanced, iRating Push, Safety Recovery
4. **Clear Prioritization**: Schedule should clearly show prioritized recommendations based on scoring algorithm
5. **Clear Reasoning**: When viewing a recommendation, user should understand WHY it was recommended based on their historical performance
6. **License Eligibility**: Only show series user is eligible to race

**User Flow:**
- User loads recommendations page
- System detects primary category (e.g., sports_car based on 70%+ of races)
- Shows current week's schedule for that category
- Recommendations sorted by score with clear visual prioritization
- User can switch modes and see scores/ordering update accordingly
- Each recommendation explains the scoring factors

### Priority 5: Scoring Algorithm Issues

**Known Problem:** Safety Recovery mode may recommend series with LOWER safety scores than alternatives.

**Example Observed:**
- In Safety Recovery mode, top recommendation had lower personal safety score
- Second recommendation had higher safety score
- This contradicts the mode's purpose

**Possible Causes:**
1. Global statistics (other drivers' performance) may be overweighting personal history
2. Mode weights may not be correctly applied
3. Other factors may be overriding safety in the final score calculation

**Investigation Needed:**
- Review mode weight configuration
- Verify safety factor calculation
- Check how global vs personal stats are blended
- Add debugging/transparency to show why each score was calculated

### Future Considerations

**Historical Data Depth:**
- Current scope: Current season + past season
- Future: Option for users to look at deeper historical data if desired
- Consideration: Users improve over time, so very old data may not be relevant

**Subscription Model:**
- Recommendations feature is the core value proposition
- Need to ensure it's working correctly before monetization

**Non-Race Session Data (Very Low Priority):**
- Currently only race session data is fetched from iRacing API
- The iRacing `/results/search_series` endpoint defaults to race results only
- To fetch practice, qualifying, and time trial sessions, would need to pass `event_type` parameter (2=Practice, 3=Qualifying, 4=Time Trial, 5=Race)
- The database schema already supports storing all session types (`session_type` column exists)
- The analytics API already supports filtering by session type
- Implementation would require modifying `fetchMemberRecentRaces()` in `src/lib/iracing/client.ts` to make multiple API calls or pass event_type parameter
- Low value: recommendations only use race data anyway, and most users care about race performance

## Documentation

Detailed documentation is in `docs/`:
- `01-project-overview.md` - Architecture overview
- `02-database-schema.md` - Data models
- `03-api-endpoints.md` - API reference
- `04-user-journey.md` - User flows
- `05-oauth-integration.md` - Auth details
- `06-recommendation-system.md` - Scoring algorithm details
- `07-data-processing.md` - Data pipeline
- `08-pages-components.md` - Frontend structure
- `09-dashboard-features.md` - Dashboard features
- `10-key-orchestrator-files.md` - Main coordination files
