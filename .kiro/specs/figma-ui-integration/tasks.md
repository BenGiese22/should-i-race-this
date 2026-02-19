# Implementation Plan: Figma UI Integration

## Overview

This implementation plan breaks down the Figma UI integration into discrete, PR-sized tasks. Each task builds incrementally on previous work, ensuring the application remains functional throughout the integration process. The plan follows a quarantine-normalize-port-rebuild-integrate workflow, with Stripe integration as the final phase.

## Tasks

- [x] 1. Dependency Installation and Normalization
  - Install missing dependencies from Figma export (Radix UI, class-variance-authority, lucide-react, sonner, next-themes, etc.)
  - Verify no version conflicts with existing Next.js dependencies
  - Update package.json with new dependencies
  - Run npm install and verify build succeeds
  - _Requirements: 2.2_

- [x] 2. Design Token Reconciliation
  - [x] 2.1 Merge CSS Variables into globals.css
    - Copy Figma design tokens from figma_reference/src/styles/globals.css
    - Merge into src/app/globals.css without overwriting existing tokens
    - Map --license-* variables to existing --racing-* variables
    - Add new semantic tokens (--bg-*, --text-*, --border-*, --semantic-*, --accent-*)
    - _Requirements: 4.3_
  
  - [x] 2.2 Extend Tailwind Configuration
    - Update tailwind.config.js to map CSS variables to Tailwind utilities
    - Preserve existing racing.* color palette
    - Preserve existing safelist configuration
    - Add new color utilities (background, surface, elevated, text.primary, etc.)
    - _Requirements: 4.1, 4.2, 4.4, 4.6_
  
  - [x] 2.3 Write property test for design token preservation
    - **Property 7: Design Token Preservation**
    - **Validates: Requirements 4.1, 4.2, 4.4**
  
  - [x] 2.4 Write property test for no hardcoded colors
    - **Property 8: No Hardcoded Colors**
    - **Validates: Requirements 4.5**

- [x] 3. Port Core UI Primitives (Batch 1: Foundational)
  - [x] 3.1 Port button, input, textarea, label components
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive where needed
    - Update imports to remove version suffixes
    - Ensure TypeScript types are defined
    - _Requirements: 3.1, 3.2, 3.3, 13.1_
  
  - [x] 3.2 Port card, separator, badge, skeleton components
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive where needed
    - Update imports to remove version suffixes
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 3.3 Create src/components/ui/index.ts barrel export
    - Export all ported primitives for centralized imports
    - _Requirements: 3.5_
  
  - [x] 3.4 Write property test for client directive correctness
    - **Property 5: Client Directive Correctness**
    - **Validates: Requirements 3.2, 3.3, 5.4**
  
  - [x] 3.5 Write property test for primitive uniqueness
    - **Property 6: Primitive Uniqueness**
    - **Validates: Requirements 3.4**

- [x] 4. Port Overlay & Modal Primitives (Batch 2)
  - [x] 4.1 Port dialog, alert-dialog, sheet, drawer components
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive (all use Radix UI)
    - Update imports to remove version suffixes
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 4.2 Port popover, tooltip, hover-card, dropdown-menu components
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive (all use Radix UI)
    - Update imports to remove version suffixes
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 4.3 Update src/components/ui/index.ts with new exports
    - Add exports for all newly ported primitives
    - _Requirements: 3.5_

- [x] 5. Port Navigation & Data Display Primitives (Batch 3)
  - [x] 5.1 Port tabs, accordion, navigation-menu components
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive where needed
    - Update imports to remove version suffixes
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 5.2 Port table, avatar, progress, scroll-area components
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive where needed
    - Update imports to remove version suffixes
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 5.3 Update src/components/ui/index.ts with new exports
    - Add exports for all newly ported primitives
    - _Requirements: 3.5_

- [x] 6. Port Form & Input Primitives (Batch 4)
  - [x] 6.1 Port checkbox, radio-group, switch, slider, select components
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive (all use Radix UI)
    - Update imports to remove version suffixes
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 6.2 Port form, calendar, command components
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive where needed
    - Update imports to remove version suffixes
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [x] 6.3 Update src/components/ui/index.ts with new exports
    - Add exports for all newly ported primitives
    - _Requirements: 3.5_

- [x] 7. Port Toast Notification System
  - [x] 7.1 Port sonner.tsx component
    - Copy from figma_reference/src/components/ui/ to src/components/ui/
    - Add "use client" directive
    - Configure toast position and duration
    - _Requirements: 12.1, 12.6_
  
  - [x] 7.2 Add Toaster to root layout
    - Import Toaster component in src/app/layout.tsx
    - Add Toaster component to layout
    - _Requirements: 12.1_
  
  - [x] 7.3 Write property tests for toast notifications
    - **Property 21: Toast Notifications for Actions**
    - **Property 22: Toast Notifications for Errors**
    - **Validates: Requirements 12.2, 12.3**

