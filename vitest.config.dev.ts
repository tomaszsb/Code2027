import { defineConfig } from 'vitest/config';
import path from 'path';

// Development configuration optimized for SPEED and fast feedback loops
export default defineConfig({
  test: {
    // Use Node environment by default - much faster than jsdom for service tests
    environment: 'node',
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx'
    ],
    exclude: [
      'tests/**/*.lightweight.test.ts',  // Exclude Jest-specific optimized tests
      'tests/**/*.optimized.test.ts',    // Exclude Jest-specific optimized tests
      'tests/debug-*.test.ts',           // Exclude debug files
      'node_modules/**',
      'dist/**'
    ],
    globals: true,
    setupFiles: ['tests/vitest.setup.ts'],

    // SPEED OPTIMIZATIONS: Use threads for parallel execution
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,        // Parallel execution with up to 4 threads
        minThreads: 1,
        isolate: false,       // Shared context for speed
        useAtomics: true      // Enable atomic operations for better performance
      }
    },

    // Faster timeouts for development
    testTimeout: 15000,       // 15 seconds (reduced from 30)

    // Minimal isolation for maximum speed
    isolate: false,           // Shared environment between tests
    clearMocks: true,         // Still clear mocks for test reliability

    // Faster reporter
    reporter: ['default'],

    // Skip coverage for development speed (use test:coverage for coverage)
    coverage: {
      enabled: false
    },

    // Faster test discovery
    passWithNoTests: true
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});