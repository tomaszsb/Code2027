// Simple test runner using tsx

// Mock Jest globals for our test
(global as any).describe = (name: string, fn: () => void) => {
  console.log(`Running: ${name}`);
  fn();
};

(global as any).it = (global as any).test = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error: any) {
    console.log(`  ✗ ${name}: ${error.message}`);
  }
};

(global as any).expect = (actual: any) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected}, got ${actual}`);
    }
  }
});

// Import and run our test
import('./tests/debug-minimal.test').then(() => {
  console.log('Test completed!');
}).catch((error) => {
  console.error('Test failed:', error);
});