- [x] 8. Port Racing Feature Components
  - [x] 8.1 Create src/components/racing directory
    - Create new directory for racing-specific components
    - _Requirements: 3.1_
  
  - [x] 8.2 Port LicenseBadge component
    - Copy from figma_reference/src/components/ to src/components/racing/
    - Add "use client" if needed
    - Update imports to use canonical primitives
    - _Requirements: 3.1, 3.2_
  
  - [x] 8.3 Port recommendation card components
    - Port PrimaryRecommendationCard, SecondaryRecommendationCard, RaceRecommendationCard
    - Add "use client" directive (all use state and event handlers)
    - Update imports to use canonical primitives from src/components/ui
    - _Requirements: 3.1, 3.2, 6.2_
  
  - [x] 8.4 Port status and feedback components
    - Port ConfidenceBadge, LimitedHistoryBadge, UpdatedTag, ConfidenceChangeIndicator
    - Add "use client" if needed
    - Update imports to use canonical primitives
    - _Requirements: 3.1, 3.2_
  
  - [x] 8.5 Port loading and empty state components
    - Port SkeletonCard, FirstTimeLoadingState, ReturningUserLoadingState, EmptyState
    - Port FirstTimeUserMessage, QuietWeekNotice, StaleDataNotice
    - Update imports to use canonical primitives
    - _Requirements: 11.3, 11.5_
  
  - [x] 8.6 Port interactive control components
    - Port GoalModeSelector, FactorBar
    - Add "use client" directive (use state and event handlers)
    - Update imports to use canonical primitives
    - _Requirements: 3.1, 3.2_
  
  - [x] 8.7 Write property test for canonical primitive usage
    - **Property 9: Canonical Primitive Usage**
    - **Validates: Requirements 6.2**

- [x] 9. Checkpoint - Verify Primitives and Components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Rebuild Landing Page
  - [x] 10.1 Create landing page component structure
    - Create src/app/page.tsx as Server Component
    - Create client components for interactive elements (sign-in button)
    - Use canonical primitives from src/components/ui
    - Reference figma_reference/src/components/LandingPage.tsx for design
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [x] 10.2 Implement landing page sections
    - Implement Header with sign-in button
    - Implement Hero section with CTA
    - Implement PreviewCard showing example recommendation
    - Implement ValueProps section with feature highlights
    - Implement Footer with trust signal
    - _Requirements: 5.1_
  
  - [x] 10.3 Add responsive layout classes
    - Use Tailwind responsive classes (sm:, md:, lg:, xl:)
    - Test layout at mobile, tablet, and desktop breakpoints
    - _Requirements: 14.1_
  
  - [x] 10.4 Write unit tests for landing page
    - Test that page renders without errors
    - Test that sign-in button triggers auth flow
    - Test that CTA button navigates correctly
    - _Requirements: 5.1_

- [x] 11. Rebuild Recommendations Page
  - [x] 11.1 Create recommendations page structure
    - Update src/app/dashboard/recommendations/page.tsx as Server Component
    - Create RecommendationsClient.tsx for client-side interactivity
    - Use Suspense for loading states
    - _Requirements: 6.1, 6.3_
  
  - [x] 11.2 Implement recommendations display
    - Use PrimaryRecommendationCard for top recommendation
    - Use SecondaryRecommendationCard for alternatives
    - Use OtherOptionItem for additional options
    - Integrate with existing getRecommendations API
    - _Requirements: 6.2, 6.6_
  
  - [x] 11.3 Implement loading states
    - Create loading.tsx with SkeletonCard components
    - Add Suspense fallbacks with appropriate skeletons
    - _Requirements: 6.3, 11.2, 11.3, 11.4_
  
  - [x] 11.4 Implement empty and error states
    - Use EmptyState component when no recommendations
    - Create error.tsx for error boundary
    - _Requirements: 6.4, 6.5_
  
  - [x] 11.5 Integrate goal mode selector
    - Add GoalModeSelector component
    - Wire to existing recommendation filtering logic
    - Preserve existing filtering and sorting functionality
    - _Requirements: 6.7_
  
  - [x] 11.6 Write property test for existing functionality preservation
    - **Property 2: Existing Functionality Preservation**
    - **Validates: Requirements 1.5, 15.1, 15.2, 15.3, 15.4, 15.5**
  
  - [x] 11.7 Write unit tests for recommendations page
    - Test that page renders with mock data
    - Test loading states display correctly
    - Test empty state displays when no recommendations
    - Test error boundary catches errors
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ] 12. Checkpoint - Verify Pages Render
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement Stripe Checkout Endpoint
  - [ ] 13.1 Create Stripe utility functions
    - Create src/lib/stripe/client.ts with Stripe client initialization
    - Add environment variables for Stripe keys
    - _Requirements: 7.4_
  
  - [ ] 13.2 Create checkout endpoint
    - Create src/app/api/stripe/checkout/route.ts
    - Implement POST handler to create Stripe Checkout Session
    - Verify user authentication before creating session
    - Include success and cancel URLs
    - Pass user ID in metadata
    - _Requirements: 7.2, 7.4, 7.5, 7.6, 7.7_
  
  - [ ] 13.3 Write property test for Stripe checkout flow
    - **Property 10: Stripe Checkout Flow**
    - **Validates: Requirements 7.2, 7.4, 7.5**
  
  - [ ] 13.4 Write unit tests for checkout endpoint
    - Test authenticated user can create session
    - Test unauthenticated user receives 401
    - Test session includes correct metadata
    - Test session includes success/cancel URLs
    - _Requirements: 7.2, 7.4, 7.5, 7.6, 7.7_

