# Code2027 - Manual QA Test Plan

**Version:** 1.0
**Created:** November 18, 2025
**Test Scope:** Mobile UI Redesign (Phases 1-5) + Error Handling
**Target:** Pre-Production Release

---

## Test Environment Setup

### Test Devices

**Desktop:**
- Chrome (latest) on Windows 10/11
- Firefox (latest) on Windows 10/11
- Safari (latest) on macOS
- Edge (latest) on Windows 10/11

**Mobile:**
- iPhone (Safari) - iOS 14+
- Android Phone (Chrome) - Android 10+

**Tablet:**
- iPad (Safari) - iOS 14+
- Android Tablet (Chrome) - Android 10+

### Browser Window Sizes

**Mobile:** 375x667 (iPhone SE)
**Tablet:** 768x1024 (iPad)
**Desktop:** 1920x1080 (Full HD)

---

## Phase 5: Edge Cases & Polish Testing

### Test Suite 1: Try Again State Reset

**Test ID:** EC-01
**Priority:** HIGH
**Objective:** Verify Try Again feature properly resets UI state

#### Test Steps:

1. **Setup:**
   - Start a new game with 2 players
   - Advance to a space with choices (e.g., OWNER-SCOPE-INITIATION)

2. **Make Initial Choice:**
   - Expand "On This Space" section
   - Note the available choices (Accept/Reject/Negotiate)
   - Click "Accept"
   - ✅ **Verify:** Choice processes successfully
   - ✅ **Verify:** "On This Space" section updates with result

3. **Use Try Again:**
   - Click "Try Again" button
   - ✅ **Verify:** UI reverts to pre-choice state
   - ✅ **Verify:** Original choices reappear (Accept/Reject/Negotiate)
   - ✅ **Verify:** All sections reset to pre-action state
   - ✅ **Verify:** Next Step Button returns to previous state

4. **Make Different Choice:**
   - Click "Reject" instead
   - ✅ **Verify:** New choice processes correctly
   - ✅ **Verify:** Different outcome appears

**Expected Results:**
- ✅ Try Again reverts all UI changes
- ✅ Choices become available again
- ✅ Can make different selection
- ✅ No leftover state from first choice

**Pass Criteria:** All verifications pass
**Fail Actions:** Document which verification failed, take screenshot

---

### Test Suite 2: Complex ChoiceEffect Cards

**Test ID:** EC-02
**Priority:** MEDIUM
**Objective:** Verify UI handles cards with 3+ choices

#### Test Cases:

**EC-02-01: Three Choices**
1. Find a card/space with exactly 3 choices
2. ✅ **Verify:** All 3 buttons render vertically on mobile (<480px)
3. ✅ **Verify:** All 3 buttons render horizontally on desktop (≥480px)
4. ✅ **Verify:** All button labels are fully visible (not truncated)
5. ✅ **Verify:** All buttons are tappable/clickable
6. ✅ **Verify:** Buttons have correct color variants

**EC-02-02: Four Choices**
1. Find a card/space with 4 choices
2. ✅ **Verify:** All 4 buttons fit in viewport without scrolling
3. ✅ **Verify:** Button layout wraps appropriately
4. ✅ **Verify:** Touch targets are at least 44x44px (mobile)

**EC-02-03: Five Choices**
1. Find a card/space with 5 choices
2. ✅ **Verify:** All 5 buttons visible with scrolling if needed
3. ✅ **Verify:** Buttons maintain spacing and padding
4. ✅ **Verify:** Can tap/click all choices

**EC-02-04: Long Choice Labels**
1. Find choice with label > 20 characters
2. ✅ **Verify:** Label wraps to multiple lines if needed
3. ✅ **Verify:** Tooltip/aria-label provides full description
4. ✅ **Verify:** Button height adjusts for wrapped text

**Pass Criteria:** All choice configurations render correctly
**Fail Actions:** Note which layout fails, take screenshot of issue

---

### Test Suite 3: End Turn Button Visibility

**Test ID:** EC-03
**Priority:** HIGH
**Objective:** Ensure End Turn button is always visible when appropriate

#### Test Cases:

**EC-03-01: Turn Start**
- ✅ **Verify:** Button visible at turn start
- ✅ **Verify:** Button shows "End Turn (X actions remaining)"
- ✅ **Verify:** Button is disabled (gray)
- ✅ **Verify:** Tooltip explains why disabled

