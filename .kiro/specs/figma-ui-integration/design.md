# Design Document

## Overview

This design specifies the integration of a Figma Make UI export into the existing Next.js "should-i-race-this" application. The integration follows a hybrid port-and-rebuild strategy: reusable UI primitives are ported from the Figma export, while pages are rebuilt natively using Next.js App Router patterns. The design preserves the existing application architecture, database schema, and Tailwind configuration while achieving visual parity with Figma designs.

The Figma export contains a comprehensive shadcn-style UI component library with 60+ primitives, feature-specific components (recommendation cards, landing page, pricing), and a complete design token system. The integration will quarantine the raw import, normalize dependencies, reconcile design tokens, and progressively migrate components into the canonical Next.js structure.

## Architecture

### High-Level Structure

```
should-i-race-this/
├── src/
│   ├── app/                          # Next.js App Router (existing + new routes)
│   │   ├── page.tsx                  # Landing page (rebuild)
│   │   ├── dashboard/
│   │   │   └── recommendations/
│   │   │       └── page.tsx          # Recommendations page (rebuild)
│   │   ├── pricing/
│   │   │   └── page.tsx              # Pricing page (new)
│   │   └── api/
│   │       └── stripe/
│   │           ├── checkout/
│   │           │   └── route.ts      # Checkout session creation
│   │           └── webhook/
│   │               └── route.ts      # Webhook handler
│   ├── components/
│   │   ├── ui/                       # Canonical primitives (ported from Figma)
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ...                   # 60+ primitives
│   │   ├── recommendations/          # Existing recommendation components
│   │   └── racing/                   # Feature components (new)
│   │       ├── PrimaryRecommendationCard.tsx
│   │       ├── GoalModeSelector.tsx
│   │       ├── LicenseBadge.tsx
│   │       └── ...
│   ├── styles/
│   │   └── globals.css               # Merged design tokens
│   └── lib/
│       └── stripe/                   # Stripe integration utilities
│           ├── client.ts
│           └── webhook.ts
└── figma_reference/                  # Quarantine (temporary)
    └── src/
        ├── components/
        │   ├── ui/                   # Source primitives
        │   └── *.tsx                 # Source feature components
        └── styles/
            └── globals.css           # Source design tokens
```

### Integration Strategy

**Phase 1: Quarantine Import**
- Figma export already exists in `figma_reference/` directory
- No additional import needed; use as reference source
- Extract components progressively rather than bulk copy

**Phase 2: Dependency Normalization**
- Install missing dependencies from Figma package.json
- Ensure version compatibility with existing Next.js dependencies
- No version-suffixed imports in final code

**Phase 3: Design Token Reconciliation**
- Merge Figma CSS variables with existing globals.css
- Preserve existing Tailwind racing.* palette
- Map semantic tokens to Tailwind utilities

**Phase 4: Primitive Porting**
- Port UI primitives from figma_reference/src/components/ui to src/components/ui
- Add "use client" directives where needed
- Ensure Next.js compatibility

**Phase 5: Page Rebuilding**
- Rebuild landing page at src/app/page.tsx
- Rebuild recommendations page at src/app/dashboard/recommendations/page.tsx
- Build pricing page at src/app/pricing/page.tsx

**Phase 6: Stripe Integration**
- Implement checkout endpoint
- Implement webhook handler
- Implement entitlement gating

## Components and Interfaces

### UI Primitives (Port from Figma)

The following primitives will be ported from `figma_reference/src/components/ui/` to `src/components/ui/`:

**Core Interaction**
- `button.tsx` - Button component with variants (default, destructive, outline, ghost, link)
- `input.tsx` - Text input with validation states
- `textarea.tsx` - Multi-line text input
- `checkbox.tsx` - Checkbox with label
- `radio-group.tsx` - Radio button group
- `switch.tsx` - Toggle switch
- `slider.tsx` - Range slider
- `select.tsx` - Dropdown select

