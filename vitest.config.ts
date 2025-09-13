import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: [
      'tests/**/*.test.ts'
    ],
    exclude: [
      'tests/**/*.lightweight.test.ts',  // Exclude Jest-specific optimized tests
      'tests/**/*.optimized.test.ts',    // Exclude Jest-specific optimized tests
      'tests/debug-*.test.ts'            // Exclude debug files
    ],
    globals: true,
    setupFiles: ['tests/vitest.setup.ts'],
    
    // Performance optimizations (similar to our Jest optimizations)
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: Math.ceil((require('os').cpus().length * 0.75)), // 75% of CPU cores
        minThreads: 2
      }
    },
    
    // Test timeout configuration
    testTimeout: 30000, // 30 seconds
    
    // Reporter configuration
    reporter: ['default'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*'],
      exclude: ['src/types/**/*', 'src/**/*.d.ts']
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});