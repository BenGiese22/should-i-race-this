# Requirements Document

## Introduction

The Racing Analytics Dashboard is a web application that helps iRacing users answer the question "Should I race this?" by providing data-driven insights about their historical performance across different series and tracks. The application integrates with iRacing's OAuth2 system and Data API to fetch user race results, analyze performance patterns, and present actionable recommendations for improving iRating, Safety Rating, or maintaining a balanced approach.

## Glossary

- **iRacing**: Online racing simulation platform and service
- **iRating**: iRacing's skill-based matchmaking rating system (similar to MMR)
- **Safety_Rating**: iRacing's safe driving score that measures incident-free racing
- **Series**: A specific racing championship or competition format in iRacing
- **Track**: A racing circuit or venue where races take place
- **Subsession**: An individual race session within iRacing
- **OAuth_Flow**: Authentication process using iRacing's OAuth2 system
- **Data_API**: iRacing's REST API for accessing race data and statistics
- **Dashboard**: The main application interface showing analytics and recommendations
- **Performance_Metrics**: Statistical data about user's racing performance (starting position, finishing position, incidents, etc.)
- **Session_Type**: The type of racing session (Practice, Qualifying, Time Trial, Race)
- **Event_Type**: iRacing's numerical classification for session types
- **License_Level**: User's current racing license grade (Rookie, D, C, B, A, Pro)
- **Current_Schedule**: iRacing's active weekly race schedule showing available series and tracks
- **Scoring_Algorithm**: Mathematical model that evaluates racing opportunities based on multiple performance factors

## Requirements

### Requirement 1: User Authentication

**User Story:** As a racing enthusiast, I want to securely authenticate with my iRacing account, so that I can access my personal racing data and analytics.

#### Acceptance Criteria

1. WHEN a user visits the landing page, THE Dashboard SHALL display a "Login with iRacing" button matching the provided design
2. WHEN a user clicks the login button, THE OAuth_Flow SHALL initiate using iRacing's authorization code flow with PKCE
3. WHEN the OAuth flow completes successfully, THE Dashboard SHALL store access and refresh tokens securely
4. WHEN tokens expire, THE Dashboard SHALL automatically refresh them using the refresh token
5. IF token refresh fails, THEN THE Dashboard SHALL redirect the user to re-authenticate

### Requirement 2: Landing Page Experience

**User Story:** As a potential user, I want to understand what the application does, so that I can decide whether to authenticate and use the service.

#### Acceptance Criteria

1. WHEN a user visits the application, THE Dashboard SHALL display a clear explanation of the "Should I race this?" problem
2. WHEN displaying the landing page, THE Dashboard SHALL use modern, racing-themed visual design
3. WHEN a user views the landing page, THE Dashboard SHALL prominently feature the "Login with iRacing" button
4. WHEN presenting the value proposition, THE Dashboard SHALL explain how the app helps with iRating and Safety Rating decisions

### Requirement 3: Historical Race Data Retrieval and Session Type Classification

**User Story:** As an authenticated user, I want the system to fetch and properly categorize my historical race results, so that I can see comprehensive analytics about my performance across different session types.

#### Acceptance Criteria

1. WHEN a user completes authentication, THE Dashboard SHALL fetch their race history using the iRacing Data API
2. WHEN retrieving race data, THE Dashboard SHALL collect series information, track details, starting positions, finishing positions, incident counts, and session types
3. WHEN processing race results, THE Dashboard SHALL normalize session types using API event type fields or parsed session names into Practice, Qualifying, Time Trial, and Race categories
4. WHEN storing race data, THE Dashboard SHALL persist the normalized session type for each result
5. WHEN calculating performance deltas, THE Dashboard SHALL compute starting position minus finishing position for each session
6. WHEN data retrieval fails, THE Dashboard SHALL display appropriate error messages and retry mechanisms
7. WHEN fetching large datasets, THE Dashboard SHALL implement pagination and loading indicators

### Requirement 4: Flexible Performance Analytics Views

