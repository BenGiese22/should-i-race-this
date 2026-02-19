import React, { useState } from 'react';
import { GoalModeSelector, GoalMode } from './components/GoalModeSelector';
import { PrimaryRecommendationCard, PrimaryRecommendation } from './components/PrimaryRecommendationCard';
import { SecondaryRecommendationCard, SecondaryRecommendation } from './components/SecondaryRecommendationCard';
import { OtherOptionItem, OtherOption } from './components/OtherOptionItem';
import { ModeChangeNotification } from './components/ModeChangeNotification';
import { NoChangeNotification } from './components/NoChangeNotification';
import { LandingPage } from './components/LandingPage';
import { FirstTimeUserMessage } from './components/FirstTimeUserMessage';
import { FirstTimeLoadingState } from './components/FirstTimeLoadingState';
import { ReturningUserLoadingState } from './components/ReturningUserLoadingState';
import { EmptyState } from './components/EmptyState';
import { QuietWeekNotice } from './components/QuietWeekNotice';
import { StaleDataNotice } from './components/StaleDataNotice';
import { ProUpgradeConfirmation } from './components/ProUpgradeConfirmation';
import { ProExplanationPage } from './components/ProExplanationPage';
import { PaymentForm } from './components/PaymentForm';
import { SubscriptionManagement } from './components/SubscriptionManagement';
import { UpdatedTag } from './components/UpdatedTag';
import { ConfidenceChangeIndicator } from './components/ConfidenceChangeIndicator';
import { NewRacesAvailableBadge } from './components/NewRacesAvailableBadge';
import { DataRefreshTimestamp } from './components/DataRefreshTimestamp';
import { Calendar, Flag, MapPin } from 'lucide-react';

// Mock Data
const primaryRecommendation: PrimaryRecommendation = {
  id: '1',
  seriesName: 'Advanced Mazda MX-5 Cup',
  track: 'Road Atlanta - Full Course',
  license: 'C',
  nextRaceTime: '6:00 PM',
  nextRaceDate: 'Today, Feb 9',
  sessionLength: '25 minutes',
  raceType: 'Fixed',
  frequency: 'Every 2 hours',
  timezone: 'EST',
  userRaceCount: 18,
  avgPositionDelta: 3.2,
  avgIncidents: 1.8,
  confidence: 92,
  factors: [
    { 
      label: 'Position Gain Potential', 
      value: 88, 
      color: 'positive',
      description: 'You typically gain positions in this series and track combination'
    },
    { 
      label: 'Safety Rating Impact', 
      value: 92, 
      color: 'positive',
      description: 'Your incident rate is well below series average'
    },
    { 
      label: 'Track Familiarity', 
      value: 76, 
      color: 'neutral',
      description: 'You have recent experience at this track with competitive lap times'
    }
  ],
  modeExplanation: 'In Balanced Mode, we recommend races where you have a strong history of gaining positions while maintaining low incident counts. This race matches your skill level and offers optimal field strength for rating gains without excessive safety risk.',
  scoringBreakdown: [
    { factor: 'Historical Performance', score: 88, weight: 1.5, contribution: 132 },
    { factor: 'Safety Rating Potential', score: 92, weight: 1.2, contribution: 110 },
    { factor: 'Track Familiarity', score: 76, weight: 1.0, contribution: 76 },
    { factor: 'Field Strength Match', score: 81, weight: 1.3, contribution: 105 },
    { factor: 'Schedule Availability', score: 95, weight: 0.8, contribution: 76 }
  ],
  insights: [
    'You average a +3.2 position gain in this series over your last 18 races, indicating strong pace relative to typical competitors.',
    'Your incident rate of 1.8x per race is 40% better than the series average, suggesting good racecraft and track knowledge.',
    'The next race timing aligns with your typical racing schedule, and field sizes at this time average 24 drivers.',
    'Your recent lap times at Road Atlanta place you in the top 35% of the field, giving you realistic opportunities for top-10 finishes.'
  ]
};

