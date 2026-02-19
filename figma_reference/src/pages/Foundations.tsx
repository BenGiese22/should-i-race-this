import React from 'react';
import { LicenseBadge, LicenseClass } from '../components/LicenseBadge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

export default function Foundations() {
  const licenses: LicenseClass[] = ['Rookie', 'D', 'C', 'B', 'A', 'Pro'];

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-16">
          <div className="inline-block px-3 py-1 bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)] rounded-md mb-4">
            <span className="text-sm font-semibold text-[var(--accent-primary-bright)]">Design Foundation</span>
          </div>
          <h1 className="mb-3">Should I Race This?</h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-3xl">
            Non-negotiable visual rules for a professional racing analytics product. 
            This page defines the locked design system and must be treated as source of truth.
          </p>
        </div>

        {/* Dark Mode Foundation */}
        <section className="mb-16">
          <h2 className="mb-6">Dark Mode Foundation</h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-8">
            <div className="mb-6">
              <h3 className="mb-3 text-[var(--accent-primary)]">CRITICAL REQUIREMENT</h3>
              <p className="text-[var(--text-secondary)] mb-4">
                Use a near-black neutral base for all backgrounds. Avoid navy or blue-tinted backgrounds.
                The interface should feel like professional telemetry software, not a marketing site.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Background Swatches */}
              <div>
                <div className="label-metadata mb-3">Background Palette</div>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border border-[var(--border-medium)]" 
                         style={{ backgroundColor: 'var(--bg-app)' }}></div>
                    <div>
                      <div className="text-sm font-medium">App Background</div>
                      <code className="text-xs text-[var(--text-tertiary)] stat-number">#0B0D10</code>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">--bg-app</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border border-[var(--border-medium)]" 
                         style={{ backgroundColor: 'var(--bg-surface)' }}></div>
                    <div>
                      <div className="text-sm font-medium">Card Surface</div>
                      <code className="text-xs text-[var(--text-tertiary)] stat-number">#14161B</code>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">--bg-surface</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg border border-[var(--border-medium)]" 
                         style={{ backgroundColor: 'var(--bg-elevated)' }}></div>
                    <div>
                      <div className="text-sm font-medium">Elevated Elements</div>
                      <code className="text-xs text-[var(--text-tertiary)] stat-number">#1A1D23</code>
                      <div className="text-xs text-[var(--text-tertiary)] mt-0.5">--bg-elevated</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Contrast */}
              <div>
                <div className="label-metadata mb-3">Text Hierarchy</div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      Primary Text
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">High contrast • Headings & body</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      Secondary Text
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">Medium contrast • Descriptions</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                      Tertiary Text
                    </div>
                    <div className="text-xs text-[var(--text-tertiary)]">Lower contrast • Metadata</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Semantic Color System */}
        <section className="mb-16">
          <h2 className="mb-6">Semantic Color System</h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-8">
            <p className="text-[var(--text-secondary)] mb-6">
              Colors carry meaning. Each semantic color has a specific purpose and must be used consistently.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="p-6 rounded-lg border-2" 
                   style={{ 
                     backgroundColor: 'var(--semantic-positive-bg)',
                     borderColor: 'var(--semantic-positive-border)'
                   }}>
                <CheckCircle2 className="w-8 h-8 mb-3" style={{ color: 'var(--semantic-positive)' }} />
                <h3 className="mb-2" style={{ color: 'var(--semantic-positive)' }}>Green</h3>
                <p className="text-sm">Low risk, positive outcomes, strong recommendations</p>
              </div>

              <div className="p-6 rounded-lg border-2" 
                   style={{ 
                     backgroundColor: 'var(--semantic-caution-bg)',
                     borderColor: 'var(--semantic-caution-border)'
                   }}>
                <AlertTriangle className="w-8 h-8 mb-3" style={{ color: 'var(--semantic-caution)' }} />
                <h3 className="mb-2" style={{ color: 'var(--semantic-caution)' }}>Amber</h3>
                <p className="text-sm">Moderate risk, caution required, neutral outcomes</p>
              </div>

              <div className="p-6 rounded-lg border-2" 
                   style={{ 
                     backgroundColor: 'var(--semantic-danger-bg)',
                     borderColor: 'var(--semantic-danger-border)'
                   }}>
                <XCircle className="w-8 h-8 mb-3" style={{ color: 'var(--semantic-danger)' }} />
                <h3 className="mb-2" style={{ color: 'var(--semantic-danger)' }}>Red</h3>
                <p className="text-sm">High risk, destructive actions — USE SPARINGLY</p>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border-subtle)]">
              <h3 className="mb-3">Primary Emphasis Color</h3>
              <div className="flex items-center gap-4 p-6 rounded-lg" 
                   style={{ backgroundColor: 'var(--accent-primary-glow)' }}>
                <div className="w-20 h-20 rounded-lg" 
                     style={{ backgroundColor: 'var(--accent-primary)' }}></div>
                <div>
                  <div className="text-lg font-semibold mb-1" 
                       style={{ color: 'var(--accent-primary-bright)' }}>
                    Orange / Amber
                  </div>
                  <p className="text-sm">
                    Used for confidence scores, emphasis elements, and primary CTAs.
                    Conveys warmth and authority without aggression.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Official iRacing License Badges */}
        <section className="mb-16">
          <h2 className="mb-6">Official iRacing License Badges</h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-8">
            <div className="mb-6">
              <h3 className="mb-3 text-[var(--semantic-danger)]">NON-NEGOTIABLE</h3>
              <p className="text-[var(--text-secondary)]">
                License badges must match iRacing's official license system. They are domain-trust elements 
                and identity markers — not decorative tags. Colors and labels must be accurate.
              </p>
            </div>

            <div className="label-metadata mb-4">Required Badge Format</div>
            <div className="flex flex-wrap gap-3 mb-8">
              {licenses.map((license) => (
                <LicenseBadge key={license} license={license} />
              ))}
            </div>

            <div className="bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg p-6">
              <h4 className="mb-4">Requirements:</h4>
              <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--semantic-positive)] mt-0.5">✓</span>
                  <span>Must display <strong>full text</strong> (e.g., "Rookie", "Class D", not single letters)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--semantic-positive)] mt-0.5">✓</span>
                  <span>Colors must clearly match iRacing's license hierarchy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--semantic-positive)] mt-0.5">✓</span>
                  <span>Shape and styling must be consistent across all cards</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--semantic-positive)] mt-0.5">✓</span>
                  <span>Should feel like identity markers, not arbitrary tags</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Typography System */}
        <section className="mb-16">
          <h2 className="mb-6">Typography System</h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-8">
            <p className="text-[var(--text-secondary)] mb-8">
              Clean, modern sans-serif with clear hierarchy. Text should feel calm, authoritative, and scannable.
            </p>

            <div className="space-y-6">
              <div className="pb-6 border-b border-[var(--border-subtle)]">
                <div className="label-metadata mb-2">Page Title</div>
                <h1>Should I Race This?</h1>
                <code className="text-xs text-[var(--text-tertiary)] mt-2 block">
                  2rem • 700 weight • -0.03em tracking
                </code>
              </div>

              <div className="pb-6 border-b border-[var(--border-subtle)]">
                <div className="label-metadata mb-2">Section Title</div>
                <h2>This Week's Recommendations</h2>
                <code className="text-xs text-[var(--text-tertiary)] mt-2 block">
                  1.5rem • 600 weight • -0.02em tracking
                </code>
              </div>

              <div className="pb-6 border-b border-[var(--border-subtle)]">
                <div className="label-metadata mb-2">Card Title (Series Name) — Primary Identity</div>
                <h3>Advanced Mazda MX-5 Cup</h3>
                <code className="text-xs text-[var(--text-tertiary)] mt-2 block">
                  1.125rem • 600 weight • 1.4 line-height
                </code>
              </div>

              <div className="pb-6 border-b border-[var(--border-subtle)]">
                <div className="label-metadata mb-2">Subtitle (Track Name) — Secondary Context</div>
                <h4>Road Atlanta - Full Course</h4>
                <code className="text-xs text-[var(--text-tertiary)] mt-2 block">
                  0.9375rem • 500 weight • text-secondary color
                </code>
              </div>

              <div className="pb-6 border-b border-[var(--border-subtle)]">
                <div className="label-metadata mb-2">Metadata Labels</div>
                <div className="label-metadata">YOUR HISTORY</div>
                <code className="text-xs text-[var(--text-tertiary)] mt-2 block">
                  0.8125rem • 500 weight • uppercase • 0.05em tracking
                </code>
              </div>

              <div>
                <div className="label-metadata mb-2">Tabular Numbers (Statistics)</div>
                <div className="stat-number text-2xl font-semibold">
                  1,847 <span className="text-[var(--text-tertiary)]">iRating</span>
                </div>
                <code className="text-xs text-[var(--text-tertiary)] mt-2 block">
                  font-feature-settings: 'tnum' 1 • Aligned numerals
                </code>
              </div>
            </div>
          </div>
        </section>

        {/* Spacing & Hierarchy Rules */}
        <section className="mb-16">
          <h2 className="mb-6">Spacing & Hierarchy Rules</h2>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-8">
            <div className="mb-6">
              <h3 className="mb-3">IMPORTANT</h3>
              <p className="text-[var(--text-secondary)]">
                Explicitly define spacing to ensure series names have enough space to never feel cramped.
                Long series names must not collide with badges, scores, or actions.
              </p>
            </div>

            {/* Example Card Layout */}
            <div className="bg-[var(--bg-elevated)] border border-[var(--border-medium)] rounded-lg p-6">
              <div className="label-metadata mb-4">Example Race Card Layout</div>
              
              <div className="space-y-6">
                {/* Header with proper spacing */}
                <div>
                  <div className="flex items-start gap-4 mb-3">
                    <LicenseBadge license="C" variant="compact" />
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-2">Porsche Cup Championship Series</h3>
                      <h4>Circuit de Spa-Francorchamps - Grand Prix</h4>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-3 pl-2 border-l-2 border-[var(--border-medium)]">
                    ↑ Series name = Primary identity (h3)<br/>
                    ↑ Track name = Secondary context (h4)<br/>
                    ↑ License badge does not compete for visual attention
                  </div>
                </div>

                {/* Spacing Guidelines */}
                <div className="pt-6 border-t border-[var(--border-subtle)]">
                  <h4 className="mb-4">Spacing Intent:</h4>
                  <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                      <span><strong>Series name:</strong> Minimum 1rem margin-bottom from track name</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                      <span><strong>Track name:</strong> Visually distinct but clearly associated with series</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                      <span><strong>Confidence scores:</strong> Should not visually compete with series name</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                      <span><strong>Truncation:</strong> If needed, must be intentional and graceful (not accidental)</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-[var(--accent-primary-glow)] border border-[var(--accent-primary)] rounded-lg">
              <p className="text-sm font-medium" style={{ color: 'var(--accent-primary-bright)' }}>
                Rule: Avoid layouts where data elements crowd or overpower the race identity
              </p>
            </div>
          </div>
        </section>

        {/* Footer Lock Notice */}
        <div className="text-center pt-8 border-t border-[var(--border-subtle)]">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg">
            <span className="text-sm font-semibold text-[var(--accent-primary)]">🔒 LOCKED FOUNDATION</span>
            <span className="text-sm text-[var(--text-tertiary)]">•</span>
            <span className="text-sm text-[var(--text-secondary)]">
              Source of truth for all screens and components
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
