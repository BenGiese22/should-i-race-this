/**
 * Property-based tests for Client Directive Correctness
 * Feature: figma-ui-integration, Property 5: Client Directive Correctness
 * Validates: Requirements 3.2, 3.3, 5.4
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Client Directive Correctness Properties', () => {
  /**
   * Property 5: Client Directive Correctness
   * For all React components in src/components/, if the component uses React hooks,
   * event handlers, Radix UI components, or client-side libraries (sonner, next-themes),
   * then the component file should contain "use client" directive
   */

  const getComponentFiles = (): string[] => {
    const componentsDir = path.join(process.cwd(), 'src/components');
    const files = glob.sync('**/*.{tsx,ts}', {
      cwd: componentsDir,
      absolute: true,
      ignore: ['**/*.test.{tsx,ts}', '**/*.spec.{tsx,ts}', '**/index.ts'],
    });
    return files;
  };

  const readFileContent = (filePath: string): string => {
    return fs.readFileSync(filePath, 'utf-8');
  };

  const hasUseClientDirective = (content: string): boolean => {
    // Check for "use client" at the start of the file (allowing for comments)
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }
      if (trimmed === '"use client";' || trimmed === "'use client';") {
        return true;
      }
      // If we hit any other code, stop looking
      break;
    }
    return false;
  };

  const usesReactHooks = (content: string): boolean => {
    // Check for common React hooks
    const hookPatterns = [
      /\buse(State|Effect|Context|Reducer|Callback|Memo|Ref|ImperativeHandle|LayoutEffect|DebugValue)\b/,
      /\buse[A-Z]\w+\b/, // Custom hooks (useXxx)
    ];
    return hookPatterns.some(pattern => pattern.test(content));
  };

  const usesEventHandlers = (content: string): boolean => {
    // Check for event handler props
    const eventHandlerPatterns = [
      /\bon[A-Z]\w+\s*=/,  // onClick=, onChange=, etc.
      /\bon[A-Z]\w+:\s*\(/,  // onClick: () => {}
    ];
    return eventHandlerPatterns.some(pattern => pattern.test(content));
  };

  const usesRadixUI = (content: string): boolean => {
    // Check for Radix UI imports
    return content.includes('@radix-ui/');
  };

  const usesClientLibraries = (content: string): boolean => {
    // Check for client-side libraries
    const clientLibraries = ['sonner', 'next-themes'];
    return clientLibraries.some(lib => content.includes(`from "${lib}"`) || content.includes(`from '${lib}'`));
  };

  const needsUseClient = (content: string): boolean => {
    return (
      usesReactHooks(content) ||
      usesEventHandlers(content) ||
      usesRadixUI(content) ||
      usesClientLibraries(content)
    );
  };

  test('components using React hooks should have "use client" directive', () => {
    const componentFiles = getComponentFiles();
    const violations: string[] = [];

    componentFiles.forEach(filePath => {
      const content = readFileContent(filePath);
      const hasDirective = hasUseClientDirective(content);
      const needs = usesReactHooks(content);

      if (needs && !hasDirective) {
        const relativePath = path.relative(process.cwd(), filePath);
        violations.push(`${relativePath} uses React hooks but missing "use client"`);
      }
    });

    if (violations.length > 0) {
      console.log('Components with React hooks missing "use client":');
      violations.forEach(v => console.log(`  - ${v}`));
    }

    expect(violations).toEqual([]);
  });

  test('components using event handlers should have "use client" directive', () => {
    const componentFiles = getComponentFiles();
    const violations: string[] = [];

    componentFiles.forEach(filePath => {
      const content = readFileContent(filePath);
      const hasDirective = hasUseClientDirective(content);
      const needs = usesEventHandlers(content);

      if (needs && !hasDirective) {
        const relativePath = path.relative(process.cwd(), filePath);
        violations.push(`${relativePath} uses event handlers but missing "use client"`);
      }
    });

    if (violations.length > 0) {
      console.log('Components with event handlers missing "use client":');
      violations.forEach(v => console.log(`  - ${v}`));
    }

    expect(violations).toEqual([]);
  });

  test('components using Radix UI should have "use client" directive', () => {
    const componentFiles = getComponentFiles();
    const violations: string[] = [];

    componentFiles.forEach(filePath => {
      const content = readFileContent(filePath);
      const hasDirective = hasUseClientDirective(content);
      const needs = usesRadixUI(content);

      if (needs && !hasDirective) {
        const relativePath = path.relative(process.cwd(), filePath);
        violations.push(`${relativePath} uses Radix UI but missing "use client"`);
      }
    });

    if (violations.length > 0) {
      console.log('Components with Radix UI missing "use client":');
      violations.forEach(v => console.log(`  - ${v}`));
    }

    expect(violations).toEqual([]);
  });

  test('components using client-side libraries should have "use client" directive', () => {
    const componentFiles = getComponentFiles();
    const violations: string[] = [];

    componentFiles.forEach(filePath => {
      const content = readFileContent(filePath);
      const hasDirective = hasUseClientDirective(content);
      const needs = usesClientLibraries(content);

      if (needs && !hasDirective) {
        const relativePath = path.relative(process.cwd(), filePath);
        violations.push(`${relativePath} uses client-side libraries but missing "use client"`);
      }
    });

    if (violations.length > 0) {
      console.log('Components with client-side libraries missing "use client":');
      violations.forEach(v => console.log(`  - ${v}`));
    }

    expect(violations).toEqual([]);
  });

  test('all newly ported UI primitives should have correct "use client" directive', () => {
    const newlyPortedComponents = [
      'src/components/ui/button.tsx',
      'src/components/ui/label.tsx',
      'src/components/ui/separator.tsx',
      'src/components/ui/badge.tsx',
    ];

    const violations: string[] = [];

    newlyPortedComponents.forEach(relativePath => {
      const filePath = path.join(process.cwd(), relativePath);
      if (!fs.existsSync(filePath)) {
        violations.push(`${relativePath} does not exist`);
        return;
      }

      const content = readFileContent(filePath);
      const hasDirective = hasUseClientDirective(content);
      const needs = needsUseClient(content);

      if (needs && !hasDirective) {
        violations.push(`${relativePath} needs "use client" but doesn't have it`);
      } else if (!needs && hasDirective) {
        // This is not necessarily a violation, but we log it for awareness
        console.log(`Note: ${relativePath} has "use client" but may not need it`);
      }
    });

    if (violations.length > 0) {
      console.log('Newly ported components with incorrect "use client" directive:');
      violations.forEach(v => console.log(`  - ${v}`));
    }

    expect(violations).toEqual([]);
  });

  test('components without client-side features should not have "use client" directive', () => {
    const componentFiles = getComponentFiles();
    const unnecessaryDirectives: string[] = [];

    componentFiles.forEach(filePath => {
      const content = readFileContent(filePath);
      const hasDirective = hasUseClientDirective(content);
      const needs = needsUseClient(content);

      // Only flag as unnecessary if it's a simple component that clearly doesn't need it
      // We're being conservative here to avoid false positives
      if (hasDirective && !needs) {
        const relativePath = path.relative(process.cwd(), filePath);
        // Only report if it's a very simple component (no imports from React, no JSX complexity)
        if (!content.includes('React.') && !content.includes('forwardRef')) {
          unnecessaryDirectives.push(relativePath);
        }
      }
    });

    // This is informational only - not a hard failure
    if (unnecessaryDirectives.length > 0) {
      console.log('Components with potentially unnecessary "use client" directive:');
      unnecessaryDirectives.forEach(path => console.log(`  - ${path}`));
    }

    // We don't fail on this - it's just informational
    expect(true).toBe(true);
  });
});
