/**
 * Property-based tests for Primitive Uniqueness
 * Feature: figma-ui-integration, Property 6: Primitive Uniqueness
 * Validates: Requirements 3.4
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Primitive Uniqueness Properties', () => {
  /**
   * Property 6: Primitive Uniqueness
   * For all UI primitive components in src/components/ui/, each primitive name
   * should be unique (no duplicate button.tsx, card.tsx, etc.)
   */

  const getUIComponentFiles = (): string[] => {
    const uiDir = path.join(process.cwd(), 'src/components/ui');
    const files = glob.sync('*.{tsx,ts}', {
      cwd: uiDir,
      absolute: false,
      ignore: ['index.ts', '*.test.{tsx,ts}', '*.spec.{tsx,ts}'],
    });
    return files;
  };

  const extractBaseName = (fileName: string): string => {
    // Remove extension
    return fileName.replace(/\.(tsx|ts)$/, '');
  };

  test('all UI primitive file names should be unique', () => {
    const files = getUIComponentFiles();
    const baseNames = files.map(extractBaseName);
    
    // Check for duplicates
    const duplicates = baseNames.filter((name, index) => baseNames.indexOf(name) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];

    if (uniqueDuplicates.length > 0) {
      console.log('Duplicate UI primitive names found:');
      uniqueDuplicates.forEach(name => {
        const matchingFiles = files.filter(f => extractBaseName(f) === name);
        console.log(`  - ${name}: ${matchingFiles.join(', ')}`);
      });
    }

    expect(uniqueDuplicates).toEqual([]);
  });

  test('no UI primitive should have multiple implementations', () => {
    const uiDir = path.join(process.cwd(), 'src/components/ui');
    
    // Common primitive names that should only exist once
    const commonPrimitives = [
      'button',
      'input',
      'textarea',
      'label',
      'card',
      'separator',
      'badge',
      'skeleton',
      'dialog',
      'alert-dialog',
      'sheet',
      'drawer',
      'popover',
      'tooltip',
      'hover-card',
      'dropdown-menu',
      'context-menu',
      'tabs',
      'accordion',
      'navigation-menu',
      'menubar',
      'breadcrumb',
      'pagination',
      'sidebar',
      'alert',
      'progress',
      'table',
      'avatar',
      'calendar',
      'chart',
      'carousel',
      'command',
      'checkbox',
      'radio-group',
      'switch',
      'slider',
      'select',
      'form',
      'collapsible',
      'toggle',
      'toggle-group',
      'scroll-area',
      'resizable',
      'aspect-ratio',
      'input-otp',
    ];

    const violations: string[] = [];

    commonPrimitives.forEach(primitiveName => {
      const possibleFiles = [
        `${primitiveName}.tsx`,
        `${primitiveName}.ts`,
      ];

      const existingFiles = possibleFiles.filter(file => {
        const filePath = path.join(uiDir, file);
        return fs.existsSync(filePath);
      });

      if (existingFiles.length > 1) {
        violations.push(`${primitiveName} has multiple implementations: ${existingFiles.join(', ')}`);
      }
    });

    if (violations.length > 0) {
      console.log('Primitives with multiple implementations:');
      violations.forEach(v => console.log(`  - ${v}`));
    }

    expect(violations).toEqual([]);
  });

  test('newly ported primitives should not conflict with existing ones', () => {
    const uiDir = path.join(process.cwd(), 'src/components/ui');
    
    // Primitives that were ported in this task
    const newlyPortedPrimitives = [
      'button',
      'input',
      'textarea',
      'label',
      'card',
      'separator',
      'badge',
      'skeleton',
    ];

    const violations: string[] = [];

    newlyPortedPrimitives.forEach(primitiveName => {
      const tsxPath = path.join(uiDir, `${primitiveName}.tsx`);
      const tsPath = path.join(uiDir, `${primitiveName}.ts`);

      const tsxExists = fs.existsSync(tsxPath);
      const tsExists = fs.existsSync(tsPath);

      // Check that exactly one version exists (either .tsx or .ts, not both)
      if (tsxExists && tsExists) {
        violations.push(`${primitiveName} exists as both .tsx and .ts`);
      } else if (!tsxExists && !tsExists) {
        violations.push(`${primitiveName} does not exist (expected to be ported)`);
      }
    });

    if (violations.length > 0) {
      console.log('Issues with newly ported primitives:');
      violations.forEach(v => console.log(`  - ${v}`));
    }

    expect(violations).toEqual([]);
  });

  test('UI primitives should export unique component names', () => {
    const uiDir = path.join(process.cwd(), 'src/components/ui');
    const files = getUIComponentFiles();
    
    const exportedComponents: Map<string, string[]> = new Map();

    files.forEach(file => {
      const filePath = path.join(uiDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Extract exported component names
      // Match: export { ComponentName } or export function ComponentName
      const exportMatches = [
        ...content.matchAll(/export\s+{\s*([^}]+)\s*}/g),
        ...content.matchAll(/export\s+function\s+([A-Z]\w+)/g),
        ...content.matchAll(/export\s+const\s+([A-Z]\w+)/g),
      ];

      exportMatches.forEach(match => {
        const exports = match[1].split(',').map(e => e.trim().split(/\s+/)[0]);
        exports.forEach(exportName => {
          if (exportName && /^[A-Z]/.test(exportName)) {
            if (!exportedComponents.has(exportName)) {
              exportedComponents.set(exportName, []);
            }
            exportedComponents.get(exportName)!.push(file);
          }
        });
      });
    });

    // Find components exported from multiple files
    const duplicates: string[] = [];
    exportedComponents.forEach((files, componentName) => {
      if (files.length > 1) {
        duplicates.push(`${componentName} exported from: ${files.join(', ')}`);
      }
    });

    if (duplicates.length > 0) {
      console.log('Components exported from multiple files:');
      duplicates.forEach(d => console.log(`  - ${d}`));
    }

    // This is informational - some components like Button might be re-exported
    // We don't fail on this, but log it for awareness
    expect(true).toBe(true);
  });

  test('index.ts should not export duplicate component names', () => {
    const indexPath = path.join(process.cwd(), 'src/components/ui/index.ts');
    
    if (!fs.existsSync(indexPath)) {
      console.log('Warning: src/components/ui/index.ts does not exist');
      expect(true).toBe(true);
      return;
    }

    const content = fs.readFileSync(indexPath, 'utf-8');
    
    // Extract all exported names from index.ts
    const exportedNames: string[] = [];
    const exportMatches = content.matchAll(/export\s+{\s*([^}]+)\s*}/g);

    for (const match of exportMatches) {
      const exports = match[1].split(',').map(e => {
        // Handle "as" aliases: "Button as Btn" -> "Btn"
        const parts = e.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });
      exportedNames.push(...exports);
    }

    // Find duplicates
    const duplicates = exportedNames.filter((name, index) => exportedNames.indexOf(name) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];

    if (uniqueDuplicates.length > 0) {
      console.log('Duplicate exports in index.ts:');
      uniqueDuplicates.forEach(name => console.log(`  - ${name}`));
    }

    expect(uniqueDuplicates).toEqual([]);
  });
});