**Layout & Structure**
- `card.tsx` - Card container with header, content, footer
- `separator.tsx` - Horizontal/vertical divider
- `aspect-ratio.tsx` - Aspect ratio container
- `scroll-area.tsx` - Custom scrollable area
- `resizable.tsx` - Resizable panels

**Overlay & Modal**
- `dialog.tsx` - Modal dialog
- `alert-dialog.tsx` - Confirmation dialog
- `sheet.tsx` - Slide-out panel
- `drawer.tsx` - Bottom drawer (mobile)
- `popover.tsx` - Floating popover
- `tooltip.tsx` - Hover tooltip
- `hover-card.tsx` - Rich hover card
- `context-menu.tsx` - Right-click menu
- `dropdown-menu.tsx` - Dropdown menu

**Navigation**
- `tabs.tsx` - Tab navigation
- `accordion.tsx` - Collapsible sections
- `navigation-menu.tsx` - Top navigation
- `menubar.tsx` - Menu bar
- `breadcrumb.tsx` - Breadcrumb navigation
- `pagination.tsx` - Page navigation
- `sidebar.tsx` - Sidebar navigation

**Feedback & Status**
- `badge.tsx` - Status badge
- `alert.tsx` - Alert message
- `progress.tsx` - Progress bar
- `skeleton.tsx` - Loading skeleton
- `sonner.tsx` - Toast notifications (via sonner library)

**Data Display**
- `table.tsx` - Data table
- `avatar.tsx` - User avatar
- `calendar.tsx` - Date picker calendar
- `chart.tsx` - Chart components (via recharts)
- `carousel.tsx` - Image carousel
- `command.tsx` - Command palette

**Form**
- `form.tsx` - Form wrapper with react-hook-form
- `label.tsx` - Form label
- `input-otp.tsx` - OTP input

**Utilities**
- `collapsible.tsx` - Collapsible container
- `toggle.tsx` - Toggle button
- `toggle-group.tsx` - Toggle button group
- `use-mobile.ts` - Mobile detection hook
- `utils.ts` - Utility functions (cn, etc.)

All primitives will:
- Include "use client" directive if they use hooks, event handlers, or Radix UI
- Use TypeScript with proper prop interfaces
- Reference design tokens via CSS variables
- Follow shadcn/ui patterns

### Feature Components (Port from Figma)

The following feature components will be ported from `figma_reference/src/components/` to `src/components/racing/`:

**Recommendation Display**
- `PrimaryRecommendationCard.tsx` - Top recommendation card with full details
- `SecondaryRecommendationCard.tsx` - Alternative recommendation card
- `RaceRecommendationCard.tsx` - Generic race card
- `OtherOptionItem.tsx` - List item for other options

**User Feedback & Status**
- `LicenseBadge.tsx` - iRacing license class badge
- `ConfidenceBadge.tsx` - Confidence percentage badge
- `LimitedHistoryBadge.tsx` - Low race count warning
- `UpdatedTag.tsx` - "Updated" indicator
- `ConfidenceChangeIndicator.tsx` - Confidence delta indicator
- `NewRacesAvailableBadge.tsx` - New races notification

**Loading & Empty States**
- `SkeletonCard.tsx` - Recommendation card skeleton
- `FirstTimeLoadingState.tsx` - First-time user loading
- `ReturningUserLoadingState.tsx` - Returning user loading
- `EmptyState.tsx` - No recommendations state
- `FirstTimeUserMessage.tsx` - Welcome message
- `QuietWeekNotice.tsx` - Low activity week notice
- `StaleDataNotice.tsx` - Data refresh needed notice

**Interactive Controls**
- `GoalModeSelector.tsx` - Goal mode switcher (Balanced/Push/Recovery)
- `FactorBar.tsx` - Factor visualization bar

**Premium Features**
- `ProUpgradePrompt.tsx` - Upgrade to Pro prompt
- `ProUpgradeConfirmation.tsx` - Upgrade success message

**Utility**
- `DataRefreshTimestamp.tsx` - Last refresh timestamp
- `ModeChangeNotification.tsx` - Mode change notification
- `NoChangeNotification.tsx` - No change notification

### Page Components (Rebuild in Next.js)

