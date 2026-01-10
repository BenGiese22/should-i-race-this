# User Journey

## Complete User Experience Flow

This document maps the end-to-end user journey from first visit to receiving personalized race recommendations.

## Journey Overview

```mermaid
graph TD
    A[Landing Page Visit] --> B{User Authenticated?}
    B -->|No| C[View Marketing Content]
    B -->|Yes| D[Redirect to Dashboard]
    
    C --> E[Click Login Button]
    E --> F[iRacing OAuth Flow]
    F --> G[Account Creation/Login]
    G --> H[Initial Data Sync]
    H --> I[Dashboard Welcome]
    
    D --> J[Dashboard Home]
    I --> J
    
    J --> K[View Recommendations]
    J --> L[View Analytics]
    J --> M[Sync Latest Data]
    
    K --> N[Select Recommendation Mode]
    N --> O[Browse Scored Opportunities]
    O --> P[View Detailed Analysis]
    
    L --> Q[Performance Trends]
    L --> R[Series/Track Breakdown]
    
    M --> S[Background Data Fetch]
    S --> T[Update Dashboard]
```

## Detailed User Flows

### 1. First-Time User Experience

#### Landing Page Experience
```mermaid
sequenceDiagram
    participant U as User
    participant LP as Landing Page
    participant Auth as Auth System
    participant iR as iRacing OAuth
    
    U->>LP: Visit site
    LP->>U: Show marketing content
    Note over LP: Features, benefits, how it works
    
    U->>LP: Click "Login with iRacing"
    LP->>Auth: Initiate OAuth flow
    Auth->>iR: Redirect with PKCE params
    iR->>U: Show iRacing login
    
    U->>iR: Enter credentials
    iR->>Auth: Return with auth code
    Auth->>Auth: Exchange code for tokens
    Auth->>Auth: Fetch user profile
    Auth->>U: Set session cookie
    Auth->>LP: Redirect to dashboard
```

#### Initial Data Sync Process
```mermaid
sequenceDiagram
    participant U as User
    participant D as Dashboard
    participant API as Sync API
    participant iR as iRacing API
    participant DB as Database
    
    U->>D: First dashboard visit
    D->>API: Trigger initial sync
    Note over D: Show loading state
    
    API->>iR: Fetch race history
    iR->>API: Return race results
    API->>DB: Store race results
    
    API->>iR: Fetch license info
    iR->>API: Return license data
    API->>DB: Update license classes
    
    API->>D: Sync complete
    D->>U: Show welcome screen with profile
```

### 2. Returning User Experience

#### Dashboard Access
```mermaid
sequenceDiagram
    participant U as User
    participant D as Dashboard
    participant Auth as Auth System
    participant Cache as Cache Layer
    
    U->>D: Visit dashboard
    D->>Auth: Validate session
    Auth->>D: User authenticated
    
    D->>Cache: Check for cached data
    Cache->>D: Return cached recommendations
    D->>U: Show dashboard with data
    
    Note over D: Background: Check for stale data
    D->>API: Refresh if needed
```

### 3. Recommendation Flow

#### Getting Recommendations
```mermaid
sequenceDiagram
    participant U as User
    participant R as Recommendations Page
    participant E as Recommendation Engine
    participant DB as Database
    participant C as Cache
    
    U->>R: Request recommendations
    R->>R: Show loading state
    
    R->>E: GET /api/recommendations?mode=balanced
    E->>C: Check cache
    C->>E: Cache miss
    
    E->>DB: Query user history
    E->>DB: Query current schedule
    E->>DB: Query global stats
    
    E->>E: Run scoring algorithm
    E->>C: Cache results
    E->>R: Return scored opportunities
    
    R->>U: Display recommendations
```

#### Recommendation Mode Selection
```mermaid
stateDiagram-v2
    [*] --> Balanced
    
    Balanced --> iRatingPush: User selects "Push iRating"
    Balanced --> SafetyRecovery: User selects "Safety Focus"
    
    iRatingPush --> Balanced: User selects "Balanced"
    iRatingPush --> SafetyRecovery: User selects "Safety Focus"
    
    SafetyRecovery --> Balanced: User selects "Balanced"
    SafetyRecovery --> iRatingPush: User selects "Push iRating"
    
    note right of Balanced
        Default mode
        Equal weight to all factors
    end note
    
    note right of iRatingPush
        Emphasizes performance
        Higher risk tolerance
    end note
    
    note right of SafetyRecovery
        Prioritizes safety
        Lower incident risk
    end note
```

