/**
 * Property-based tests for Design Token Preservation
 * Feature: figma-ui-integration, Property 7: Design Token Preservation
 * Validates: Requirements 4.1, 4.2, 4.4
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Design Token Preservation Properties', () => {
  /**
   * Property 7: Design Token Preservation
   * For all existing Tailwind theme values (racing.* colors, safelist entries),
   * these values should still exist in tailwind.config.js after token reconciliation
   */
  
  test('racing.* color palette should be preserved in Tailwind config', () => {
    const configPath = path.join(process.cwd(), 'tailwind.config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Expected racing colors that must be preserved
    const expectedRacingColors = [
      'red', 'blue', 'green', 'yellow', 'black', 'white',
      'rookie', 'd', 'c', 'b', 'a', 'pro',
      'improvement', 'decline', 'neutral'
    ];
    
    // Check that racing color palette exists
    expect(configContent).toContain('racing: {');
    
    // Check each expected color is present
    expectedRacingColors.forEach(color => {
      const colorPattern = new RegExp(`${color}:\\s*['"]#[0-9A-Fa-f]{6}['"]`);
      expect(configContent).toMatch(colorPattern);
    });
    
    // Check racing gray scale is preserved
    const grayLevels = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];
    grayLevels.forEach(level => {
      expect(configContent).toContain(`${level}:`);
    });
  });
  
  test('safelist configuration should be preserved', () => {
    const configPath = path.join(process.cwd(), 'tailwind.config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Expected safelist entries for license badges
    const expectedSafelistClasses = [
      'bg-red-600',
      'text-white',
      'border-red-700',
      'bg-orange-600',
      'border-orange-700',
      'bg-yellow-500',
      'text-gray-800',
      'border-yellow-600',
      'bg-green-600',
      'border-green-700',
      'bg-blue-600',
      'border-blue-700',
      'bg-gray-800',
      'border-gray-900'
    ];
    
    // Check that safelist exists
    expect(configContent).toContain('safelist:');
    
    // Check each expected class is in the safelist
    expectedSafelistClasses.forEach(className => {
      expect(configContent).toContain(`'${className}'`);
    });
  });
  
  test('new semantic tokens should be added without removing existing tokens', () => {
    const configPath = path.join(process.cwd(), 'tailwind.config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // New tokens that should be added
    const newTokens = [
      'background:',
      'surface:',
      'elevated:',
      'hover:',
      'border:',
      'text:',
      'license:',
      'semantic:',
      'accent:'
    ];
    
    // Check that new tokens are present
    newTokens.forEach(token => {
      expect(configContent).toContain(token);
    });
    
    // Verify racing colors still exist alongside new tokens
    expect(configContent).toContain('racing: {');
  });
  
  test('CSS variables should be defined in globals.css', () => {
    const globalsPath = path.join(process.cwd(), 'src/app/globals.css');
    const globalsContent = fs.readFileSync(globalsPath, 'utf-8');
    
    // Expected CSS variables from Figma
    const expectedVariables = [
      '--bg-app',
      '--bg-surface',
      '--bg-elevated',
      '--bg-hover',
      '--border-subtle',
      '--border-medium',
      '--border-emphasis',
      '--text-primary',
      '--text-secondary',
      '--text-tertiary',
      '--text-disabled',
      '--license-rookie',
      '--license-d',
      '--license-c',
      '--license-b',
      '--license-a',
      '--license-pro',
      '--semantic-positive',
      '--semantic-caution',
      '--semantic-danger',
      '--accent-primary',
      '--accent-info'
    ];
    
    // Check that all expected variables are defined
    expectedVariables.forEach(variable => {
      expect(globalsContent).toContain(variable);
    });
  });
  
  test('Tailwind config should map CSS variables to utilities', () => {
    const configPath = path.join(process.cwd(), 'tailwind.config.js');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    
    // Expected mappings from CSS variables to Tailwind utilities
    const expectedMappings = [
      "background: 'var(--bg-app)'",
      "surface: 'var(--bg-surface)'",
      "elevated: 'var(--bg-elevated)'",
      "hover: 'var(--bg-hover)'",
      "subtle: 'var(--border-subtle)'",
      "medium: 'var(--border-medium)'",
      "emphasis: 'var(--border-emphasis)'",
      "primary: 'var(--text-primary)'",
      "secondary: 'var(--text-secondary)'",
      "tertiary: 'var(--text-tertiary)'",
      "disabled: 'var(--text-disabled)'"
    ];
    
    // Check that mappings exist
    expectedMappings.forEach(mapping => {
      expect(configContent).toContain(mapping);
    });
  });
});
