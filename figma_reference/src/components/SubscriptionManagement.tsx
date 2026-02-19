import React, { useState } from 'react';
import { CreditCard, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';

interface SubscriptionManagementProps {
  isProUser: boolean;
  subscriptionPlan: 'monthly' | 'yearly' | null;
  renewalDate: string;
  onCancel: () => void;
  onBack: () => void;
}

export function SubscriptionManagement({ 
  isProUser, 
  subscriptionPlan, 
  renewalDate,
  onCancel,
  onBack 
}: SubscriptionManagementProps) {
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelConfirm = () => {
    setIsCancelling(true);
    setTimeout(() => {
      setIsCancelling(false);
      setShowCancelConfirmation(false);
      onCancel();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <h1 className="text-xl">Account & Billing</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="space-y-6">

            {/* Current Plan Status */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                      {isProUser ? 'Pro Subscription' : 'Explorer (Free)'}
                    </h2>
                    {isProUser && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)] border-opacity-30 rounded-lg">
                        <span className="text-xs font-semibold text-[var(--accent-primary-bright)]">
                          Active
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {isProUser 
                      ? `${subscriptionPlan === 'monthly' ? 'Monthly' : 'Annual'} billing — Full access to all Pro features`
                      : 'Free tier with basic recommendations'
                    }
                  </p>
                </div>
                {isProUser && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">
                      {subscriptionPlan === 'monthly' ? '$9' : '$90'}
                    </div>
                    <div className="text-sm text-[var(--text-tertiary)]">
                      per {subscriptionPlan === 'monthly' ? 'month' : 'year'}
                    </div>
                  </div>
                )}
              </div>

              {isProUser && (
                <div className="flex items-center gap-2 pt-6 border-t border-[var(--border-subtle)]">
                  <Calendar className="w-4 h-4 text-[var(--text-tertiary)]" />
                  <span className="text-sm text-[var(--text-secondary)]">
                    Renews on {renewalDate}
                  </span>
                </div>
              )}
            </div>

            {/* What's Included */}
            {isProUser && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-8">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Pro Features
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2" />
                    <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Full algorithm transparency with scoring breakdowns
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2" />
                    <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Goal mode switching (Balanced, iRating Push, Safety Recovery)
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2" />
                    <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Advanced sorting and filtering of all available races
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-2" />
                    <span className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Deeper historical insights and performance trends
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            {isProUser && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Payment Method
                    </h3>
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-[var(--text-secondary)]" />
                      <span className="text-sm text-[var(--text-secondary)]">
                        •••• •••• •••• 4242
                      </span>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-sm bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)] transition-all text-[var(--text-secondary)]">
                    Update
                  </button>
                </div>
              </div>
            )}

            {/* Cancel Subscription */}
            {isProUser && !showCancelConfirmation && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-8">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  Cancel Subscription
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                  You'll retain Pro access until {renewalDate}, then revert to Explorer features.
                </p>
                <button 
                  onClick={() => setShowCancelConfirmation(true)}
                  className="px-4 py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  Cancel subscription
                </button>
              </div>
            )}

            {/* Cancel Confirmation */}
            {showCancelConfirmation && (
              <div className="bg-[var(--bg-surface)] border border-[var(--accent-caution)] rounded-xl p-8">
                <div className="flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-[var(--accent-caution)] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Confirm Cancellation
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Your Pro subscription will be cancelled. You'll retain access until {renewalDate}, after which you'll return to Explorer features.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCancelConfirm}
                    disabled={isCancelling}
                    className="px-5 py-2.5 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:border-[var(--border-emphasis)] hover:text-[var(--text-primary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCancelling ? 'Cancelling...' : 'Yes, cancel subscription'}
                  </button>
                  <button
                    onClick={() => setShowCancelConfirmation(false)}
                    disabled={isCancelling}
                    className="px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Keep Pro
                  </button>
                </div>
              </div>
            )}

            {/* Upgrade to Pro (for Explorer users) */}
            {!isProUser && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-8">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  Upgrade to Pro
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                  Unlock full algorithm transparency, goal mode control, and advanced filtering for deeper insight into your race decisions.
                </p>
                <button className="px-6 py-3 bg-[var(--accent-primary)] text-[#1A1D23] font-semibold rounded-lg hover:bg-[var(--accent-primary-bright)] transition-colors">
                  View Pro Features
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
