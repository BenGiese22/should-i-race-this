import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { 
  PrimaryRecommendationSkeleton, 
  SecondaryRecommendationSkeleton, 
  OtherOptionSkeleton 
} from './SkeletonCard';

type LoadingStep = 'connecting' | 'fetching' | 'analyzing' | 'complete';

interface FirstTimeLoadingStateProps {
  onComplete: () => void;
}

const loadingSteps = [
  { 
    id: 'connecting' as LoadingStep, 
    label: 'Connecting your account',
    duration: 1000 
  },
  { 
    id: 'fetching' as LoadingStep, 
    label: 'Fetching your race history',
    duration: 2500 
  },
  { 
    id: 'analyzing' as LoadingStep, 
    label: 'Building personalized recommendations',
    duration: 2000 
  }
];

export function FirstTimeLoadingState({ onComplete }: FirstTimeLoadingStateProps) {
  const [currentStep, setCurrentStep] = useState<LoadingStep>('connecting');
  const [completedSteps, setCompletedSteps] = useState<LoadingStep[]>([]);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    let stepIndex = 0;
    
    const progressThroughSteps = () => {
      if (stepIndex < loadingSteps.length) {
        const step = loadingSteps[stepIndex];
        setCurrentStep(step.id);
        
        setTimeout(() => {
          setCompletedSteps(prev => [...prev, step.id]);
          stepIndex++;
          progressThroughSteps();
        }, step.duration);
      } else {
        // All steps complete, transition to dashboard
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    };

    progressThroughSteps();

    // Show timeout message after 10 seconds
    const timeoutTimer = setTimeout(() => {
      setShowTimeout(true);
    }, 10000);

    return () => {
      clearTimeout(timeoutTimer);
    };
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      {/* Header - maintains continuity */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div>
            <h1 className="mb-2">What Should I Race?</h1>
            <p className="text-[var(--text-secondary)]">
              Setting up your personalized recommendations
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Loading Status Card */}
        <section>
          <div className="bg-[var(--bg-surface)] border border-[var(--accent-primary)] border-opacity-30 rounded-xl p-8">
            {/* Progress Steps */}
            <div className="space-y-4 mb-8">
              {loadingSteps.map((step) => {
                const isComplete = completedSteps.includes(step.id);
                const isCurrent = currentStep === step.id;
                
                return (
                  <div key={step.id} className="flex items-center gap-3">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-[var(--semantic-positive)] flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-[var(--accent-primary)] animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-[var(--border-medium)] flex-shrink-0" />
                    )}
                    <span className={`text-sm font-medium ${
                      isComplete 
                        ? 'text-[var(--text-secondary)]' 
                        : isCurrent 
                          ? 'text-[var(--text-primary)]' 
                          : 'text-[var(--text-tertiary)]'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Reassurance Message */}
            <div className="pt-6 border-t border-[var(--border-subtle)]">
              {!showTimeout ? (
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  First-time setup usually takes less than a minute. This runs once to build your initial recommendations.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Still working — this sometimes takes longer depending on your race history.
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Your recommendations will appear automatically when ready.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Skeleton Preview - Shows structure of what's coming */}
        <section>
          <div className="space-y-2 mb-4">
            <div className="h-6 w-48 bg-[var(--bg-elevated)] rounded animate-pulse" />
          </div>
          <PrimaryRecommendationSkeleton />
        </section>

        <section>
          <div className="h-6 w-40 bg-[var(--bg-elevated)] rounded mb-4 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SecondaryRecommendationSkeleton />
            <SecondaryRecommendationSkeleton />
          </div>
        </section>

        <section>
          <div className="h-6 w-32 bg-[var(--bg-elevated)] rounded mb-4 animate-pulse" />
          <div className="space-y-2">
            <OtherOptionSkeleton />
            <OtherOptionSkeleton />
            <OtherOptionSkeleton />
          </div>
        </section>

      </main>

      <div className="h-16" />
    </div>
  );
}