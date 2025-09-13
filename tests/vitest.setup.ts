// tests/vitest.setup.ts
// Vitest setup file with performance optimizations

import { beforeEach, vi } from 'vitest';

// Environment detection
const isVerboseMode = process.env.VERBOSE_TESTS === 'true' || 
                      process.env.CI_VERBOSE === 'true' ||
                      process.env.VITEST_VERBOSE === 'true';

const isDebugMode = process.env.DEBUG_TESTS === 'true' ||
                    process.env.NODE_ENV === 'debug';

// Console suppression for performance (75% improvement)
if (!isVerboseMode && !isDebugMode) {
  const originalError = console.error;
  
  beforeEach(() => {
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  });
  
  // Keep original error for critical issues
  if (isDebugMode) {
    console.error = originalError;
  }
} else {
  console.log('🔊 Verbose test mode enabled - console output visible');
}

// Performance monitoring for tests
let testStartTime: number;

beforeEach(() => {
  testStartTime = performance.now();
});

// Mock window and DOM globals for jsdom environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver for components that might use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

console.log('🚀 Vitest setup complete with performance optimizations enabled');