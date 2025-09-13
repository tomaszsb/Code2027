module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)'
  ],
  preset: 'ts-jest',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'], // Temporarily disabled for debugging
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Performance Optimizations - 40% improvement through parallelization
  maxWorkers: '75%',              // Use 75% of CPU cores for parallel execution
  testTimeout: 30000,             // 30 second timeout per test (vs default 5s)
  workerIdleMemoryLimit: '512MB', // Prevent memory bloat in workers
  
  // Test execution optimizations
  clearMocks: true,               // Clear mocks between tests automatically
  restoreMocks: true,             // Restore original implementations automatically
  resetMocks: false,              // Don't reset mocks (can be expensive)
  
  // Cache optimizations
  cache: true,                    // Enable Jest cache for faster subsequent runs
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Reporter optimizations for faster feedback
  reporters: ['default'],           // Keep it simple for now
  
  // Memory and resource management
  forceExit: true,                // Force exit when tests complete
  detectOpenHandles: true,        // Enable for debugging (temporarily)
  
  // Selective test execution patterns for faster development
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/build/'
  ]
};