// Test setup file
import 'jest-environment-jsdom';

// Mock global fetch if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn();
}

// Suppress console.error in tests unless needed - TEMPORARILY COMMENTED OUT FOR DIAGNOSTICS
// const originalError = console.error;
// beforeEach(() => {
//   console.error = jest.fn();
// });

// afterEach(() => {
//   console.error = originalError;
// });