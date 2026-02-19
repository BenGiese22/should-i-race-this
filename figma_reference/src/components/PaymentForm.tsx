import React, { useState } from 'react';
import { CreditCard, Lock, ArrowLeft, Check } from 'lucide-react';

interface PaymentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ onSuccess, onCancel }: PaymentFormProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [email, setEmail] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      onSuccess();
    }, 2000);
  };

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
        <div className="max-w-2xl mx-auto px-6 w-full">
          <div className="space-y-8">
            
            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">
                Upgrade to Pro
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Unlock full algorithm transparency and advanced controls
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Plan Selection */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-6">
                <div className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                  Select Plan
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('monthly')}
                    className={`
                      relative p-5 rounded-lg border-2 transition-all text-left
                      ${selectedPlan === 'monthly'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-glow)]'
                        : 'border-[var(--border-medium)] bg-[var(--bg-elevated)] hover:border-[var(--border-emphasis)]'
                      }
                    `}
                  >
                    {selectedPlan === 'monthly' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#1A1D23]" />
                        </div>
                      </div>
                    )}
                    <div className="text-sm text-[var(--text-tertiary)] mb-1">Monthly</div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[var(--text-primary)]">$9</span>
                      <span className="text-sm text-[var(--text-secondary)]">/month</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setSelectedPlan('yearly')}
                    className={`
                      relative p-5 rounded-lg border-2 transition-all text-left
                      ${selectedPlan === 'yearly'
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary-glow)]'
                        : 'border-[var(--border-medium)] bg-[var(--bg-elevated)] hover:border-[var(--border-emphasis)]'
                      }
                    `}
                  >
                    {selectedPlan === 'yearly' && (
                      <div className="absolute top-3 right-3">
                        <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#1A1D23]" />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-[var(--text-tertiary)]">Yearly</span>
                      <span className="px-2 py-0.5 bg-[var(--semantic-positive)] bg-opacity-20 border border-[var(--semantic-positive)] border-opacity-30 rounded text-xs font-medium text-[var(--semantic-positive)]">
                        Save 17%
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[var(--text-primary)]">$90</span>
                      <span className="text-sm text-[var(--text-secondary)]">/year</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Billing Email */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-6">
                <label className="block">
                  <span className="text-sm font-semibold text-[var(--text-primary)] mb-3 block">
                    Billing Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 focus:border-[var(--accent-primary)] transition-all"
                  />
                </label>
              </div>

              {/* Card Details */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-[var(--text-secondary)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    Payment Details
                  </span>
                </div>

                <div>
                  <label className="block">
                    <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">
                      Card Number
                    </span>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      required
                      className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 focus:border-[var(--accent-primary)] transition-all"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block">
                      <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">
                        Expiration
                      </span>
                      <input
                        type="text"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="MM / YY"
                        required
                        className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 focus:border-[var(--accent-primary)] transition-all"
                      />
                    </label>
                  </div>
                  <div>
                    <label className="block">
                      <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide mb-2 block">
                        CVC
                      </span>
                      <input
                        type="text"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value)}
                        placeholder="123"
                        required
                        className="w-full px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 focus:border-[var(--accent-primary)] transition-all"
                      />
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Lock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <span className="text-xs text-[var(--text-tertiary)]">
                    Secure payment processing by Stripe
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[var(--text-secondary)]">
                    {selectedPlan === 'monthly' ? 'Monthly subscription' : 'Annual subscription'}
                  </span>
                  <span className="text-lg font-semibold text-[var(--text-primary)]">
                    {selectedPlan === 'monthly' ? '$9.00' : '$90.00'}
                  </span>
                </div>
                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
                  <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5" />
                    <span>Full algorithm transparency unlocks immediately</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] mt-1.5" />
                    <span>Cancel anytime from account settings</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full px-8 py-4 bg-[var(--accent-primary)] text-[#1A1D23] font-semibold rounded-lg hover:bg-[var(--accent-primary-bright)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : `Start Pro — ${selectedPlan === 'monthly' ? '$9/month' : '$90/year'}`}
              </button>

              <p className="text-xs text-center text-[var(--text-tertiary)] leading-relaxed">
                By continuing, you agree to the Terms of Service and Privacy Policy.
              </p>

            </form>

          </div>
        </div>
      </main>
    </div>
  );
}