- [ ] 14. Implement Database Schema for Entitlements
  - [ ] 14.1 Add entitlements table to schema
    - Update src/lib/db/schema.ts with userEntitlements table
    - Define columns: id, userId, subscriptionId, status, tier, createdAt, updatedAt
    - Add foreign key reference to users table
    - _Requirements: 9.4_
  
  - [ ] 14.2 Generate and run migration
    - Generate Drizzle migration for new table
    - Run migration against database
    - Verify table created successfully
    - _Requirements: 9.4_

- [ ] 15. Implement Stripe Webhook Handler
  - [ ] 15.1 Create webhook utility functions
    - Create src/lib/stripe/webhook.ts with updateUserEntitlement function
    - Implement idempotency check using event ID
    - Implement database update logic
    - _Requirements: 8.3, 8.5_
  
  - [ ] 15.2 Create webhook endpoint
    - Create src/app/api/stripe/webhook/route.ts
    - Implement POST handler with signature verification
    - Handle checkout.session.completed event
    - Handle customer.subscription.updated event
    - Handle customer.subscription.deleted event
    - Return appropriate status codes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.7_
  
  - [ ] 15.3 Add webhook logging
    - Log all webhook events with type, timestamp, and result
    - Log signature verification failures
    - _Requirements: 8.6_
  
  - [ ] 15.4 Write property test for webhook signature verification
    - **Property 11: Webhook Signature Verification**
    - **Validates: Requirements 8.2**
  
  - [ ] 15.5 Write property test for webhook entitlement update
    - **Property 12: Webhook Entitlement Update**
    - **Validates: Requirements 8.3**
  
  - [ ] 15.6 Write property test for webhook idempotence
    - **Property 13: Webhook Idempotence**
    - **Validates: Requirements 8.5**
  
  - [ ] 15.7 Write property test for webhook audit logging
    - **Property 14: Webhook Audit Logging**
    - **Validates: Requirements 8.6**
  
  - [ ] 15.8 Write unit tests for webhook endpoint
    - Test invalid signature returns 400
    - Test valid checkout.session.completed creates entitlement
    - Test subscription.updated updates entitlement
    - Test subscription.deleted marks entitlement cancelled
    - Test processing same event twice produces same result
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 16. Implement Entitlement Verification
  - [ ] 16.1 Create entitlement check functions
    - Create src/lib/stripe/entitlements.ts with checkUserEntitlement function
    - Query database for user's active entitlement
    - Return EntitlementCheck interface
    - Implement caching to minimize database queries
    - _Requirements: 9.1, 9.4, 9.5_
  
  - [ ] 16.2 Create server-side entitlement middleware
    - Create utility to verify entitlements in Server Components
    - Handle expired/cancelled entitlements
    - _Requirements: 9.1, 9.6_
  
  - [ ] 16.3 Write property test for server-side entitlement verification
    - **Property 15: Server-Side Entitlement Verification**
    - **Validates: Requirements 9.1, 9.3, 9.4**
  
  - [ ] 16.4 Write property test for entitlement-based access control
    - **Property 16: Entitlement-Based Access Control**
    - **Validates: Requirements 9.2**
  
  - [ ] 16.5 Write property test for entitlement caching
    - **Property 17: Entitlement Caching**
    - **Validates: Requirements 9.5**
  
  - [ ] 16.6 Write property test for expired entitlement handling
    - **Property 18: Expired Entitlement Handling**
    - **Validates: Requirements 9.6**
  
  - [ ] 16.7 Write unit tests for entitlement functions
    - Test active entitlement returns hasProAccess: true
    - Test no entitlement returns hasProAccess: false
    - Test expired entitlement returns hasProAccess: false
    - Test caching reduces database queries
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6_

