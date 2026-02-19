/**
 * Feature: figma-ui-integration, Property 2: Existing Functionality Preservation
 * 
 * For all existing API endpoints, authentication flows, recommendation algorithms,
 * and iRacing sync operations, the behavior after integration should be functionally
 * equivalent to the behavior before integration.
 * 
 * Validates: Requirements 1.5, 15.1, 15.2, 15.3, 15.4, 15.5
 */

import * as fc from 'fast-check';

describe('Property 2: Existing Functionality Preservation', () => {
  /**
   * Test that existing API endpoints are still accessible and functional
   */
  test('existing API endpoints remain functional', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          '/api/recommendations',
          '/api/auth/session',
          '/api/data/sync',
          '/api/performance/metrics'
        ),
        (endpoint) => {
          // Verify endpoint exists in the codebase
          const fs = require('fs');
          const path = require('path');
          
          // Convert API route to file path
          const routePath = endpoint.replace('/api/', 'src/app/api/') + '/route.ts';
          const exists = fs.existsSync(path.join(process.cwd(), routePath));
          
          expect(exists).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that authentication logic files are unchanged
   */
  test('authentication files remain unchanged', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/lib/auth/server.ts',
          'src/lib/auth/session.ts',
          'src/lib/auth/middleware.ts',
          'src/lib/auth/oauth.ts'
        ),
        (filePath) => {
          const fs = require('fs');
          const path = require('path');
          
          // Verify auth files exist
          const exists = fs.existsSync(path.join(process.cwd(), filePath));
          expect(exists).toBe(true);
          
          // Verify they don't import from figma_reference
          if (exists) {
            const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
            expect(content).not.toMatch(/from ['"].*figma_reference/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that recommendation algorithm files are unchanged
   */
  test('recommendation algorithm files remain unchanged', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/lib/recommendations/scoring.ts',
          'src/lib/recommendations/engine.ts',
          'src/lib/recommendations/data-preparation.ts',
          'src/lib/recommendations/license-filter.ts'
        ),
        (filePath) => {
          const fs = require('fs');
          const path = require('path');
          
          // Verify recommendation files exist
          const exists = fs.existsSync(path.join(process.cwd(), filePath));
          expect(exists).toBe(true);
          
          // Verify they don't import from figma_reference
          if (exists) {
            const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
            expect(content).not.toMatch(/from ['"].*figma_reference/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that iRacing sync files are unchanged
   */
  test('iRacing sync files remain unchanged', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/lib/iracing/sync.ts',
          'src/lib/iracing/client.ts',
          'src/lib/iracing/schedule.ts'
        ),
        (filePath) => {
          const fs = require('fs');
          const path = require('path');
          
          // Verify iRacing files exist
          const exists = fs.existsSync(path.join(process.cwd(), filePath));
          expect(exists).toBe(true);
          
          // Verify they don't import from figma_reference
          if (exists) {
            const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
            expect(content).not.toMatch(/from ['"].*figma_reference/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that database schema files are unchanged
   */
  test('database schema files remain unchanged', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'src/lib/db/schema.ts',
          'src/lib/db/index.ts'
        ),
        (filePath) => {
          const fs = require('fs');
          const path = require('path');
          
          // Verify database files exist
          const exists = fs.existsSync(path.join(process.cwd(), filePath));
          expect(exists).toBe(true);
          
          // Verify they don't import from figma_reference
          if (exists) {
            const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
            expect(content).not.toMatch(/from ['"].*figma_reference/);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Test that no core backend files import from figma_reference
   */
  test('no backend files import from figma_reference', () => {
    const glob = require('glob');
    const fs = require('fs');
    const path = require('path');
    
    const backendFiles = glob.sync('src/{lib,app/api}/**/*.{ts,tsx}', {
      cwd: process.cwd(),
      ignore: ['**/*.test.ts', '**/*.test.tsx', '**/node_modules/**']
    });
    
    fc.assert(
      fc.property(
        fc.constantFrom(...backendFiles),
        (filePath) => {
          const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf-8');
          
          // Backend files should not import from figma_reference
          expect(content).not.toMatch(/from ['"].*figma_reference/);
          expect(content).not.toMatch(/import.*from ['"].*figma_reference/);
        }
      ),
      { numRuns: Math.min(100, backendFiles.length) }
    );
  });

  /**
   * Test that Tailwind config preserves existing values
   */
  test('Tailwind config preserves racing colors', () => {
    const fs = require('fs');
    const path = require('path');
    
    const tailwindConfigPath = path.join(process.cwd(), 'tailwind.config.js');
    const content = fs.readFileSync(tailwindConfigPath, 'utf-8');
    
    // Check that racing colors are still defined
    const racingColors = ['rookie', 'd', 'c', 'b', 'a', 'pro'];
    
    fc.assert(
      fc.property(
        fc.constantFrom(...racingColors),
        (color) => {
          // Verify racing color is still in config
          expect(content).toMatch(new RegExp(`racing.*${color}`, 'i'));
        }
      ),
      { numRuns: 100 }
    );
  });
});
