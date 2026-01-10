import {
  VisualScoring,
  ProgressBar,
  GradientColor,
  RacingBadge,
  RacingBadgeTheme,
  ConfidenceBadge,
  ConfidenceLevel,
  ScoringFactor,
  Score
} from './types';

/**
 * Visual Scoring Renderer for racing-themed recommendation displays
 * Converts numeric scores to intuitive visual indicators with motorsport aesthetics
 */
export class VisualScoringRenderer {
  
  /**
   * Render a complete visual scoring object from a score
   */
  renderVisualScoring(score: Score): VisualScoring {
    // Provide default confidence level if dataConfidence is missing
    const defaultConfidence: ConfidenceLevel = 'no_data';
    const confidence = score.dataConfidence?.performance || defaultConfidence;
    
    return {
      performance: this.renderProgressBar(score.factors.performance, 'performance'),
      safety: this.renderProgressBar(score.factors.safety, 'safety'),
      consistency: this.renderProgressBar(score.factors.consistency, 'consistency'),
      predictability: this.renderProgressBar(score.factors.predictability, 'predictability'),
      familiarity: this.renderProgressBar(score.factors.familiarity, 'familiarity'),
      fatigueRisk: this.renderProgressBar(score.factors.fatigueRisk, 'fatigueRisk'),
      attritionRisk: this.renderProgressBar(score.factors.attritionRisk, 'attritionRisk'),
      timeVolatility: this.renderProgressBar(score.factors.timeVolatility, 'timeVolatility'),
      overall: this.renderOverallBadge(score.overall, confidence)
    };
  }

  /**
   * Render a progress bar for a specific scoring factor
   */
  renderProgressBar(score: number, factor: ScoringFactor): ProgressBar {
    const gradient = this.calculateGradientColor(score);
    const icon = this.getFactorIcon(factor);
    const tooltip = this.getFactorTooltip(factor, score);

    return {
      value: Math.round(score),
      gradient,
      icon,
      tooltip
    };
  }

  /**
   * Calculate gradient color based on score (0-100)
   * Red (0-33) -> Yellow/Orange (34-66) -> Green (67-100)
   */
  calculateGradientColor(score: number): GradientColor {
    const clampedScore = Math.max(0, Math.min(100, score));
    
    const startColor = '#ff4444'; // Red
    const midColor = '#ffaa44';   // Orange
    const endColor = '#44ff44';   // Green
    
    let currentColor: string;
    
    if (clampedScore <= 33) {
      // Red zone (0-33)
      const ratio = clampedScore / 33;
      currentColor = this.interpolateColor(startColor, '#ff6644', ratio);
    } else if (clampedScore <= 66) {
      // Orange zone (34-66)
      const ratio = (clampedScore - 33) / 33;
      currentColor = this.interpolateColor('#ff6644', midColor, ratio);
    } else {
      // Green zone (67-100)
      const ratio = (clampedScore - 66) / 34;
      currentColor = this.interpolateColor(midColor, endColor, ratio);
    }

    const cssGradient = `linear-gradient(90deg, ${startColor} 0%, ${midColor} 50%, ${endColor} 100%)`;

    return {
      startColor,
      midColor,
      endColor,
      currentColor,
      cssGradient
    };
  }

  /**
   * Render overall racing badge based on score and confidence
   */
  renderOverallBadge(score: number, _confidence: ConfidenceLevel): RacingBadge {
    const clampedScore = Math.max(0, Math.min(100, score));
    
    let level: RacingBadge['level'];
    let racingTheme: RacingBadgeTheme;
    let colors: RacingBadge['colors'];
    let description: string;

    // Determine racing flag theme based on score
    if (clampedScore >= 90) {
      level = 'legend';
      racingTheme = { checkeredFlag: true };
      colors = { primary: '#000000', accent: '#ffffff', text: '#ffffff' };
      description = 'Excellent recommendation - checkered flag!';
    } else if (clampedScore >= 75) {
      level = 'champion';
      racingTheme = { greenFlag: true };
      colors = { primary: '#22c55e', accent: '#16a34a', text: '#ffffff' };
      description = 'Good to go - green flag!';
    } else if (clampedScore >= 50) {
      level = 'contender';
      racingTheme = { yellowFlag: true };
      colors = { primary: '#eab308', accent: '#ca8a04', text: '#000000' };
      description = 'Proceed with caution - yellow flag';
    } else {
      level = 'rookie';
      racingTheme = { blackFlag: true };
      colors = { primary: '#dc2626', accent: '#991b1b', text: '#ffffff' };
      description = 'High risk - black flag warning';
    }

    return {
      level,
      style: 'flag',
      colors,
      icon: this.getFlagIcon(racingTheme),
      description,
      racingTheme
    };
  }

  /**
   * Render confidence badge for data quality indicators
   */
  renderConfidenceBadge(level: ConfidenceLevel): ConfidenceBadge {
    switch (level) {
      case 'high':
        return {
          text: 'High Confidence',
          color: '#22c55e',
          icon: '🏁',
          description: 'Based on your actual race data (3+ races)'
        };
      case 'estimated':
        return {
          text: 'Estimated',
          color: '#eab308',
          icon: '📊',
          description: 'Estimated from similar series performance'
        };
      case 'no_data':
        return {
          text: 'No Personal Data',
          color: '#6b7280',
          icon: '❓',
          description: 'Based on general statistics only'
        };
    }
  }

  /**
   * Get racing-themed icon for scoring factors
   */
  private getFactorIcon(factor: ScoringFactor): string {
    const icons: Record<ScoringFactor, string> = {
      performance: '🏎️',
      safety: '🛡️',
      consistency: '📈',
      predictability: '🎯',
      familiarity: '🏁',
      fatigueRisk: '⚡',
      attritionRisk: '⚠️',
      timeVolatility: '⏱️'
    };
    return icons[factor];
  }

  /**
   * Get tooltip text for scoring factors
   */
  private getFactorTooltip(factor: ScoringFactor, score: number): string {
    const roundedScore = Math.round(score);
    
    const tooltips: Record<ScoringFactor, string> = {
      performance: `Performance Score: ${roundedScore}/100 - Based on your position gains/losses`,
      safety: `Safety Score: ${roundedScore}/100 - Based on incident rates`,
      consistency: `Consistency Score: ${roundedScore}/100 - Based on finish position variance`,
      predictability: `Predictability Score: ${roundedScore}/100 - Based on field strength variance`,
      familiarity: `Familiarity Score: ${roundedScore}/100 - Based on your experience`,
      fatigueRisk: `Fatigue Risk: ${roundedScore}/100 - Lower is higher risk`,
      attritionRisk: `Attrition Risk: ${roundedScore}/100 - Lower is higher DNF rate`,
      timeVolatility: `Time Volatility: ${roundedScore}/100 - Lower is more unpredictable`
    };
    
    return tooltips[factor];
  }

  /**
   * Get flag icon based on racing theme
   */
  private getFlagIcon(theme: RacingBadgeTheme): string {
    if (theme.checkeredFlag) return '🏁';
    if (theme.greenFlag) return '🟢';
    if (theme.yellowFlag) return '🟡';
    if (theme.blackFlag) return '⚫';
    return '🏁'; // Default to checkered flag
  }

  /**
   * Interpolate between two hex colors
   */
  private interpolateColor(color1: string, color2: string, ratio: number): string {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}

// Export singleton instance
export const visualScoringRenderer = new VisualScoringRenderer();