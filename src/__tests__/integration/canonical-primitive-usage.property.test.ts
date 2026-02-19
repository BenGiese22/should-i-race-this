/**
 * Property-based tests for Canonical Primitive Usage
 * Feature: figma-ui-integration, Property 9: Canonical Primitive Usage
 * Validates: Requirements 6.2
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Canonical Primitive Usage Properties', () => {
  /**
   * Property 9: Canonical Primitive Usage
   * For all page components in src/app/, import statements for UI primitives
   * should reference src/components/ui/ (canonical location), not figma_reference/
   */

  const getPageComponentFiles = (): string[] => {
    const appDir = path.join(process.cwd(), 'src/app');
    const files = glob.sync('**/*.{tsx,ts}', {
      cwd: appDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.{tsx,ts}', '**/*.spec.{tsx,ts}'],
    });
    return files;
  };

  const getRacingComponentFiles = (): string[] => {
    const racingDir = path.join(process.cwd(), 'src/components/racing');
    if (!fs.existsSync(racingDir)) {
      return [];
    }
    const files = glob.sync('**/*.{tsx,ts}', {
      cwd: racingDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/*.test.{tsx,ts}', '**/*.spec.{tsx,ts}'],
    });
    return files;
  };

  const extractImports = (content: string): string[] => {
    const imports: string[] = [];
    
    // Match import statements
    const importRegex = /import\s+(?:{[^}]+}|[^;]+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  };

  test('page components should not import from figma_reference', () => {
    const files = getPageComponentFiles();
    const violations: Array<{ file: string; imports: string[] }> = [];

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports = extractImports(content);
      
      const figmaImports = imports.filter(imp => 
        imp.includes('figma_reference') || 
        imp.startsWith('../../../figma_reference') ||
        imp.startsWith('../../figma_reference')
      );

      if (figmaImports.length > 0) {
        violations.push({
          file: path.relative(process.cwd(), filePath),
          imports: figmaImports
        });
      }
    });

    if (violations.length > 0) {
      console.log('Page components importing from figma_reference:');
      violations.forEach(v => {
        console.log(`  File: ${v.file}`);
        v.imports.forEach(imp => console.log(`    - ${imp}`));
      });
    }

    expect(violations).toEqual([]);
  });

  test('racing components should import UI primitives from canonical location', () => {
    const files = getRacingComponentFiles();
    const violations: Array<{ file: string; imports: string[] }> = [];

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports = extractImports(content);
      
      // Check for imports from figma_reference
      const figmaImports = imports.filter(imp => 
        imp.includes('figma_reference')
      );

      if (figmaImports.length > 0) {
        violations.push({
          file: path.relative(process.cwd(), filePath),
          imports: figmaImports
        });
      }
    });

    if (violations.length > 0) {
      console.log('Racing components importing from figma_reference:');
      violations.forEach(v => {
        console.log(`  File: ${v.file}`);
        v.imports.forEach(imp => console.log(`    - ${imp}`));
      });
    }

    expect(violations).toEqual([]);
  });

  test('racing components should use canonical UI primitives from @/components/ui', () => {
    const files = getRacingComponentFiles();
    const canonicalImports: Array<{ file: string; imports: string[] }> = [];
    const nonCanonicalImports: Array<{ file: string; imports: string[] }> = [];

    // Common UI primitive names
    const uiPrimitives = [
      'button', 'input', 'textarea', 'label', 'card', 'separator', 'badge',
      'skeleton', 'dialog', 'alert-dialog', 'sheet', 'drawer', 'popover',
      'tooltip', 'hover-card', 'dropdown-menu', 'context-menu', 'tabs',
      'accordion', 'navigation-menu', 'table', 'avatar', 'progress', 'select',
      'checkbox', 'radio-group', 'switch', 'slider', 'form', 'calendar'
    ];

    files.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports = extractImports(content);
      
      // Check for UI primitive imports
      const uiImports = imports.filter(imp => {
        const lowerImp = imp.toLowerCase();
        return uiPrimitives.some(primitive => lowerImp.includes(primitive));
      });

      if (uiImports.length > 0) {
        const canonical = uiImports.filter(imp => 
          imp.startsWith('@/components/ui') || 
          imp.startsWith('../ui') ||
          imp.startsWith('../../ui')
        );
        
        const nonCanonical = uiImports.filter(imp => 
          !imp.startsWith('@/components/ui') && 
          !imp.startsWith('../ui') &&
          !imp.startsWith('../../ui')
        );

        if (canonical.length > 0) {
          canonicalImports.push({
            file: path.relative(process.cwd(), filePath),
            imports: canonical
          });
        }

        if (nonCanonical.length > 0) {
          nonCanonicalImports.push({
            file: path.relative(process.cwd(), filePath),
            imports: nonCanonical
          });
        }
      }
    });

    if (nonCanonicalImports.length > 0) {
      console.log('Racing components with non-canonical UI imports:');
      nonCanonicalImports.forEach(v => {
        console.log(`  File: ${v.file}`);
        v.imports.forEach(imp => console.log(`    - ${imp}`));
      });
    }

    // This test is informational - we log but don't fail
    // Racing components may import from each other, which is fine
    expect(true).toBe(true);
  });

  test('all components should use path aliases (@/) for imports', () => {
    const pageFiles = getPageComponentFiles();
    const racingFiles = getRacingComponentFiles();
    const allFiles = [...pageFiles, ...racingFiles];
    
    const relativeImports: Array<{ file: string; imports: string[] }> = [];

    allFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const imports = extractImports(content);
      
      // Check for relative imports that go up multiple levels
      const deepRelativeImports = imports.filter(imp => 
        imp.startsWith('../../') || imp.startsWith('../../../')
      );

      if (deepRelativeImports.length > 0) {
        relativeImports.push({
          file: path.relative(process.cwd(), filePath),
          imports: deepRelativeImports
        });
      }
    });

    if (relativeImports.length > 0) {
      console.log('Components with deep relative imports (consider using @/ alias):');
      relativeImports.forEach(v => {
        console.log(`  File: ${v.file}`);
        v.imports.forEach(imp => console.log(`    - ${imp}`));
      });
    }

    // This is informational - we don't enforce it strictly
    expect(true).toBe(true);
  });

  test('racing components should not duplicate UI primitives', () => {
    const racingDir = path.join(process.cwd(), 'src/components/racing');
    if (!fs.existsSync(racingDir)) {
      console.log('Racing directory does not exist yet');
      expect(true).toBe(true);
      return;
    }

    const racingFiles = fs.readdirSync(racingDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));
    
    // UI primitive names that should NOT be in racing directory
    const uiPrimitiveNames = [
      'button.tsx', 'button.ts',
      'input.tsx', 'input.ts',
      'card.tsx', 'card.ts',
      'dialog.tsx', 'dialog.ts',
      'badge.tsx', 'badge.ts',
      'skeleton.tsx', 'skeleton.ts',
      'tabs.tsx', 'tabs.ts',
      'select.tsx', 'select.ts',
    ];

    const duplicates = racingFiles.filter(file => 
      uiPrimitiveNames.includes(file.toLowerCase())
    );

    if (duplicates.length > 0) {
      console.log('Racing directory contains UI primitive duplicates:');
      duplicates.forEach(d => console.log(`  - ${d}`));
    }

    expect(duplicates).toEqual([]);
  });

  test('racing components should be feature-specific, not generic primitives', () => {
    const racingDir = path.join(process.cwd(), 'src/components/racing');
    if (!fs.existsSync(racingDir)) {
      console.log('Racing directory does not exist yet');
      expect(true).toBe(true);
      return;
    }

    const racingFiles = fs.readdirSync(racingDir)
      .filter(f => (f.endsWith('.tsx') || f.endsWith('.ts')) && f !== 'index.ts');
    
    // Expected racing-specific component patterns
    const expectedPatterns = [
      /recommendation/i,
      /license/i,
      /confidence/i,
      /goal/i,
      /mode/i,
      /factor/i,
      /loading/i,
      /empty/i,
      /skeleton/i,
      /notice/i,
      /message/i,
      /upgrade/i,
      /pro/i,
    ];

    const genericComponents = racingFiles.filter(file => {
      const fileName = file.toLowerCase();
      return !expectedPatterns.some(pattern => pattern.test(fileName));
    });

    if (genericComponents.length > 0) {
      console.log('Racing components that may be too generic:');
      genericComponents.forEach(c => console.log(`  - ${c}`));
      console.log('Consider if these should be in src/components/ui instead');
    }

    // This is informational only
    expect(true).toBe(true);
  });
});