**User Story:** As a racing driver, I want to view my historical performance data by series, track, or series-track combinations, so that I can analyze patterns at different levels of granularity.

#### Acceptance Criteria

1. WHEN viewing analytics, THE Dashboard SHALL provide toggle options for "Series", "Track", or "Series + Track" views
2. WHEN displaying "Series" view, THE Dashboard SHALL aggregate performance metrics across all tracks within each series
3. WHEN displaying "Track" view, THE Dashboard SHALL aggregate performance metrics across all series for each track
4. WHEN displaying "Series + Track" view, THE Dashboard SHALL show performance metrics for each unique series-track combination
5. WHEN presenting analytics data, THE Dashboard SHALL show average starting position, average finishing position, position delta, and average incidents
6. WHEN calculating averages, THE Dashboard SHALL allow filtering by session type (Practice, Qualifying, Time Trial, Race)
7. WHEN displaying the analytics table, THE Dashboard SHALL use clear, modern design with racing-themed styling
8. WHEN showing position deltas, THE Dashboard SHALL use positive values for improvement and negative values for decline

### Requirement 5: Advanced Search and Filtering Functionality

**User Story:** As a user analyzing my performance, I want to search and filter my race data by multiple criteria including session types, so that I can focus on specific aspects of my racing performance.

#### Acceptance Criteria

1. WHEN using the analytics interface, THE Dashboard SHALL provide search functionality across series and track names
2. WHEN filtering data, THE Dashboard SHALL support filtering by series categories (oval, road, dirt oval, dirt road)
3. WHEN filtering data, THE Dashboard SHALL support filtering by session type (Practice, Qualifying, Time Trial, Race)
4. WHEN filtering data, THE Dashboard SHALL support filtering by date ranges and seasons
5. WHEN applying filters, THE Dashboard SHALL update the table results in real-time
6. WHEN searching, THE Dashboard SHALL highlight matching text in the results
7. WHEN no results match the search criteria, THE Dashboard SHALL display an appropriate "no results" message

### Requirement 6: Current Schedule Integration and License Validation

**User Story:** As a competitive racer, I want recommendations based on the current iRacing schedule and my license level, so that I only see racing opportunities that are actually available to me.

#### Acceptance Criteria

1. WHEN generating recommendations, THE Dashboard SHALL fetch the current iRacing weekly schedule using the race guide API
2. WHEN retrieving user profile, THE Dashboard SHALL obtain the user's current license levels for each racing category
3. WHEN filtering available series, THE Dashboard SHALL exclude series that require higher license levels than the user possesses
4. WHEN displaying recommendations, THE Dashboard SHALL only show series and tracks that are currently scheduled for the active race week
5. WHEN license levels change, THE Dashboard SHALL update available recommendations accordingly
6. WHEN the weekly schedule updates, THE Dashboard SHALL refresh recommendations to reflect new availability

### Requirement 7: Multi-Factor Scoring Algorithm for Racing Recommendations

**User Story:** As a competitive racer, I want sophisticated recommendations that consider multiple performance and risk factors, so that I can make optimal decisions about which races to join based on my goals.

#### Acceptance Criteria

1. WHEN calculating recommendation scores, THE Scoring_Algorithm SHALL evaluate Performance factor using expected finish delta positions (higher is better)
2. WHEN calculating recommendation scores, THE Scoring_Algorithm SHALL evaluate Safety factor using blended personal and global incidents per race (lower is better)
3. WHEN calculating recommendation scores, THE Scoring_Algorithm SHALL evaluate Consistency factor using blended personal and global finish-position standard deviation (lower is better)
4. WHEN calculating recommendation scores, THE Scoring_Algorithm SHALL evaluate Predictability factor using global strength-of-field variability by time slot (lower is better)
5. WHEN calculating recommendation scores, THE Scoring_Algorithm SHALL evaluate Familiarity factor using personal starts on the series-track combination (higher is better)
6. WHEN calculating recommendation scores, THE Scoring_Algorithm SHALL evaluate Fatigue Risk factor using race length and open setup penalty (higher is worse)
7. WHEN calculating recommendation scores, THE Scoring_Algorithm SHALL evaluate Attrition Risk factor using global attrition rate (higher is worse)
8. WHEN calculating recommendation scores, THE Scoring_Algorithm SHALL evaluate Time Volatility factor using time-of-day heuristics (late-night higher risk)
9. WHEN combining factors, THE Scoring_Algorithm SHALL apply different weightings based on user-selected mode (Balanced, iRating Push, Safety Rating Recovery)
10. WHEN generating final scores, THE Scoring_Algorithm SHALL produce a 0-100 recommendation score with separate iRating and Safety Rating risk outputs