### 4. Analytics Flow

#### Performance Analysis Journey
```mermaid
graph TD
    A[Analytics Dashboard] --> B[Overall Performance]
    A --> C[Series Breakdown]
    A --> D[Track Analysis]
    A --> E[Trend Analysis]
    
    B --> F[Position Delta Trends]
    B --> G[Incident Rate Analysis]
    B --> H[Consistency Metrics]
    
    C --> I[Series Performance Comparison]
    C --> J[License Category Analysis]
    
    D --> K[Track-Specific Performance]
    D --> L[Favorite Tracks]
    
    E --> M[iRating Progression]
    E --> N[Safety Rating Trends]
    E --> O[Recent Performance]
```

## User Interface States

### Loading States
```mermaid
stateDiagram-v2
    [*] --> Initial
    Initial --> Loading: User action
    Loading --> Success: Data loaded
    Loading --> Error: Request failed
    Success --> Loading: Refresh data
    Error --> Loading: Retry
    Error --> [*]: Give up
    Success --> [*]: User navigates away
```

### Data Freshness Indicators
- **Fresh Data** (< 1 hour): Green indicator, no action needed
- **Stale Data** (1-24 hours): Yellow indicator, "Refresh" button available
- **Old Data** (> 24 hours): Red indicator, automatic refresh prompt

### Error Recovery Flows
```mermaid
graph TD
    A[Error Occurs] --> B{Error Type}
    
    B -->|Network Error| C[Show Retry Button]
    B -->|Auth Error| D[Redirect to Login]
    B -->|Rate Limit| E[Show Wait Message]
    B -->|Server Error| F[Show Error Page]
    
    C --> G[User Retries]
    G --> H{Success?}
    H -->|Yes| I[Continue Normal Flow]
    H -->|No| J[Show Persistent Error]
    
    E --> K[Auto-retry After Delay]
    K --> I
    
    F --> L[Contact Support Option]
```

## Mobile Experience Considerations

### Responsive Design Flow
- **Desktop**: Full dashboard with side navigation
- **Tablet**: Collapsible navigation, optimized charts
- **Mobile**: Bottom navigation, simplified views

### Touch Interactions
- **Swipe**: Navigate between recommendation cards
- **Tap**: Expand recommendation details
- **Pull-to-refresh**: Update data
- **Long press**: Access additional options

## Performance Optimization Points

### Critical User Paths
1. **Login to Dashboard**: < 3 seconds
2. **Recommendation Loading**: < 2 seconds
3. **Data Sync**: < 30 seconds (with progress)
4. **Analytics Loading**: < 1 second (cached)

### Progressive Loading Strategy
```mermaid
sequenceDiagram
    participant U as User
    participant UI as User Interface
    participant API as API Layer
    participant Cache as Cache
    
    U->>UI: Request page
    UI->>Cache: Load cached shell
    UI->>U: Show page skeleton
    
    UI->>API: Fetch fresh data
    UI->>U: Show loading indicators
    
    API->>UI: Return data chunks
    UI->>U: Progressive content updates
    
    API->>UI: Complete data load
    UI->>U: Final page state
```

## User Feedback Loops

### Implicit Feedback
- **Click-through rates** on recommendations
- **Time spent** analyzing specific opportunities
- **Return visits** to dashboard
- **Feature usage** patterns

### Explicit Feedback
- **Recommendation ratings** (thumbs up/down)
- **Mode preference** selection frequency
- **Manual data refresh** requests
- **Support ticket** themes

## Accessibility Considerations

### Keyboard Navigation
- **Tab order**: Logical flow through interface
- **Shortcuts**: Quick access to main features
- **Focus indicators**: Clear visual feedback

### Screen Reader Support
- **Semantic HTML**: Proper heading structure
- **ARIA labels**: Descriptive element labels
- **Alt text**: Meaningful image descriptions
- **Live regions**: Dynamic content updates

### Visual Accessibility
- **Color contrast**: WCAG AA compliance
- **Font sizes**: Scalable text
- **Color independence**: Information not color-dependent
- **Motion reduction**: Respect user preferences

---

**Next**: [OAuth Integration](./05-oauth-integration.md) - Detailed iRacing authentication flow