**EC-03-02: During Actions**
- Complete 1 of 3 required actions
- ✅ **Verify:** Button still visible
- ✅ **Verify:** Count updates ("2 actions remaining")
- ✅ **Verify:** Button remains disabled

**EC-03-03: All Actions Complete**
- Complete all required actions
- ✅ **Verify:** Button shows "End Turn" (no count)
- ✅ **Verify:** Button is enabled (blue)
- ✅ **Verify:** Button is clickable

**EC-03-04: Pending Choice**
- Have a pending choice (card or movement)
- ✅ **Verify:** Button visible but disabled
- ✅ **Verify:** Tooltip says "Complete current action first"

**EC-03-05: Other Player's Turn**
- Switch to another player's turn
- ✅ **Verify:** Button is hidden (not just disabled)

**EC-03-06: Mobile Position**
- Test on mobile viewport (375x667)
- ✅ **Verify:** Button in bottom-right corner
- ✅ **Verify:** Button doesn't overlap content
- ✅ **Verify:** Button is within thumb reach

**EC-03-07: Desktop Position**
- Test on desktop viewport (1920x1080)
- ✅ **Verify:** Button in bottom-right with margin
- ✅ **Verify:** Button visible above fold
- ✅ **Verify:** Button doesn't cover important content

**Pass Criteria:** Button always visible when should be, never when shouldn't
**Fail Actions:** Document when button incorrectly shows/hides

---

### Test Suite 4: Accessibility Testing

**Test ID:** EC-04
**Priority:** HIGH
**Objective:** Verify keyboard navigation and screen reader support

#### Test Cases:

**EC-04-01: Keyboard Navigation**
1. Use only keyboard (no mouse)
2. Press Tab repeatedly
3. ✅ **Verify:** Tab order is logical (top to bottom, left to right)
4. ✅ **Verify:** All interactive elements reachable
5. ✅ **Verify:** Focus indicator visible on all elements
6. ✅ **Verify:** Can expand/collapse sections with Enter/Space
7. ✅ **Verify:** Can activate buttons with Enter/Space
8. ✅ **Verify:** Can use Escape to collapse sections

**EC-04-02: Screen Reader (NVDA/JAWS/VoiceOver)**
1. Enable screen reader
2. Navigate through Player Panel
3. ✅ **Verify:** Section headings announced
4. ✅ **Verify:** Button labels clear and descriptive
5. ✅ **Verify:** Expand/collapse state announced
6. ✅ **Verify:** Action availability announced (red dot)
7. ✅ **Verify:** Error messages read aloud
8. ✅ **Verify:** Loading states announced

**EC-04-03: Color Contrast**
1. Use browser DevTools or contrast checker
2. ✅ **Verify:** All text has ≥4.5:1 contrast ratio
3. ✅ **Verify:** Action buttons have ≥3:1 contrast
4. ✅ **Verify:** Red dot indicator has ≥3:1 contrast
5. ✅ **Verify:** Disabled state has ≥3:1 contrast

**EC-04-04: Focus Management**
1. Click a button
2. ✅ **Verify:** Focus moves logically after action
3. ✅ **Verify:** Modal opens with focus on first element
4. ✅ **Verify:** Modal closes returning focus to trigger

**EC-04-05: ARIA Attributes**
1. Inspect DOM with DevTools
2. ✅ **Verify:** `aria-expanded` on expandable sections
3. ✅ **Verify:** `aria-controls` linking header to content
4. ✅ **Verify:** `aria-label` on icon-only buttons
5. ✅ **Verify:** `role="status"` on action indicators

**Pass Criteria:** All WCAG 2.1 AA criteria met
**Fail Actions:** Document specific WCAG failure with severity

---

### Test Suite 5: Performance Testing

**Test ID:** EC-05
**Priority:** MEDIUM
**Objective:** Verify UI performs well under stress

#### Test Cases:

**EC-05-01: Initial Load**
1. Clear browser cache
2. Load game fresh
3. ✅ **Verify:** Page loads in < 3 seconds
4. ✅ **Verify:** No console errors
5. ✅ **Verify:** All sections render correctly

**EC-05-02: Re-render Performance**
1. Play for 20+ turns
2. ✅ **Verify:** Sections expand/collapse smoothly
3. ✅ **Verify:** Buttons respond instantly (<100ms)
4. ✅ **Verify:** No visible lag or stuttering