**Landing Page** (`src/app/page.tsx`)
```typescript
// Server Component
export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <PreviewCard />
      <ValueProps />
      <Footer />
    </div>
  );
}
```

**Recommendations Page** (`src/app/dashboard/recommendations/page.tsx`)
```typescript
// Server Component with Client Components for interactivity
import { Suspense } from 'react';
import { getRecommendations } from '@/lib/recommendations';
import { RecommendationsClient } from './RecommendationsClient';
import { RecommendationsSkeleton } from '@/components/racing/SkeletonCard';

export default async function RecommendationsPage() {
  const recommendations = await getRecommendations();
  
  return (
    <Suspense fallback={<RecommendationsSkeleton />}>
      <RecommendationsClient recommendations={recommendations} />
    </Suspense>
  );
}
```

**Pricing Page** (`src/app/pricing/page.tsx`)
```typescript
// Server Component with Client Component for checkout
import { PricingClient } from './PricingClient';

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <PricingHero />
      <PricingClient />
      <FAQ />
      <Footer />
    </div>
  );
}
```

### API Routes

**Checkout Endpoint** (`src/app/api/stripe/checkout/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from '@/lib/auth/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await request.json();

    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      client_reference_id: session.user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/recommendations?upgrade=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?upgrade=cancelled`,
      metadata: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
```

**Webhook Endpoint** (`src/app/api/stripe/webhook/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { updateUserEntitlement } from '@/lib/stripe/webhook';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await updateUserEntitlement({
          userId: session.metadata!.userId,
          subscriptionId: session.subscription as string,
          status: 'active',
        });
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserEntitlement({
          userId: subscription.metadata.userId,
          subscriptionId: subscription.id,
          status: subscription.status,
        });
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await updateUserEntitlement({
          userId: subscription.metadata.userId,
          subscriptionId: subscription.id,
          status: 'cancelled',
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
```

## Data Models

### Entitlement Model (New)

Add to existing Drizzle schema (`src/lib/db/schema.ts`):

```typescript
import { pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const userEntitlements = pgTable('user_entitlements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  subscriptionId: text('subscription_id').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'active', 'cancelled', 'past_due'
  tier: varchar('tier', { length: 50 }).notNull(), // 'pro'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type UserEntitlement = typeof userEntitlements.$inferSelect;
export type NewUserEntitlement = typeof userEntitlements.$inferInsert;
```

### Entitlement Check Interface

```typescript
// src/lib/stripe/entitlements.ts
export interface EntitlementCheck {
  hasProAccess: boolean;
  tier: 'free' | 'pro';
  subscriptionStatus?: 'active' | 'cancelled' | 'past_due';
}

export async function checkUserEntitlement(
  userId: string
): Promise<EntitlementCheck> {
  const entitlement = await db.query.userEntitlements.findFirst({
    where: eq(userEntitlements.userId, userId),
  });

  if (!entitlement || entitlement.status !== 'active') {
    return {
      hasProAccess: false,
      tier: 'free',
    };
  }

  return {
    hasProAccess: true,
    tier: 'pro',
    subscriptionStatus: entitlement.status as any,
  };
}
```

## Design Tokens

### Token Reconciliation Strategy

The Figma export includes a comprehensive design token system in `figma_reference/src/styles/globals.css`. These tokens must be merged with the existing Next.js application's `src/app/globals.css` without breaking existing styles.

**Existing Tokens (Preserve)**
```css
/* From existing src/app/globals.css */
:root {
  /* Existing racing license colors - DO NOT MODIFY */
  --racing-rookie: #E53E3E;
  --racing-d: #DD6B20;
  --racing-c: #D69E2E;
  --racing-b: #38A169;
  --racing-a: #3182CE;
  --racing-pro: #2D3748;
  /* ... other existing tokens */
}
```

**New Tokens (Add from Figma)**
```css
/* From figma_reference/src/styles/globals.css */
:root {
  /* Dark mode foundation */
  --bg-app: #0B0D10;
  --bg-surface: #14161B;
  --bg-elevated: #1A1D23;
  --bg-hover: #1F2228;
  
  /* Borders */
  --border-subtle: #2A2D35;
  --border-medium: #363942;
  --border-emphasis: #454952;
  
  /* Typography */
  --text-primary: #F5F5F6;
  --text-secondary: #B4B6BC;
  --text-tertiary: #797C85;
  --text-disabled: #52555D;
  
  /* License colors (map to existing racing.*) */
  --license-rookie: var(--racing-rookie);
  --license-d: var(--racing-d);
  --license-c: var(--racing-c);
  --license-b: var(--racing-b);
  --license-a: var(--racing-a);
  --license-pro: var(--racing-pro);
  
  /* Semantic colors */
  --semantic-positive: #48BB78;
  --semantic-positive-bg: rgba(72, 187, 120, 0.1);
  --semantic-positive-border: rgba(72, 187, 120, 0.3);
  
  --semantic-caution: #F6AD55;
  --semantic-caution-bg: rgba(246, 173, 85, 0.1);
  --semantic-caution-border: rgba(246, 173, 85, 0.3);
  
  --semantic-danger: #FC8181;
  --semantic-danger-bg: rgba(252, 129, 129, 0.1);
  --semantic-danger-border: rgba(252, 129, 129, 0.3);
  
  /* Accent/emphasis */
  --accent-primary: #F6AD55;
  --accent-primary-bright: #FBD38D;
  --accent-primary-glow: rgba(246, 173, 85, 0.2);
  
  --accent-info: #63B3ED;
  --accent-info-bg: rgba(99, 179, 237, 0.1);
}
```

**Tailwind Theme Extension**

Update `tailwind.config.js` to map CSS variables to Tailwind utilities:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        // Preserve existing racing colors
        racing: {
          rookie: 'var(--racing-rookie)',
          d: 'var(--racing-d)',
          c: 'var(--racing-c)',
          b: 'var(--racing-b)',
          a: 'var(--racing-a)',
          pro: 'var(--racing-pro)',
        },
        // Add new semantic tokens
        background: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        hover: 'var(--bg-hover)',
        border: {
          subtle: 'var(--border-subtle)',
          medium: 'var(--border-medium)',
          emphasis: 'var(--border-emphasis)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
        },
        semantic: {
          positive: 'var(--semantic-positive)',
          caution: 'var(--semantic-caution)',
          danger: 'var(--semantic-danger)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          info: 'var(--accent-info)',
        },
      },
    },
  },
};
```

### Typography System

The Figma design uses a professional typography system with tabular numerals for statistics. Add to `src/app/globals.css`:

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', 'Roboto', 
    'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: 'tnum' 1; /* Tabular numerals for stats */
}

.stat-number {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}

.label-metadata {
  font-size: 0.8125rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: No Vite Artifacts in Repository
*For any* file in the Next.js repository, the file path should not match Vite-specific patterns (vite.config.*, index.html at root, main.tsx at root)
**Validates: Requirements 1.4, 10.5**

### Property 2: Existing Functionality Preservation
*For all* existing API endpoints, authentication flows, recommendation algorithms, and iRacing sync operations, the behavior after integration should be functionally equivalent to the behavior before integration
**Validates: Requirements 1.5, 15.1, 15.2, 15.3, 15.4, 15.5**

### Property 3: Import Normalization
*For all* TypeScript and TSX files in src/, import statements should not contain version suffixes (e.g., @package@1.2.3) and all import paths should resolve according to tsconfig.json path mappings
**Validates: Requirements 2.1, 2.3**

### Property 4: Functional Equivalence After Refactoring
*For any* component that is refactored from Figma export to canonical location, the component's rendered output and behavior should be equivalent to the original
**Validates: Requirements 2.5**

### Property 5: Client Directive Correctness
*For all* React components in src/components/, if the component uses React hooks, event handlers, Radix UI components, or client-side libraries (sonner, next-themes), then the component file should contain "use client" directive
**Validates: Requirements 3.2, 3.3, 5.4**

### Property 6: Primitive Uniqueness
*For all* UI primitive components in src/components/ui/, each primitive name should be unique (no duplicate button.tsx, card.tsx, etc.)
**Validates: Requirements 3.4**

### Property 7: Design Token Preservation
*For all* existing Tailwind theme values (racing.* colors, safelist entries), these values should still exist in tailwind.config.js after token reconciliation
**Validates: Requirements 4.1, 4.2, 4.4**

### Property 8: No Hardcoded Colors
*For all* component files in src/components/, color values should reference CSS variables or Tailwind classes, not hardcoded hex values (e.g., #FF0000)
**Validates: Requirements 4.5**

### Property 9: Canonical Primitive Usage
*For all* page components in src/app/, import statements for UI primitives should reference src/components/ui/ (canonical location), not figma_reference/
**Validates: Requirements 6.2**

### Property 10: Stripe Checkout Flow
*For any* user clicking an upgrade button, the system should call POST /api/stripe/checkout, receive a session URL, and redirect to Stripe's hosted checkout page
**Validates: Requirements 7.2, 7.4, 7.5**

### Property 11: Webhook Signature Verification
*For all* incoming webhook requests to /api/stripe/webhook, if the Stripe signature is invalid, then the system should return a 400 error and not process the event
**Validates: Requirements 8.2**

### Property 12: Webhook Entitlement Update
*For all* valid checkout.session.completed webhook events, the system should create or update a user entitlement record in the database with status 'active'
**Validates: Requirements 8.3**

### Property 13: Webhook Idempotence
*For any* webhook event, processing the same event multiple times (same event ID) should result in the same database state as processing it once
**Validates: Requirements 8.5**

### Property 14: Webhook Audit Logging
*For all* webhook events received at /api/stripe/webhook, the system should create a log entry containing the event type, timestamp, and processing result
**Validates: Requirements 8.6**

### Property 15: Server-Side Entitlement Verification
*For all* requests to premium features, the system should verify entitlements on the server by querying the database, not relying solely on client-side checks
**Validates: Requirements 9.1, 9.3, 9.4**

### Property 16: Entitlement-Based Access Control
*For any* user without an active entitlement, requests to premium features should return upgrade prompts instead of premium content
**Validates: Requirements 9.2**

### Property 17: Entitlement Caching
*For any* user, repeated entitlement checks within a short time window should use cached results rather than querying the database multiple times
**Validates: Requirements 9.5**

### Property 18: Expired Entitlement Handling
*For any* user with an expired or cancelled entitlement, the system should treat them as having no entitlement and restrict premium feature access
**Validates: Requirements 9.6**

### Property 19: Loading State Display
*For all* pages with async data fetching, while data is loading, the system should display skeleton components or loading indicators instead of blank screens
**Validates: Requirements 11.2**

### Property 20: Suspense Fallback Provision
*For all* Suspense boundaries in the application, each Suspense component should have a fallback prop with an appropriate loading component
**Validates: Requirements 11.4**

### Property 21: Toast Notifications for Actions
*For all* user actions that complete successfully (e.g., save settings, upgrade), the system should display a success toast notification
**Validates: Requirements 12.2**

### Property 22: Toast Notifications for Errors
*For all* errors that occur during user actions, the system should display an error toast with a descriptive message
**Validates: Requirements 12.3**

### Property 23: TypeScript Type Safety
*For all* components, API functions, and data models, TypeScript types should be explicitly defined (no implicit 'any'), and the codebase should compile without TypeScript errors
**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 24: Responsive Layout Implementation
*For all* page components, the layout should use Tailwind responsive classes (sm:, md:, lg:, xl:) to adapt to different viewport sizes
**Validates: Requirements 14.1**

## Error Handling

### Import and Normalization Errors

**Scenario**: Version-suffixed imports remain after normalization
- **Detection**: Scan all .ts and .tsx files for import patterns matching `@package@\d+\.\d+\.\d+`
- **Handling**: Fail build with clear error message listing affected files
- **Recovery**: Automated script to normalize imports

**Scenario**: Missing dependencies after normalization
- **Detection**: TypeScript compilation fails with module not found errors
- **Handling**: Check package.json for missing dependencies
- **Recovery**: Install missing dependencies from Figma package.json

### Design Token Conflicts

**Scenario**: Figma tokens conflict with existing tokens
- **Detection**: Compare token names between figma_reference/src/styles/globals.css and src/app/globals.css
- **Handling**: Document conflicts in a conflicts.md file
- **Resolution**: Manual review and decision on which token to keep or rename

**Scenario**: Hardcoded colors in components
- **Detection**: Regex scan for hex color patterns (#[0-9A-Fa-f]{3,6}) in component files
- **Handling**: Fail linting with list of violations
- **Recovery**: Replace hardcoded colors with CSS variable references

### Stripe Integration Errors

**Scenario**: Checkout session creation fails
- **Detection**: Stripe API returns error
- **Handling**: Log error details, return 500 to client with generic message
- **User Experience**: Display error toast: "Unable to start checkout. Please try again."
- **Recovery**: User can retry checkout

**Scenario**: Webhook signature verification fails
- **Detection**: stripe.webhooks.constructEvent throws error
- **Handling**: Return 400 to Stripe, log attempt with signature and body
- **Security**: Do not process event, prevent unauthorized entitlement grants
- **Recovery**: Stripe will retry with correct signature

**Scenario**: Webhook processing fails (database error)
- **Detection**: Database query throws error during entitlement update
- **Handling**: Return 500 to Stripe to trigger retry, log error with event details
- **Recovery**: Stripe retries webhook, idempotency prevents duplicates

**Scenario**: User has expired entitlement
- **Detection**: Entitlement check finds status !== 'active'
- **Handling**: Treat as no entitlement, show upgrade prompt
- **User Experience**: "Your Pro subscription has expired. Upgrade to continue accessing premium features."
- **Recovery**: User can re-subscribe through pricing page

### Component Porting Errors

**Scenario**: Component uses Radix UI but missing "use client"
- **Detection**: Next.js build fails with "You're importing a component that needs useState..."
- **Handling**: Build error with file path
- **Recovery**: Add "use client" directive to component

**Scenario**: Component imports from figma_reference instead of canonical location
- **Detection**: ESLint rule or build-time check
- **Handling**: Fail build with list of violations
- **Recovery**: Update imports to use src/components/ui

### TypeScript Errors

**Scenario**: Missing type definitions for component props
- **Detection**: TypeScript compilation fails or implicit any warnings
- **Handling**: Fail build with list of components missing types
- **Recovery**: Add explicit TypeScript interfaces for all props

**Scenario**: API response types not defined
- **Detection**: TypeScript compilation warnings for implicit any in API calls
- **Handling**: Fail build in strict mode
- **Recovery**: Define response types for all API endpoints

## Testing Strategy

### Dual Testing Approach

This integration requires both unit tests and property-based tests to ensure correctness:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Specific component rendering scenarios
- Specific API endpoint responses
- Specific error handling paths
- Integration points between components

**Property Tests**: Verify universal properties across all inputs
- Import normalization across all files
- "use client" directive correctness across all components
- Entitlement verification across all premium features
- Type safety across all components

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the entire codebase.

### Property-Based Testing Configuration

**Library**: fast-check (TypeScript/JavaScript property-based testing library)
- Install: `npm install --save-dev fast-check @types/fast-check`
- Minimum 100 iterations per property test
- Each test references its design document property

**Test Organization**:
```
src/
├── __tests__/
│   ├── integration/
│   │   ├── import-normalization.property.test.ts
│   │   ├── client-directive.property.test.ts
│   │   ├── design-tokens.property.test.ts
│   │   └── type-safety.property.test.ts
│   ├── stripe/
│   │   ├── checkout.test.ts
│   │   ├── webhook.property.test.ts
│   │   └── entitlements.property.test.ts
│   └── components/
│       ├── primitives.test.ts
│       └── pages.test.ts
```

### Test Tagging Format

Each property test must include a comment referencing the design property:

```typescript
/**
 * Feature: figma-ui-integration, Property 3: Import Normalization
 * 
 * For all TypeScript and TSX files in src/, import statements should not contain
 * version suffixes and all import paths should resolve according to tsconfig.json
 */
test('import normalization property', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...getAllSourceFiles()),
      (filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const imports = extractImports(content);
        
        // No version suffixes
        expect(imports.every(imp => !/@.+@\d+\.\d+\.\d+/.test(imp))).toBe(true);
        
        // All imports resolve
        expect(imports.every(imp => canResolveImport(imp, filePath))).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

**Component Rendering**:
```typescript
describe('PrimaryRecommendationCard', () => {
  it('should render series name and track', () => {
    const recommendation = createMockRecommendation();
    render(<PrimaryRecommendationCard recommendation={recommendation} />);
    
    expect(screen.getByText(recommendation.seriesName)).toBeInTheDocument();
    expect(screen.getByText(recommendation.track)).toBeInTheDocument();
  });
  
  it('should show upgrade prompt for non-pro users when expanded', () => {
    const recommendation = createMockRecommendation();
    render(<PrimaryRecommendationCard recommendation={recommendation} isProUser={false} />);
    
    fireEvent.click(screen.getByText('View Detailed Analysis'));
    
    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
  });
});
```

**API Endpoint**:
```typescript
describe('POST /api/stripe/checkout', () => {
  it('should create checkout session for authenticated user', async () => {
    const session = await createMockSession({ user: { id: 'user123' } });
    const response = await POST(
      new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId: 'price_123' }),
      })
    );
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toMatch(/^https:\/\/checkout\.stripe\.com/);
  });
  
  it('should return 401 for unauthenticated user', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId: 'price_123' }),
      })
    );
    
    expect(response.status).toBe(401);
  });
});
```

**Webhook Handler**:
```typescript
describe('POST /api/stripe/webhook', () => {
  it('should reject invalid signature', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': 'invalid' },
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      })
    );
    
    expect(response.status).toBe(400);
  });
  
  it('should update entitlement on valid checkout.session.completed', async () => {
    const event = createMockStripeEvent('checkout.session.completed', {
      metadata: { userId: 'user123' },
      subscription: 'sub_123',
    });
    
    const response = await POST(createMockWebhookRequest(event));
    
    expect(response.status).toBe(200);
    
    const entitlement = await db.query.userEntitlements.findFirst({
      where: eq(userEntitlements.userId, 'user123'),
    });
    
    expect(entitlement).toBeDefined();
    expect(entitlement?.status).toBe('active');
  });
});
```

### Property Test Examples

**Import Normalization**:
```typescript
/**
 * Feature: figma-ui-integration, Property 3: Import Normalization
 */