### Requirement 8: Recommendation Display Interface

**User Story:** As a user seeking racing guidance, I want to see my personalized recommendations with detailed scoring breakdowns, so that I can understand the reasoning behind each suggestion and make informed decisions.

#### Acceptance Criteria

1. WHEN displaying recommendations, THE Dashboard SHALL present them in a dedicated table or card-based interface
2. WHEN showing recommendation details, THE Dashboard SHALL include series name, track name, overall score (0-100), and recommendation mode
3. WHEN presenting scoring details, THE Dashboard SHALL show individual factor scores and their contribution to the overall recommendation
4. WHEN displaying recommendations, THE Dashboard SHALL include separate iRating risk and Safety Rating risk indicators
5. WHEN presenting recommendations, THE Dashboard SHALL use racing-themed visual design consistent with the main interface
6. WHEN a user switches between recommendation modes, THE Dashboard SHALL update the recommendations and scoring dynamically
7. WHEN no recommendations are available, THE Dashboard SHALL explain why and suggest actions to improve data availability

### Requirement 9: Data Synchronization and Schedule Updates

**User Story:** As an active racer, I want my race data and current schedule information to stay current, so that my analytics and recommendations reflect my latest performance and available racing opportunities.

#### Acceptance Criteria

1. WHEN a user logs in, THE Dashboard SHALL check for new race data since the last sync
2. WHEN new race data is available, THE Dashboard SHALL fetch and integrate it into the existing analytics
3. WHEN the weekly schedule changes, THE Dashboard SHALL update the current schedule data and refresh recommendations
4. WHEN data sync is in progress, THE Dashboard SHALL display appropriate loading indicators
5. WHEN sync completes, THE Dashboard SHALL refresh the analytics tables and recommendations
6. WHEN sync fails, THE Dashboard SHALL provide error messages and manual refresh options

### Requirement 10: Responsive Design and Performance

**User Story:** As a user accessing the application from different devices, I want a responsive interface that performs well, so that I can use the analytics effectively regardless of my device.

#### Acceptance Criteria

1. WHEN accessing the application, THE Dashboard SHALL render properly on desktop, tablet, and mobile devices
2. WHEN displaying large datasets, THE Dashboard SHALL implement efficient pagination and virtualization
3. WHEN loading data, THE Dashboard SHALL provide responsive feedback and avoid blocking the interface
4. WHEN using interactive features, THE Dashboard SHALL respond within 200ms for optimal user experience
5. WHEN the application encounters errors, THE Dashboard SHALL gracefully handle them without crashing

### Requirement 11: Data Privacy and Security

**User Story:** As a user sharing my racing data, I want my information to be handled securely and privately, so that I can trust the application with my iRacing account access.

#### Acceptance Criteria

1. WHEN storing authentication tokens, THE Dashboard SHALL use secure, encrypted storage mechanisms
2. WHEN handling user data, THE Dashboard SHALL comply with data privacy best practices
3. WHEN a user logs out, THE Dashboard SHALL properly revoke tokens and clear sensitive data
4. WHEN making API requests, THE Dashboard SHALL use HTTPS for all communications
5. WHEN storing race data, THE Dashboard SHALL implement appropriate data retention policies