**EC-05-03: Memory Leaks**
1. Play for 50+ turns
2. Check Chrome DevTools Memory tab
3. ✅ **Verify:** Memory usage stable (not constantly increasing)
4. ✅ **Verify:** No detached DOM elements accumulating

**EC-05-04: Animation Smoothness**
1. Expand/collapse sections rapidly
2. ✅ **Verify:** Animations run at 60fps
3. ✅ **Verify:** No janky transitions
4. ✅ **Verify:** Mobile performance acceptable

**EC-05-05: Large Data Sets**
1. Draw 50+ cards
2. Visit 30+ spaces
3. ✅ **Verify:** UI remains responsive
4. ✅ **Verify:** Cards section handles large hand
5. ✅ **Verify:** Discarded cards modal handles large list

**Pass Criteria:** UI remains responsive under all conditions
**Fail Actions:** Note specific performance issue with profiler screenshot

---

### Test Suite 6: Cross-Browser Testing

**Test ID:** EC-06
**Priority:** HIGH
**Objective:** Verify consistent behavior across browsers

#### Test Matrix:

| Test | Chrome | Firefox | Safari | Edge | Mobile Safari | Chrome Mobile |
|------|--------|---------|--------|------|---------------|---------------|
| UI renders correctly | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Sections expand/collapse | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Buttons clickable | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Choices process correctly | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Next Step Button works | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Error handling works | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| Animations smooth | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| No console errors | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |

**Pass Criteria:** All browsers pass all tests
**Fail Actions:** Document browser-specific issues with version

---

## Error Handling Testing

### Test Suite 7: Component Error Boundaries

**Test ID:** EH-01
**Priority:** HIGH
**Objective:** Verify ErrorBoundary catches and handles errors gracefully

#### Test Cases:

**EH-01-01: Force Component Error**
1. Open browser DevTools
2. Inject error in component (modify props in React DevTools)
3. ✅ **Verify:** ErrorBoundary catches error
4. ✅ **Verify:** Shows "Something went wrong" screen
5. ✅ **Verify:** Reload button present and functional
6. ✅ **Verify:** Error logged to console

**EH-01-02: Service Error**
1. Simulate network error (offline mode)
2. Try to load game
3. ✅ **Verify:** Error message displays
4. ✅ **Verify:** User can retry
5. ✅ **Verify:** Clear explanation provided

**EH-01-03: Nested Boundaries**
1. Trigger error in nested component
2. ✅ **Verify:** Inner ErrorBoundary catches it first
3. ✅ **Verify:** App doesn't crash entirely
4. ✅ **Verify:** User can continue with other components

**Pass Criteria:** No unhandled errors, graceful degradation
**Fail Actions:** Document which errors aren't caught

---

### Test Suite 8: Service Error Messages

**Test ID:** EH-02
**Priority:** HIGH
**Objective:** Verify user-facing error messages are helpful

#### Test Cases:

**EH-02-01: Insufficient Funds**
1. Try action requiring $1000 with only $500
2. ✅ **Verify:** Error message shows amounts clearly
3. ✅ **Verify:** Message suggests solution (draw funding cards)

**EH-02-02: Invalid Movement**
1. Try to move to invalid destination (simulate in console)
2. ✅ **Verify:** Error explains why move is invalid
3. ✅ **Verify:** Message suggests checking available destinations

**EH-02-03: Card Play Failed**
1. Try playing card without meeting requirements
2. ✅ **Verify:** Error names the card
3. ✅ **Verify:** Error explains what requirement failed
4. ✅ **Verify:** User can retry or choose different card

**EH-02-04: Not Your Turn**
1. Try action on another player's turn (console)
2. ✅ **Verify:** Error says whose turn it is
3. ✅ **Verify:** Message clear and not technical

**EH-02-05: Generic Error**
1. Trigger unexpected error
2. ✅ **Verify:** Error message is user-friendly
3. ✅ **Verify:** Doesn't expose technical stack trace to user
4. ✅ **Verify:** Provides actionable next step

**Pass Criteria:** All errors have clear, helpful messages
**Fail Actions:** Note which error message is confusing

---

## Full Game Playthrough Testing

### Test Suite 9: Complete Game Flow

**Test ID:** FG-01
**Priority:** CRITICAL
**Objective:** Verify entire game can be completed

#### Test Steps:

