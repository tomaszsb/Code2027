# Testing Guide - Code2027

## 🚀 Quick Start (Lightning Fast Tests)

Our test suite runs in **seconds, not minutes** thanks to the Vitest migration and performance optimizations.

### **Essential Commands**
```bash
npm test                    # Run full test suite (<30 seconds)
npm run test:watch          # Real-time testing for development
npm run test:services       # Test service layer only
npm run test:isolated       # Ultra-fast pure logic tests
```

## 📊 Performance Achievement

**Before Optimization**: 15+ minute timeouts, unusable for TDD
**After Vitest Migration**: Sub-30-second full suite, instant feedback

| Test Category | Tests | Execution Time | Status |
|---------------|-------|----------------|--------|
| Service Tests | 74+ tests | ~300ms | ⚡ Lightning fast |
| Isolated Tests | 22 tests | ~50ms | 🚀 Ultra-fast |
| Full Suite | 100+ tests | <30 seconds | ✅ Production ready |

## 🛠️ Writing Tests

### **Service Test Template**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YourService } from '../src/services/YourService';

describe('YourService', () => {
  let service: YourService;
  let mockDependency: any;

  beforeEach(() => {
    mockDependency = {
      someMethod: vi.fn().mockReturnValue('expected result')
    };
    service = new YourService(mockDependency);
  });

  it('should perform action successfully', async () => {
    const result = await service.performAction('input');
    
    expect(result.success).toBe(true);
    expect(mockDependency.someMethod).toHaveBeenCalledWith('input');
  });
});
```

### **Component Test Template**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YourComponent } from '../src/components/YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    const mockProps = {
      data: { id: '1', name: 'Test' },
      onAction: vi.fn()
    };

    render(<YourComponent {...mockProps} />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### **Isolated Unit Test Template**
```typescript
import { describe, it, expect } from 'vitest';

// Pure logic tests - no dependencies, ultra-fast
describe('Pure Function Tests', () => {
  it('should calculate correctly', () => {
    const result = calculateSomething(10, 20);
    expect(result).toBe(30);
  });

  it('should complete within performance budget', () => {
    const start = performance.now();
    
    // Your logic here
    const result = complexCalculation(1000);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(5); // Under 5ms
    expect(result).toBeGreaterThan(0);
  });
});
```

## 🎯 Test Categories

### **Service Tests** (`tests/services/`)
- Test business logic and service interactions
- Use mock dependencies via dependency injection
- Cover all public methods and error cases
- **Performance**: ~100-200ms per service

### **Component Tests** (`tests/components/`)
- Test UI rendering and user interactions
- Mock all service dependencies
- Focus on props and event handling
- **Performance**: Fast with proper mocking

### **Isolated Tests** (`tests/isolated/`)
- Pure logic functions with zero dependencies
- Mathematical calculations, utility functions
- Performance benchmarking tests
- **Performance**: ~20-50ms total

### **Integration Tests** (`tests/E2E-*`)
- End-to-end scenarios testing service interactions
- Real business workflows
- Multi-step game mechanics
- **Performance**: Seconds with optimized mocks

## 🔧 Mock Strategies

### **Lightweight Mocks** (Recommended)
```typescript
// Fast: Only mock what you need
const mockService = {
  essentialMethod: vi.fn(() => 'result'),
  // Only include methods actually used in test
};
```

### **Full Service Mocks** (When Needed)
```typescript
import { createMockDataService } from '../mocks/mockServices';

const mockDataService = createMockDataService();
// Pre-built comprehensive mocks for complex scenarios
```

## 📋 Best Practices

### **Performance Guidelines**
- Keep tests under 100ms each when possible
- Use isolated tests for pure logic
- Mock heavy dependencies (DataService, network calls)
- Batch related tests in same describe block

### **Code Quality**
- One assertion per test (generally)
- Clear, descriptive test names
- Setup/teardown in beforeEach/afterEach
- Mock only what's needed for the test

### **Debugging Tests**
```bash
npm run test:verbose       # Full output for debugging
npm run test:debug         # Extra detailed information
npm test -- --reporter=verbose  # Vitest verbose reporter
```

## 🚨 Common Issues & Solutions

### **Test Hanging**
- **Fixed**: Vitest migration resolved all hanging issues
- If you see hangs, check for unmocked async operations

### **Mock Not Working**
```typescript
// ✅ Correct: Use vi.fn()
const mockFn = vi.fn().mockReturnValue('result');

// ❌ Incorrect: Don't use jest.fn()
const mockFn = jest.fn(); // This will fail
```

### **TypeScript Errors**
- All type errors resolved with Vitest migration
- Use `any` type for complex mocks if needed
- Ensure service interfaces match implementations

## 🎉 Migration Complete

The test suite has been completely migrated from Jest to Vitest with incredible performance improvements:

- **✅ 31 test files** converted and working
- **✅ 100+ tests** running in seconds
- **✅ Real-time feedback** for TDD workflow
- **✅ Zero compilation hangs** with native TypeScript support

**Ready for continuous testing and rapid development!**