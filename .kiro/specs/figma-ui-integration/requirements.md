# Requirements Document

## Introduction

This specification defines the requirements for integrating a Figma Make UI export (Vite + React project) into the existing Next.js App Router application "should-i-race-this". The integration follows a hybrid strategy: porting reusable UI primitives while rebuilding pages natively in Next.js. The system must maintain visual parity with Figma designs while preserving the existing application architecture, database schema, and Tailwind configuration.

## Glossary

- **Figma_Export**: The ZIP export from Figma Make containing Vite + React UI components, primitives, and design tokens
- **UI_Primitives**: Reusable foundational components (button, input, card, dialog, tabs, toast, skeleton, spinner)
- **Feature_Components**: Higher-level components composed from primitives (recommendation cards, pricing tables)
- **Design_Tokens**: CSS variables and Tailwind theme values defining colors, spacing, typography
- **Quarantine_Folder**: Temporary import location for raw Figma code before normalization
- **Canonical_Primitives**: Normalized, Next.js-compatible UI primitives in src/components/ui
- **Stripe_Checkout**: Hosted Stripe payment flow (not raw card entry)
- **Entitlement**: Database record indicating user's subscription/payment status
- **App_Router**: Next.js 13+ routing system using src/app directory structure
- **Client_Component**: React component marked with "use client" directive for client-side interactivity
- **Server_Component**: React component that renders on the server (default in App Router)

## Requirements

### Requirement 1: Import and Quarantine Figma Export

**User Story:** As a developer, I want to safely import the Figma Make export into a quarantine area, so that I can analyze and extract components without disrupting the existing codebase.

#### Acceptance Criteria

1. THE System SHALL create a quarantine folder structure at src/components/figma for feature components
2. THE System SHALL create a quarantine folder at src/styles/figma-globals.css for design foundation CSS
3. WHEN importing Figma components, THE System SHALL preserve the original file structure temporarily
4. THE System SHALL NOT introduce Vite configuration files (vite.config.*, index.html, main.tsx) into the Next.js repository
5. THE System SHALL NOT modify existing application routes or backend logic during import

### Requirement 2: Normalize Import Dependencies

**User Story:** As a developer, I want all package imports normalized to standard specifiers, so that the codebase follows consistent dependency conventions.

#### Acceptance Criteria

1. WHEN the System encounters version-suffixed imports (e.g., @radix-ui/react-slot@1.1.2), THE System SHALL replace them with non-versioned package names
2. THE System SHALL install required dependencies (Radix UI, class-variance-authority, lucide-react, sonner) only if missing from package.json
3. THE System SHALL ensure all TypeScript import paths align with the repository's tsconfig.json path mappings
4. THE System SHALL NOT create duplicate dependency entries in package.json
5. WHEN normalizing imports across all imported TypeScript and TSX files, THE System SHALL maintain functional equivalence

### Requirement 3: Port UI Primitives

**User Story:** As a developer, I want canonical UI primitives extracted from Figma Make, so that I can build pages with consistent, reusable components.

#### Acceptance Criteria

1. THE System SHALL create normalized primitives in src/components/ui for: button, input, card, dialog, tabs, toast, skeleton, spinner
2. WHEN a primitive uses React hooks or event handlers, THE System SHALL add "use client" directive
3. WHEN a primitive uses Radix UI components, THE System SHALL add "use client" directive
4. THE System SHALL NOT duplicate existing primitives without explicit justification
5. THE System SHALL export primitives from src/components/ui/index.ts for centralized imports
6. WHEN porting primitives, THE System SHALL preserve accessibility features from Radix UI components

### Requirement 4: Reconcile Design Tokens

**User Story:** As a developer, I want design tokens from Figma merged with existing Tailwind configuration, so that styling remains consistent across old and new UI.

#### Acceptance Criteria