1. **Game Setup**
   - Add 2 players
   - Start game
   - ✅ **Verify:** Players placed on starting space
   - ✅ **Verify:** Turn begins for Player 1

2. **Turn 1-5: Early Game**
   - Roll dice, move, make choices
   - Draw cards, play cards
   - ✅ **Verify:** All actions work
   - ✅ **Verify:** UI updates correctly
   - ✅ **Verify:** No console errors

3. **Turn 6-10: Mid Game**
   - Use Try Again feature
   - Negotiate on negotiable space
   - Transfer cards between players
   - ✅ **Verify:** All features functional
   - ✅ **Verify:** State management correct

4. **Turn 11-20: Late Game**
   - Multiple players at same space
   - Complex card combinations
   - Edge cases (insufficient funds, etc.)
   - ✅ **Verify:** Game handles edge cases
   - ✅ **Verify:** No crashes or freezes

5. **Game Completion**
   - Reach FINISH space
   - ✅ **Verify:** End game modal appears
   - ✅ **Verify:** Winner declared correctly
   - ✅ **Verify:** Scores calculated
   - ✅ **Verify:** Can start new game

**Pass Criteria:** Complete game without errors
**Fail Actions:** Document turn where failure occurred

---

## Regression Testing

### Test Suite 10: Previously Fixed Bugs

**Test ID:** REG-01
**Priority:** HIGH
**Objective:** Verify old bugs haven't resurfaced

#### Test Cases:

**REG-01-01: Automatic Card Draw**
- Space: OWNER-FUND-INITIATION
- ✅ **Verify:** B and I cards draw automatically
- ✅ **Verify:** No manual button appears

**REG-01-02: Movement Path Selection**
- Space with multiple paths
- ✅ **Verify:** Can select destination
- ✅ **Verify:** Can change selection
- ✅ **Verify:** Choice persists until End Turn

**REG-01-03: Button Nesting**
- Check all ActionButtons
- ✅ **Verify:** No nested button elements in DOM
- ✅ **Verify:** Proper semantic HTML structure

**REG-01-04: NaN Card Count**
- Draw and discard multiple cards
- ✅ **Verify:** Card counts always numeric
- ✅ **Verify:** No "NaN" displayed anywhere

**Pass Criteria:** All previously fixed bugs remain fixed
**Fail Actions:** Document regression with details

---

## Test Execution Log

### Session Information

**Tester:**  _________________
**Date:**  _________________
**Build:** _________________
**Environment:** _________________

### Test Results Summary

| Test Suite | Total Tests | Passed | Failed | Blocked | Notes |
|------------|-------------|--------|--------|---------|-------|
| EC-01: Try Again | | | | | |
| EC-02: Complex Choices | | | | | |
| EC-03: End Turn Visibility | | | | | |
| EC-04: Accessibility | | | | | |
| EC-05: Performance | | | | | |
| EC-06: Cross-Browser | | | | | |
| EH-01: Error Boundaries | | | | | |
| EH-02: Error Messages | | | | | |
| FG-01: Full Game | | | | | |
| REG-01: Regressions | | | | | |

### Critical Issues Found

| Issue ID | Severity | Description | Steps to Reproduce | Status |
|----------|----------|-------------|-------------------|---------|
| | | | | |

### Non-Critical Issues Found

| Issue ID | Severity | Description | Steps to Reproduce | Status |
|----------|----------|-------------|-------------------|---------|
| | | | | |

### Browser-Specific Issues

| Browser | Version | Issue | Workaround |
|---------|---------|-------|------------|
| | | | |

### Sign-Off

**QA Lead:** _________________ **Date:** _________________
**Tech Lead:** _________________ **Date:** _________________
**Project Manager:** _________________ **Date:** _________________

---

## Appendix: Testing Tools

### Recommended Browser Extensions

- **React Developer Tools**: Inspect component state
- **axe DevTools**: Accessibility testing
- **Lighthouse**: Performance auditing
- **Wave**: Accessibility evaluation

### Screen Reader Setup

**Windows:**
- NVDA (free): https://www.nvaccess.org/
- JAWS (commercial): https://www.freedomscientific.com/

**macOS:**
- VoiceOver (built-in): Cmd+F5

**Mobile:**
- iOS VoiceOver: Settings > Accessibility
- Android TalkBack: Settings > Accessibility

### Contrast Checkers

- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Chrome DevTools**: Built-in contrast ratio display

---

**Good luck with testing!** 🧪✅
