// Minimal test to debug Jest hanging issue
describe('Jest Environment Debug', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should handle basic async operation', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});