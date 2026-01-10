# Requirements Document

## Introduction

This specification addresses critical improvements to the recommendations system based on user feedback, focusing on accurate license handling, UI/UX enhancements, and recommendation accuracy.

## Glossary

- **License_System**: The component that manages iRacing license categories and levels
- **Sports_Car_License**: iRacing Sports Car category (category_id: 5)
- **Formula_Car_License**: iRacing Formula Car category (category_id: 6)
- **Recommendation_Card**: UI component displaying individual race recommendations
- **Recommendation_Modal**: Detailed view modal for race recommendations
- **Fixed_Setup**: iRacing series that use predetermined car setups
- **Open_Setup**: iRacing series that allow custom car setups
- **Confidence_Badge**: UI indicator showing recommendation confidence level
- **Score_Gradient**: Visual representation of recommendation scores

## Requirements

### Requirement 1: Accurate License Category Handling

**User Story:** As a user, I want the system to correctly recognize all 5 iRacing license categories, so that recommendations are based on my actual racing eligibility.

#### Acceptance Criteria

1. THE License_System SHALL recognize 5 distinct license categories: oval, sports_car, formula_car, dirt_oval, dirt_road
2. WHEN processing license data from iRacing API, THE License_System SHALL preserve Sports_Car_License and Formula_Car_License as separate categories
3. THE License_System SHALL store all 5 license categories in the database without merging sports_car and formula_car into road
4. WHEN displaying licenses in UI, THE License_System SHALL show Sports_Car_License and Formula_Car_License as separate entries
5. THE License_System SHALL use dropdown selection for choosing between sports_car and formula_car series instead of separate buttons

### Requirement 2: Modal Interaction Improvements

**User Story:** As a user, I want intuitive modal interactions, so that I can easily view and dismiss recommendation details.

#### Acceptance Criteria

1. WHEN a user clicks on a Recommendation_Card, THE system SHALL open the Recommendation_Modal
2. WHEN a user clicks outside the Recommendation_Modal, THE system SHALL close the modal
3. WHEN a user presses the Escape key, THE system SHALL close the Recommendation_Modal
4. THE Recommendation_Modal SHALL have a visible close button in the top-right corner

### Requirement 3: Score Visualization Improvements

**User Story:** As a user, I want clear and consistent score visualization, so that I can quickly understand recommendation quality.

#### Acceptance Criteria

1. THE Score_Gradient SHALL use a solid color based on score value, not a gradient on the progress bar itself
2. WHEN score is 0, THE Score_Gradient SHALL display red color (#ef4444)
3. WHEN score is 100, THE Score_Gradient SHALL display green color (#22c55e)
4. THE Score_Gradient SHALL interpolate colors between red and green based on score percentage
5. THE progress bar SHALL display as one solid color, not a gradient

### Requirement 4: Icon and Visual Standardization

**User Story:** As a user, I want consistent and minimal iconography, so that the interface is clean and professional.

#### Acceptance Criteria

1. THE system SHALL use standard icons instead of emojis throughout the interface
2. THE system SHALL limit icon usage to essential navigation and status indicators
3. THE system SHALL maintain consistent icon sizing and styling across all components
4. THE system SHALL remove decorative emojis from text content

### Requirement 5: Recommendation Card Layout Improvements

**User Story:** As a user, I want clear and balanced recommendation card layouts, so that I can quickly identify series and tracks.

#### Acceptance Criteria

1. THE Recommendation_Card SHALL prominently display series name and track name
2. THE "Contender" confidence badge SHALL be sized consistently with "High Confidence" and "Estimated" badges
3. THE confidence badges SHALL not dominate the card layout
4. THE series name SHALL be the primary heading on each card
5. THE track name SHALL be clearly visible as secondary information

### Requirement 6: Tooltip Background Fix

**User Story:** As a user, I want readable tooltips, so that I can understand confidence level meanings.

#### Acceptance Criteria

1. WHEN hovering over "High Confidence" badge, THE tooltip SHALL have an opaque background
2. WHEN hovering over "Estimated" badge, THE tooltip SHALL have an opaque background
3. THE tooltip background SHALL ensure text readability against any background color
4. THE tooltip SHALL maintain consistent styling with other system tooltips

### Requirement 7: License Filtering and Setup Type Accuracy

**User Story:** As a user, I want accurate race recommendations, so that I only see series I'm eligible to race and appropriate setup types.

#### Acceptance Criteria

1. THE system SHALL only recommend series where the user meets the minimum license requirements
2. THE system SHALL verify license eligibility using the correct 5-category system
3. THE system SHALL include Fixed_Setup series in recommendations when appropriate
4. THE system SHALL display setup type (fixed/open) clearly in recommendations
5. THE system SHALL filter recommendations based on user's actual license levels in all 5 categories
6. WHEN a user has multiple license categories, THE system SHALL recommend series from all eligible categories
7. THE system SHALL not recommend series requiring higher license levels than the user possesses

### Requirement 8: Database Schema Updates

**User Story:** As a system administrator, I want accurate license data storage, so that the system can make correct recommendations.

#### Acceptance Criteria

1. THE database schema SHALL support 5 distinct license categories
2. THE license mapping functions SHALL preserve sports_car and formula_car categories
3. THE system SHALL migrate existing road licenses to appropriate sports_car or formula_car categories
4. THE database queries SHALL handle all 5 license categories correctly
5. THE system SHALL maintain backward compatibility during license category migration

### Requirement 9: Setup Type Integration

**User Story:** As a user, I want to see both fixed and open setup recommendations, so that I can choose series that match my setup preferences.

#### Acceptance Criteria

1. THE system SHALL retrieve setup type information from schedule data
2. THE system SHALL display setup type prominently in Recommendation_Card
3. THE system SHALL allow filtering by setup type (fixed/open)
4. THE system SHALL ensure Fixed_Setup series are included in recommendation pool
5. THE system SHALL validate that setup type data is accurate and up-to-date