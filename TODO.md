# Current Tasks - Code2027 Project

**Last Updated**: September 21, 2025
**Current Phase**: Test Suite Stabilization
**Priority**: Fix 8 identified test failures before moving to feature development

---

## 🚨 **IMMEDIATE PRIORITY: Test Suite Stabilization**

### **TurnService Test Failures (6 tests)**
**Issue**: `this.stateService.clearTurnActions is not a function`
**Affected Tests**:
- `should advance from first player to second player`
- `should advance from second player to third player`
- `should wrap around from last player to first player`
- `should work with two players`
- `should work with single player (wrap to self)`
- `should call state service methods in correct order`

**Root Cause**: The `clearTurnActions()` method EXISTS in the actual StateService interface and implementation, but is missing from the test mock in `TurnService.test.ts`.

**Action Required**: Add `clearTurnActions: vi.fn()` to the `mockStateService` in `tests/services/TurnService.test.ts`.

---

### **E066 Integration Test Failure (1 test)**
**Issue**: `should reset canReRoll flag at end of turn`
**Description**: The canReRoll flag reset functionality is not working as expected during turn transitions.

**Action Required**: Debug the E066 card reroll mechanics to ensure proper flag reset at turn end.

---

### **TurnControlsWithActions Test Failure (1 test)**
**Issue**: `should call notificationService.notify when movement choice button is clicked`
**Description**: Movement choice button clicks are not triggering the expected notification service calls.

**Action Required**: Fix the notification integration in movement choice handling.

---

## 🎯 **PENDING: UI/UX Improvements**
*(Start after test stabilization)*

- **Display Full Card Titles**: Update Card Portfolio to show full card names instead of IDs like "e1"
- **Clarify Space Explorer Close Buttons**: Rework the two "x" buttons for better UX
- **Expand Location Story Text**: Include `action_description` and `outcome_description` from CSV files
- **Dynamic Location Title**: Replace static "Location" title with actual space name
- **Refine Game Log Naming**: Replace "SYSTEM" entries with relevant player names

---

## 🔧 **FUTURE: Infrastructure & Performance**
*(P3 - After core stability achieved)*

- **Implement Base Service Class**: Reduce code duplication across services
- **Develop Component Library**: Shared UI components
- **Load Time Optimizations**: Execute performance investigation recommendations
- **Bundle Size Reduction**: Reduce initial bundle from 414KB to <200KB

---

## ✅ **RECENTLY COMPLETED**
*(For context - major work completed September 2025)*

- Action Notification visibility fixes (Sept 21)
- Game logic independence fixes (Sept 20)
- Unified notification system (Sept 19)
- PM-DECISION-CHECK UI/data fixes (Sept 16)
- Financial summary enhancements (Sept 17)
- Multi-player card effects (Sept 11)
- Complete theme system implementation (Sept 7)

---

**Next Steps**:
1. Focus on TurnService `clearTurnActions` method issue (6 test failures)
2. Debug E066 canReRoll flag reset (1 test failure)
3. Fix TurnControlsWithActions notification integration (1 test failure)
4. Verify all 8 tests pass before moving to UI improvements

**Success Criteria**: 100% test suite passing (currently 465 passing, 8 failing)