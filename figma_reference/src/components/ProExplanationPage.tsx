import React from 'react';
import { Eye, Sliders, LayoutGrid, ArrowLeft } from 'lucide-react';

interface ProExplanationPageProps {
  onProceedToPayment: () => void;
  onCancel: () => void;
}

export function ProExplanationPage({ onProceedToPayment, onCancel }: ProExplanationPageProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col">
      {/* Header */}
      <header className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onCancel}
              className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
            <h1 className="text-xl">Should I Race This?</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center py-16">
        <div className="max-w-3xl mx-auto px-6 w-full">
          <div className="space-y-12">
            
            {/* Title & Description */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)] border-opacity-30 rounded-lg mb-2">
                <span className="text-sm font-semibold text-[var(--accent-primary-bright)]">
                  Pro
                </span>
              </div>
              <h2 className="text-3xl font-bold text-[var(--text-primary)]">
                Unlock Deeper Control and Clarity
              </h2>
              <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
                Pro unlocks full algorithm transparency, goal mode switching, and advanced filtering — giving you complete control over how recommendations are made.
              </p>
            </div>

            {/* What Unlocks */}
            <div className="space-y-6">
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-8 space-y-6">
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg">
                    <Eye className="w-6 h-6 text-[var(--accent-info)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Full Algorithm Transparency
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      See complete scoring breakdowns, factor weights, and historical performance data. Understand exactly why each race is recommended for you.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg">
                    <Sliders className="w-6 h-6 text-[var(--accent-info)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Goal Mode Control
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Switch between Balanced, iRating Push, and Safety Recovery modes. Compare how recommendations change based on your current racing goals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg">
                    <LayoutGrid className="w-6 h-6 text-[var(--accent-info)]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                      Advanced Sorting & Filtering
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Sort and filter all available races by license class, track type, or session length. Explore options beyond the top recommendations.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Pricing Preview */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-[var(--text-tertiary)] mb-1">Starting at</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">$9</span>
                    <span className="text-lg text-[var(--text-secondary)]">/month</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[var(--text-tertiary)] mb-1">Or save with annual</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">$90</span>
                    <span className="text-lg text-[var(--text-secondary)]">/year</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pt-6 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--semantic-positive)]" />
                  <span>Cancel anytime, no long-term commitment</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--semantic-positive)]" />
                  <span>All features unlock immediately</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--semantic-positive)]" />
                  <span>Secure payment processed by Stripe</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={onCancel}
                className="px-6 py-3 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Not now
              </button>
              <button
                onClick={onProceedToPayment}
                className="px-8 py-3 bg-[var(--accent-primary)] text-[#1A1D23] font-semibold rounded-lg hover:bg-[var(--accent-primary-bright)] transition-colors"
              >
                Continue to Payment
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