const secondaryRecommendations: SecondaryRecommendation[] = [
  {
    id: '2',
    seriesName: 'Ferrari Fixed Series',
    track: 'Watkins Glen International - Boot',
    license: 'D',
    nextRaceTime: '8:00 PM',
    sessionLength: '20 minutes',
    raceType: 'Fixed',
    frequency: 'Every 2 hours',
    timezone: 'EST',
    confidence: 85,
    risk: 'low',
    topFactors: [
      { label: 'Safety Rating', value: 86, color: 'positive' },
      { label: 'Track Familiarity', value: 78, color: 'neutral' }
    ],
    whyGoodOption: [
      'Your incident rate in this series is 35% lower than average',
      'Strong position gains in evening time slots at this track',
      'Recent lap times place you in the top 30% of the field'
    ]
  },
  {
    id: '3',
    seriesName: 'Skip Barber Race Series',
    track: 'Summit Point Raceway - Summit Point Circuit',
    license: 'D',
    nextRaceTime: '10:00 AM',
    sessionLength: '18 minutes',
    raceType: 'Fixed',
    frequency: 'Daily',
    timezone: 'EST',
    confidence: 82,
    risk: 'moderate',
    topFactors: [
      { label: 'Position Gain', value: 74, color: 'positive' },
      { label: 'Field Strength', value: 68, color: 'caution' }
    ],
    whyGoodOption: [
      'You gained positions in 11 of your last 14 races here',
      'Morning slots typically have 18-22 competitive drivers',
      'Good track for building confidence with familiar car'
    ]
  }
];

const otherOptions: OtherOption[] = [
  {
    id: '4',
    seriesName: 'Porsche Cup Championship',
    track: 'Circuit de Spa-Francorchamps - Grand Prix',
    license: 'B',
    score: 68
  },
  {
    id: '5',
    seriesName: 'GT4 Sprint Series',
    track: 'Brands Hatch Circuit - Grand Prix',
    license: 'C',
    score: 65
  },
  {
    id: '6',
    seriesName: 'Production Car Challenge',
    track: 'Lime Rock Park - Full Course',
    license: 'D',
    score: 62
  },
  {
    id: '7',
    seriesName: 'Global Challenge',
    track: 'Monza - Grand Prix',
    license: 'C',
    score: 59
  },
  {
    id: '8',
    seriesName: 'Formula Renault 2.0',
    track: 'Silverstone Circuit - Grand Prix',
    license: 'C',
    score: 56
  }
];