test('no version-suffixed imports in source files', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...glob.sync('src/**/*.{ts,tsx}')),
      (filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const versionedImportPattern = /@[\w-]+@\d+\.\d+\.\d+/;
        
        expect(content).not.toMatch(versionedImportPattern);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Client Directive Correctness**:
```typescript
/**
 * Feature: figma-ui-integration, Property 5: Client Directive Correctness
 */
test('components using hooks have use client directive', () => {
  fc.assert(
    fc.property(
      fc.constantFrom(...glob.sync('src/components/**/*.tsx')),
      (filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const usesHooks = /use(State|Effect|Context|Ref|Callback|Memo|Reducer)/.test(content);
        const usesRadix = /@radix-ui/.test(content);
        const usesEventHandlers = /on(Click|Change|Submit|KeyDown|KeyUp|Focus|Blur)=/.test(content);
        
        const needsClientDirective = usesHooks || usesRadix || usesEventHandlers;
        const hasClientDirective = /['"]use client['"]/.test(content);
        
        if (needsClientDirective) {
          expect(hasClientDirective).toBe(true);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

**Webhook Idempotence**:
```typescript
/**
 * Feature: figma-ui-integration, Property 13: Webhook Idempotence
 */
test('processing same webhook twice produces same result', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        userId: fc.uuid(),
        subscriptionId: fc.string({ minLength: 10 }),
        eventId: fc.uuid(),
      }),
      async ({ userId, subscriptionId, eventId }) => {
        // Clear database
        await db.delete(userEntitlements).where(eq(userEntitlements.userId, userId));
        
        const event = createMockStripeEvent('checkout.session.completed', {
          id: eventId,
          metadata: { userId },
          subscription: subscriptionId,
        });
        
        // Process webhook first time
        await POST(createMockWebhookRequest(event));
        const firstResult = await db.query.userEntitlements.findFirst({
          where: eq(userEntitlements.userId, userId),
        });
        
        // Process same webhook second time
        await POST(createMockWebhookRequest(event));
        const secondResult = await db.query.userEntitlements.findFirst({
          where: eq(userEntitlements.userId, userId),
        });
        
        // Results should be identical
        expect(secondResult).toEqual(firstResult);
        
        // Should only have one entitlement record
        const allEntitlements = await db.query.userEntitlements.findMany({
          where: eq(userEntitlements.userId, userId),
        });
        expect(allEntitlements).toHaveLength(1);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Entitlement Verification**:
```typescript
/**
 * Feature: figma-ui-integration, Property 15: Server-Side Entitlement Verification
 */
test('premium features verify entitlements on server', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        userId: fc.uuid(),
        hasEntitlement: fc.boolean(),
      }),
      async ({ userId, hasEntitlement }) => {
        // Setup entitlement state
        if (hasEntitlement) {
          await db.insert(userEntitlements).values({
            id: fc.uuid(),
            userId,
            subscriptionId: 'sub_test',
            status: 'active',
            tier: 'pro',
          });
        } else {
          await db.delete(userEntitlements).where(eq(userEntitlements.userId, userId));
        }
        
        // Make request to premium feature
        const response = await fetch('/api/premium-feature', {
          headers: { 'x-user-id': userId },
        });
        
        if (hasEntitlement) {
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data).toHaveProperty('premiumContent');
        } else {
          expect(response.status).toBe(403);
          const data = await response.json();
          expect(data).toHaveProperty('upgradePrompt');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Stripe Flow**:
```typescript
describe('Stripe Integration E2E', () => {
  it('should complete full upgrade flow', async () => {
    // 1. User clicks upgrade button
    const checkoutResponse = await fetch('/api/stripe/checkout', {
      method: 'POST',
      body: JSON.stringify({ priceId: 'price_test' }),
    });
    const { url } = await checkoutResponse.json();
    expect(url).toMatch(/checkout\.stripe\.com/);
    
    // 2. Simulate Stripe webhook
    const webhookEvent = createMockStripeEvent('checkout.session.completed', {
      metadata: { userId: 'user123' },
      subscription: 'sub_123',
    });
    
    const webhookResponse = await POST(createMockWebhookRequest(webhookEvent));
    expect(webhookResponse.status).toBe(200);
    
    // 3. Verify entitlement created
    const entitlement = await checkUserEntitlement('user123');
    expect(entitlement.hasProAccess).toBe(true);
    expect(entitlement.tier).toBe('pro');
    
    // 4. Verify premium features accessible
    const premiumResponse = await fetch('/api/premium-feature', {
      headers: { 'x-user-id': 'user123' },
    });
    expect(premiumResponse.status).toBe(200);
  });
});
```

### Visual Regression Testing (Optional)

For visual parity verification, consider using:
- **Playwright** with screenshot comparison
- **Chromatic** for automated visual testing
- **Percy** for visual diff tracking

These tools can verify that rebuilt pages match Figma designs visually, though this is not required for the core integration.

### Test Coverage Goals

- **Unit Test Coverage**: 80%+ for new code (components, API routes, utilities)
- **Property Test Coverage**: 100% of correctness properties implemented
- **Integration Test Coverage**: All critical user flows (auth, recommendations, upgrade)
- **E2E Test Coverage**: Happy path for each major feature

### Continuous Integration

All tests should run in CI pipeline:
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:property
      - run: npm run test:integration
      - run: npm run type-check
```