1. THE System SHALL preserve the existing Tailwind configuration including racing.* color palette
2. THE System SHALL preserve the existing Tailwind safelist configuration
3. THE System SHALL introduce semantic CSS variables (--background, --foreground, --muted, --border, --primary, --destructive) from Figma globals
4. WHEN merging tokens, THE System SHALL extend the Tailwind theme without deleting existing values
5. THE System SHALL NOT hardcode hex color values directly in component files
6. THE System SHALL map Figma CSS variables to Tailwind utility classes where appropriate
7. WHEN conflicts arise between Figma tokens and existing tokens, THE System SHALL document the conflict and propose resolution

### Requirement 5: Rebuild Landing Page

**User Story:** As a user, I want a landing page that matches the Figma design, so that I experience a modern, cohesive interface.

#### Acceptance Criteria

1. THE System SHALL create a landing page route at src/app/page.tsx using canonical primitives
2. WHEN the landing page renders, THE System SHALL achieve visual parity with the Figma design
3. THE System SHALL implement the landing page as a Server Component where possible
4. WHEN client interactivity is required, THE System SHALL use Client Components with "use client" directive
5. THE System SHALL NOT directly copy-paste Figma page components that conflict with Next.js conventions
6. THE System SHALL implement responsive layouts matching Figma breakpoints

### Requirement 6: Rebuild Recommendations Page

**User Story:** As a user, I want a recommendations page that displays race recommendations with the new UI design, so that I can browse recommendations in an improved interface.

#### Acceptance Criteria

1. THE System SHALL create or update the recommendations route at src/app/dashboard/recommendations/page.tsx
2. WHEN the recommendations page renders, THE System SHALL use canonical primitives for layout and components
3. THE System SHALL implement loading states using skeleton components
4. THE System SHALL implement empty states when no recommendations exist
5. THE System SHALL implement error states for failed data fetching
6. WHEN displaying recommendations, THE System SHALL integrate with existing recommendation data APIs
7. THE System SHALL maintain existing recommendation filtering and sorting functionality

### Requirement 7: Implement Pricing Page with Stripe Checkout

**User Story:** As a user, I want to view pricing tiers and upgrade to premium, so that I can access premium features.

#### Acceptance Criteria

1. THE System SHALL create a pricing page route displaying subscription tiers
2. WHEN a user clicks an upgrade button, THE System SHALL call POST /api/stripe/checkout
3. THE System SHALL NOT implement raw credit card entry forms
4. WHEN the checkout endpoint is called, THE System SHALL create a Stripe Checkout Session on the server
5. WHEN the Stripe session is created, THE System SHALL redirect the user to the hosted Stripe Checkout page
6. THE System SHALL include success and cancel URLs in the Stripe session configuration
7. THE System SHALL pass user identification data to Stripe for entitlement tracking

### Requirement 8: Implement Stripe Webhook Handler

**User Story:** As a system administrator, I want Stripe payment events to update user entitlements, so that users automatically gain access to premium features after payment.

#### Acceptance Criteria

1. THE System SHALL create a webhook endpoint at /api/stripe/webhook
2. WHEN a checkout.session.completed event is received, THE System SHALL verify the webhook signature
3. WHEN the webhook signature is valid, THE System SHALL update the user's entitlement record in the database
4. WHEN the webhook signature is invalid, THE System SHALL return a 400 error and log the attempt
5. THE System SHALL handle idempotent webhook processing to prevent duplicate entitlement grants
6. THE System SHALL log all webhook events for audit purposes
7. WHEN webhook processing fails, THE System SHALL return appropriate error codes to Stripe for retry

### Requirement 9: Implement Premium Feature Gating

**User Story:** As a developer, I want premium features gated by database entitlements, so that only paying users can access premium functionality.

#### Acceptance Criteria