export default function App() {
  // Auth state simulation - in production this would come from auth provider
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showReturningUserLoading, setShowReturningUserLoading] = useState(false);
  
  const [goalMode, setGoalMode] = useState<GoalMode>('balanced');
  const [isProUser, setIsProUser] = useState(false); // Toggle to test Explorer vs Pro
  const [showModeNotification, setShowModeNotification] = useState(false);
  const [showNoChangeNotification, setShowNoChangeNotification] = useState(false);
  const [notificationMode, setNotificationMode] = useState<GoalMode>('balanced');
  const [recommendationsKey, setRecommendationsKey] = useState(0);
  
  // Edge state controls
  const [emptyStateType, setEmptyStateType] = useState<'none' | 'no-recommendations' | 'no-matching-mode' | 'no-series-this-week'>('none');
  const [showQuietWeek, setShowQuietWeek] = useState(false);
  const [showStaleData, setShowStaleData] = useState(false);
  const [limitedHistory, setLimitedHistory] = useState(false);
  
  // Notification and refresh cue states
  const [showUpdatedTag, setShowUpdatedTag] = useState(false);
  const [showConfidenceChange, setShowConfidenceChange] = useState(false);
  const [previousConfidence, setPreviousConfidence] = useState(92);
  const [currentConfidence, setCurrentConfidence] = useState(92);
  const [confidenceChangeReason, setConfidenceChangeReason] = useState('');
  const [newRacesCount, setNewRacesCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshConfirmation, setShowRefreshConfirmation] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('2 hours ago');
  
  // Pro upgrade flow states
  const [showProExplanation, setShowProExplanation] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showProConfirmation, setShowProConfirmation] = useState(false);
  const [showSubscriptionManagement, setShowSubscriptionManagement] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<'monthly' | 'yearly'>('monthly');

  const handleModeChange = (newMode: GoalMode) => {
    // Don't show notification on initial load or when clicking locked modes
    const previousMode = goalMode;
    setGoalMode(newMode);
    
    // Only show notification if mode actually changed and user has access
    if (previousMode !== newMode && (isProUser || newMode === 'balanced')) {
      setNotificationMode(newMode);
      setShowModeNotification(true);
      // Trigger subtle visual refresh of recommendations
      setRecommendationsKey(prev => prev + 1);
    }
  };

  const handleGetStarted = () => {
    // Simulate OAuth flow and initial data load
    setIsAuthenticated(true);
    setIsLoading(true);
    setIsFirstTimeUser(true);
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleDismissFirstTimeMessage = () => {
    setIsFirstTimeUser(false);
  };

  const handleSimulateRefresh = () => {
    // For demo purposes - simulate a returning user refresh
    setShowReturningUserLoading(true);
    setTimeout(() => {
      setShowReturningUserLoading(false);
      setRecommendationsKey(prev => prev + 1);
    }, 3000);
  };
  
  // Pro upgrade flow handlers
  const handleStartProUpgrade = () => {
    setShowProExplanation(true);
  };
  
  const handleProceedToPayment = () => {
    setShowProExplanation(false);
    setShowPaymentForm(true);
  };
  
  const handlePaymentSuccess = () => {
    setShowPaymentForm(false);
    setIsProUser(true);
    setShowProConfirmation(true);
  };
  
  const handleCancelProFlow = () => {
    setShowProExplanation(false);
    setShowPaymentForm(false);
  };
  
  const handleOpenSubscriptionManagement = () => {
    setShowSubscriptionManagement(true);
  };
  
  const handleCancelSubscription = () => {
    setIsProUser(false);
    setShowSubscriptionManagement(false);
  };

  // Show landing page if not authenticated
  if (!isAuthenticated) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Show first-time loading state
  if (isLoading) {
    return <FirstTimeLoadingState onComplete={handleLoadingComplete} />;
  }

  // Show returning user loading state
  if (showReturningUserLoading) {
    return <ReturningUserLoadingState lastSyncTime="2 hours ago" />;
  }
  
  // Show Pro explanation page
  if (showProExplanation) {
    return (
      <ProExplanationPage 
        onProceedToPayment={handleProceedToPayment}
        onCancel={handleCancelProFlow}
      />
    );
  }
  
  // Show payment form
  if (showPaymentForm) {
    return (
      <PaymentForm 
        onSuccess={handlePaymentSuccess}
        onCancel={handleCancelProFlow}
      />
    );
  }
  
  // Show subscription management
  if (showSubscriptionManagement) {
    return (
      <SubscriptionManagement 
        isProUser={isProUser}
        subscriptionPlan={subscriptionPlan}
        renewalDate="March 11, 2026"
        onCancel={handleCancelSubscription}
        onBack={() => setShowSubscriptionManagement(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2">What Should I Race?</h1>
              <p className="text-[var(--text-secondary)]">
                Personalized recommendations based on your history, goals, and this week's schedule
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Back to Landing toggle */}
              <button
                onClick={() => setIsAuthenticated(false)}
                className="px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
              >
                ← Landing
              </button>
              {/* Demo refresh loading */}
              <button
                onClick={handleSimulateRefresh}
                className="px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
              >
                🔄 Refresh
              </button>
              {/* Empty States */}
              <select
                value={emptyStateType}
                onChange={(e) => setEmptyStateType(e.target.value as any)}
                className="px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-[var(--text-secondary)]"
              >
                <option value="none">Normal</option>
                <option value="no-recommendations">No Recommendations</option>
                <option value="no-matching-mode">No Matching Mode</option>
                <option value="no-series-this-week">No Series This Week</option>
              </select>
              {/* Edge States */}
              <button
                onClick={() => setShowQuietWeek(!showQuietWeek)}
                className={`px-3 py-2 text-xs border rounded-lg transition-colors ${showQuietWeek ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[#1A1D23]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)]'}`}
              >
                Quiet Week
              </button>
              <button
                onClick={() => setShowStaleData(!showStaleData)}
                className={`px-3 py-2 text-xs border rounded-lg transition-colors ${showStaleData ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[#1A1D23]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)]'}`}
              >
                Stale Data
              </button>
              <button
                onClick={() => setLimitedHistory(!limitedHistory)}
                className={`px-3 py-2 text-xs border rounded-lg transition-colors ${limitedHistory ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[#1A1D23]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)]'}`}
              >
                Limited History
              </button>
              <button
                onClick={() => setShowNoChangeNotification(true)}
                className="px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
              >
                No Change
              </button>
              {/* Notification Cue Demos */}
              <button
                onClick={() => setShowUpdatedTag(!showUpdatedTag)}
                className={`px-3 py-2 text-xs border rounded-lg transition-colors ${showUpdatedTag ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[#1A1D23]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)]'}`}
              >
                Updated Tag
              </button>
              <button
                onClick={() => {
                  setShowConfidenceChange(!showConfidenceChange);
                  if (!showConfidenceChange) {
                    setPreviousConfidence(92);
                    setCurrentConfidence(97);
                    setConfidenceChangeReason('Confidence increased after recent results');
                  }
                }}
                className={`px-3 py-2 text-xs border rounded-lg transition-colors ${showConfidenceChange ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[#1A1D23]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)]'}`}
              >
                +Confidence
              </button>
              <button
                onClick={() => setNewRacesCount(newRacesCount === 0 ? 3 : 0)}
                className={`px-3 py-2 text-xs border rounded-lg transition-colors ${newRacesCount > 0 ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[#1A1D23]' : 'bg-[var(--bg-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)]'}`}
              >
                New Races
              </button>
              {/* Demo toggle for testing */}
              <button
                onClick={() => setIsProUser(!isProUser)}
                className="px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
              >
                {isProUser ? '✨ Pro' : '🆓 Explorer'}
              </button>
              {/* Pro Upgrade Flow Demos */}
              <button
                onClick={handleStartProUpgrade}
                className="px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
              >
                💳 Upgrade Flow
              </button>
              <button
                onClick={handleOpenSubscriptionManagement}
                className="px-3 py-2 text-xs bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]"
              >
                ⚙️ Billing
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Pro Upgrade Confirmation Overlay */}
      {showProConfirmation && (
        <div className="fixed top-8 right-8 z-50 max-w-md">
          <ProUpgradeConfirmation 
            show={showProConfirmation}
            onDismiss={() => setShowProConfirmation(false)}
          />
        </div>
      )}
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* First-Time User Message */}
        {isFirstTimeUser && (
          <section>
            <FirstTimeUserMessage onDismiss={handleDismissFirstTimeMessage} />
          </section>
        )}
        
        {/* Goal Mode Selector */}
        <section>
          <h2 className="mb-4">Your Goal</h2>
          <GoalModeSelector 
            selectedMode={goalMode}
            onModeChange={handleModeChange}
            isProUser={isProUser}
          />
        </section>
        
        {/* Mode Change Notification */}
        {showModeNotification && (
          <section>
            <ModeChangeNotification
              mode={notificationMode}
              show={showModeNotification}
              onDismiss={() => setShowModeNotification(false)}
            />
          </section>
        )}
        
        {/* No Change Notification */}
        {showNoChangeNotification && (
          <section>
            <NoChangeNotification
              show={showNoChangeNotification}
              seriesName={primaryRecommendation.seriesName}
              onDismiss={() => setShowNoChangeNotification(false)}
            />
          </section>
        )}
        
        {/* Stale Data Notice */}
        {showStaleData && (
          <section>
            <StaleDataNotice
              lastRaceDate="14 days ago"
              daysSinceLastRace={14}
              onRefresh={handleSimulateRefresh}
            />
          </section>
        )}
        
        {/* Context Summary */}
        <section>
          <div className="flex items-center justify-between px-5 py-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[var(--accent-info)]" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">Week 3, 2026 S1</span>
              </div>
              <div className="h-4 w-px bg-[var(--border-medium)]" />
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-[var(--accent-info)]" />
                <span className="text-sm text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)] stat-number">12</span> eligible series
                </span>
              </div>
              <div className="h-4 w-px bg-[var(--border-medium)]" />
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--accent-info)]" />
                <span className="text-sm text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)] stat-number">8</span> tracks you own
                </span>
              </div>
            </div>
            <DataRefreshTimestamp 
              lastSyncTime={lastSyncTime}
              isRefreshing={isRefreshing}
              showRefreshConfirmation={showRefreshConfirmation}
            />
          </div>
        </section>
        
        {/* New Races Available Badge */}
        {newRacesCount > 0 && (
          <section>
            <NewRacesAvailableBadge 
              count={newRacesCount}
              onDismiss={() => setNewRacesCount(0)}
            />
          </section>
        )}
        
        {/* Quiet Week Notice */}
        {showQuietWeek && emptyStateType === 'none' && (
          <section>
            <QuietWeekNotice totalRecommendations={2} />
          </section>
        )}
        
        {/* Empty State or Recommendations */}
        {emptyStateType !== 'none' ? (
          <section>
            <EmptyState 
              type={emptyStateType} 
              currentMode={goalMode}
              onSuggestedAction={() => {
                if (emptyStateType === 'no-matching-mode') {
                  handleModeChange('balanced');
                  setEmptyStateType('none');
                }
              }}
            />
          </section>
        ) : (
          <>
            {/* Primary Recommendation */}
            <section key={`primary-${recommendationsKey}`} className="animate-subtle-fade">
              <PrimaryRecommendationCard 
                recommendation={{
                  ...primaryRecommendation,
                  userRaceCount: limitedHistory ? 3 : 18
                }}
                isProUser={isProUser}
                showUpdatedTag={showUpdatedTag}
                updatedMessage="Your top recommendation has changed based on recent data"
                showConfidenceChange={showConfidenceChange}
                previousConfidence={previousConfidence}
                confidenceChangeReason={confidenceChangeReason}
              />
            </section>
            
            {/* Secondary Recommendations */}
            <section key={`secondary-${recommendationsKey}`} className="animate-subtle-fade">
              <div className="flex items-center justify-between mb-4">
                <h2>Also Great Options</h2>
                <p className="text-sm text-[var(--text-tertiary)]">
                  Based on your current form and schedule
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {secondaryRecommendations.map((rec) => (
                  <SecondaryRecommendationCard 
                    key={rec.id}
                    recommendation={rec}
                    onClick={() => console.log('View secondary:', rec.id)}
                  />
                ))}
              </div>
            </section>
            
            {/* Other Options */}
            <section key={`other-${recommendationsKey}`} className="animate-subtle-fade">
              <h2 className="mb-4">Other Options</h2>
              <div className="space-y-2">
                {otherOptions.map((option) => (
                  <OtherOptionItem 
                    key={option.id}
                    option={option}
                    onClick={() => console.log('View option:', option.id)}
                  />
                ))}
              </div>
            </section>
          </>
        )}
        
      </main>
      
      {/* Footer Spacing */}
      <div className="h-16" />
    </div>
  );
}