- [ ] 17. Build Pricing Page
  - [ ] 17.1 Create pricing page structure
    - Create src/app/pricing/page.tsx as Server Component
    - Create PricingClient.tsx for checkout button interactivity
    - Reference figma_reference/src/components/ProExplanationPage.tsx for design
    - _Requirements: 7.1_
  
  - [ ] 17.2 Implement pricing page sections
    - Implement Header with navigation
    - Implement PricingHero with Pro badge
    - Implement feature list (transparency, goal modes, filtering)
    - Implement pricing tiers (monthly/annual)
    - Implement CTA buttons that call checkout endpoint
    - _Requirements: 7.1, 7.2_
  
  - [ ] 17.3 Wire checkout button to API
    - Implement onClick handler to call POST /api/stripe/checkout
    - Handle loading state during checkout creation
    - Redirect to Stripe Checkout on success
    - Display error toast on failure
    - _Requirements: 7.2, 7.5_
  
  - [ ] 17.4 Write unit tests for pricing page
    - Test page renders pricing tiers
    - Test checkout button calls API
    - Test loading state displays during checkout
    - Test error toast displays on failure
    - Test no raw card entry form exists
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 18. Implement Premium Feature Gating
  - [ ] 18.1 Gate scoring breakdown in recommendation cards
    - Update PrimaryRecommendationCard to check entitlements
    - Show ProUpgradePrompt for non-pro users
    - Show full breakdown for pro users
    - _Requirements: 9.1, 9.2_
  
  - [ ] 18.2 Gate goal mode selector
    - Update GoalModeSelector to check entitlements
    - Show upgrade prompt for non-pro users
    - Enable mode switching for pro users
    - _Requirements: 9.1, 9.2_
  
  - [ ] 18.3 Gate advanced filtering
    - Check entitlements before allowing advanced filters
    - Show upgrade prompt for non-pro users
    - _Requirements: 9.1, 9.2_
  
  - [ ] 18.4 Write integration tests for premium gating
    - Test pro user sees full features
    - Test free user sees upgrade prompts
    - Test expired entitlement treated as free user
    - _Requirements: 9.1, 9.2, 9.6_

- [ ] 19. Checkpoint - Verify Stripe Integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Code Quality and Cleanup
  - [ ] 20.1 Run import normalization check
    - Scan all files for version-suffixed imports
    - Fix any remaining version suffixes
    - _Requirements: 2.1_
  
  - [ ] 20.2 Run TypeScript type check
    - Ensure all components have prop interfaces
    - Remove any 'any' types
    - Ensure all API functions have return types
    - Fix any TypeScript errors
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [ ] 20.3 Run linting and formatting
    - Run ESLint and fix issues
    - Run Prettier to format code
    - _Requirements: 13.5_
  
  - [ ] 20.4 Write property test for import normalization
    - **Property 3: Import Normalization**
    - **Validates: Requirements 2.1, 2.3**
  
  - [ ] 20.5 Write property test for TypeScript type safety
    - **Property 23: TypeScript Type Safety**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4**

- [ ] 21. Documentation and Verification
  - [ ] 21.1 Verify no Vite artifacts exist
    - Check that vite.config.*, index.html, main.tsx don't exist in src/
    - _Requirements: 1.4, 10.5_
  
  - [ ] 21.2 Verify architectural constraints
    - Verify database schema only added entitlements table
    - Verify Tailwind config preserved existing values
    - Verify existing API endpoints unchanged
    - Verify existing auth logic unchanged
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.7_
  
  - [ ] 21.3 Create integration documentation
    - Document new environment variables (Stripe keys, webhook secret)
    - Document new API endpoints (/api/stripe/checkout, /api/stripe/webhook)
    - Document entitlement checking pattern
    - Document design token usage
    - _Requirements: 7.4, 8.1_
  
  - [ ] 21.4 Write property test for no Vite artifacts
    - **Property 1: No Vite Artifacts in Repository**
    - **Validates: Requirements 1.4, 10.5**
  
  - [ ] 21.5 Write example tests for architectural constraints
    - Test entitlements table exists
    - Test Tailwind config has racing.* colors
    - Test required dependencies installed
    - Test semantic CSS variables defined
    - _Requirements: 4.1, 4.2, 4.3, 10.1, 10.4_

- [ ] 22. Final Checkpoint - Complete Integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks are required for comprehensive integration
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The integration preserves all existing functionality while adding new UI and Stripe features
- All new code uses TypeScript with explicit types
- All new components use design tokens instead of hardcoded colors
- Server Components are used by default; Client Components only when needed