1. THE System SHALL verify user entitlements on the server before rendering premium features
2. WHEN a user without entitlement attempts to access premium features, THE System SHALL display an upgrade prompt
3. THE System SHALL NOT rely solely on client-side checks for premium feature access
4. WHEN checking entitlements, THE System SHALL query the database for the user's current subscription status
5. THE System SHALL cache entitlement checks appropriately to minimize database queries
6. WHEN a user's entitlement expires, THE System SHALL restrict access to premium features

### Requirement 10: Maintain Architectural Constraints

**User Story:** As a developer, I want the integration to preserve existing architecture, so that the application remains stable and maintainable.

#### Acceptance Criteria

1. THE System SHALL NOT modify the existing database schema
2. THE System SHALL NOT restructure the repository folder organization beyond adding new UI components
3. THE System SHALL NOT rewrite existing backend API logic unless required for Stripe integration
4. THE System SHALL NOT replace the existing Tailwind configuration file
5. THE System SHALL NOT introduce Vite build artifacts or configuration
6. WHEN adding new routes, THE System SHALL follow existing Next.js App Router conventions
7. THE System SHALL NOT modify existing authentication or authorization logic

### Requirement 11: Implement Loading and Skeleton States

**User Story:** As a user, I want to see loading indicators while content loads, so that I understand the application is working.

#### Acceptance Criteria

1. THE System SHALL implement skeleton components matching the structure of loaded content
2. WHEN data is loading, THE System SHALL display skeleton states instead of blank screens
3. THE System SHALL use Next.js loading.tsx files for route-level loading states where appropriate
4. WHEN using Suspense boundaries, THE System SHALL provide appropriate fallback components
5. THE System SHALL implement spinner components for inline loading states

### Requirement 12: Implement Toast Notifications

**User Story:** As a user, I want toast notifications for important actions, so that I receive feedback on my interactions.

#### Acceptance Criteria

1. THE System SHALL integrate the sonner toast library for notifications
2. WHEN a user completes an action (e.g., saves settings), THE System SHALL display a success toast
3. WHEN an error occurs, THE System SHALL display an error toast with a helpful message
4. THE System SHALL position toasts consistently according to the design system
5. WHEN multiple toasts are triggered, THE System SHALL stack them appropriately
6. THE System SHALL auto-dismiss toasts after an appropriate duration

### Requirement 13: Ensure TypeScript Type Safety

**User Story:** As a developer, I want full TypeScript type coverage, so that I catch errors at compile time.

#### Acceptance Criteria

1. THE System SHALL define TypeScript interfaces for all component props
2. THE System SHALL NOT use 'any' type except where absolutely necessary
3. WHEN importing third-party components, THE System SHALL use proper type definitions
4. THE System SHALL ensure all API responses have defined TypeScript types
5. THE System SHALL pass TypeScript compilation without errors

### Requirement 14: Implement Responsive Design

**User Story:** As a user, I want the UI to work on mobile and desktop devices, so that I can use the application on any device.

#### Acceptance Criteria

1. THE System SHALL implement responsive layouts using Tailwind breakpoints
2. WHEN the viewport is mobile-sized, THE System SHALL adapt layouts for smaller screens
3. THE System SHALL test layouts at mobile (320px), tablet (768px), and desktop (1024px+) breakpoints
4. WHEN implementing navigation, THE System SHALL provide mobile-appropriate navigation patterns
5. THE System SHALL ensure touch targets meet minimum size requirements on mobile devices

### Requirement 15: Preserve Existing Functionality

**User Story:** As a user, I want all existing features to continue working, so that the UI update doesn't break my workflow.

#### Acceptance Criteria

1. THE System SHALL maintain all existing API endpoints and their functionality
2. THE System SHALL preserve existing authentication and session management
3. THE System SHALL maintain existing recommendation algorithm logic
4. THE System SHALL preserve existing data synchronization with iRacing API
5. WHEN updating UI components, THE System SHALL ensure existing user workflows remain functional
6. THE System SHALL maintain existing performance characteristics or improve them
