# Code2027 Project Roadmap

**Last Updated:** November 5, 2025

This document serves as the single source of truth for the Code2027 project's status, priorities, and future plans. It is a concatenation of all relevant planning and status documents.

---

# Part 1: Current Project Status

## From: docs/project/PROJECT_STATUS.md

# Project Status

**Last Updated**: October 7, 2025
**Current Phase**: Production Polish & Feature Development

This document provides a high-level overview of the current work status for the `code2027` project.

---

## In Progress

### 1. "Try Again" Logic Refactor
- **Status**: 🟡 In Progress
- **Objective**: Remove the brittle `usedTryAgain` flag from the core player state and replace it with a parameter-based system managed in the UI layer.
- **Impact**: Improves architectural integrity and resolves a class of potential bugs related to turn logic.

---

## Up Next

### 1. Data Editor Implementation
- **Status**: 🔵 Planned
- **Objective**: Build the UI and logic for the `DataEditor.tsx` component, allowing for form-based editing of `Spaces.csv` and downloading the modified file.
- **Prerequisite**: Completion of the "Try Again" Logic Refactor.

### 2. Game Manual
- **Status**: 🔵 Planned
- **Objective**: Create a comprehensive, user-facing guide to the game's rules and mechanics.
- **Prerequisite**: To be scheduled.

---

# Part 2: Player Panel UI Redesign - Implementation Plan

## From: docs/project/UI_REDESIGN_IMPLEMENTATION_PLAN.md

# Player Panel UI Redesign - Implementation Plan

**Version:** 2.0 (Reviewed & Approved)
**Date:** October 10, 2025
**Status:** Approved - Ready for Implementation
**Reviewed By:** Gemini AI

---

## 1. Overview & Goals

### Problem Statement
Current Player Panel UI has information density issues on mobile devices:
- Primary action buttons (accept/reject/negotiate) not visible
- Mixed navigation and action controls
- Excessive scrolling required
- Unclear action availability

### Solution Summary
Mobile-first redesign with contextual expandable sections and persistent "Next Step" button:
- **Expandable sections** with actions nested by category
- **Action indicators** (🔴) show when actions are available
- **Information redistribution** to appropriate UI areas
- **Persistent "Next Step" button** for primary game loop actions

### Success Criteria
- [ ] All primary actions visible/discoverable without scrolling
- [ ] Clear visual indication of available actions
- [ ] Mobile-optimized with minimal screen real estate
- [ ] Desktop layout gracefully expands for larger screens
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] All edge cases handled (End Turn, Try Again, ChoiceEffect)

---

## 2. Component Architecture

### 2.1 New Component Structure

```
PlayerPanel/
├── CurrentCardSection (expandable) ← FIRST (most critical)
├── FinancesSection (expandable)
├── TimeSection (expandable)
├── CardsSection (expandable)
├── NextStepButton (persistent, fixed position)
└── TryAgainButton (near NextStep, secondary style)
```

**Note:** Section ordering prioritizes the most context-sensitive information first.

### 2.2 Shared Components

**ExpandableSection Component:**
```typescript
interface ExpandableSectionProps {
  title: string;
  icon: string;
  hasAction: boolean;          // Controls 🔴 indicator
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  ariaControls: string;        // For accessibility
  defaultExpandedOnDesktop?: boolean;
  isLoading?: boolean;         // Shows skeleton loader
  error?: string;              // Error message to display
}
```

**ActionButton Component:**
```typescript
interface ActionButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  isLoading?: boolean;         // Shows loading spinner
}
```

**TryAgainButton Component:**
```typescript
interface TryAgainButtonProps {
  onClick: () => void;
  disabled?: boolean;
  visible: boolean;
}

// Styled as secondary "undo" action, placed near NextStepButton
```

---

## 3. Feature-by-Feature Implementation

### 3.1 Expandable Sections

#### Visual States:
```
Collapsed, no action:     💰 FINANCES ▶
Collapsed, has action:    💰 FINANCES ▶ 🔴
Expanded:                 💰 FINANCES ▼
```

#### Implementation Details:

**State Management:**
```typescript
interface SectionState {
  finances: { expanded: boolean; hasAction: boolean };
  time: { expanded: boolean; hasAction: boolean };
  cards: { expanded: boolean; hasAction: boolean };
  currentCard: { expanded: boolean; hasAction: boolean };
}
```

**Action Detection:**
- Query unified `TurnService.getAvailableActions()` which returns array of available action types
- Action types: `['ROLL_FOR_MONEY', 'ROLL_FOR_TIME', 'ROLL_FOR_CARDS_W', 'ROLL_FOR_CARDS_B', 'PLAY_CARD', etc.]`
- Update `hasAction` flags based on which actions are present
- Re-evaluate on ANY state change (not just current player's actions)

**Example:**
```typescript
const actions = gameServices.turnService.getAvailableActions(playerId);
const hasFinancesAction = actions.includes('ROLL_FOR_MONEY');
const hasTimeAction = actions.includes('ROLL_FOR_TIME');
const hasCardsAction = actions.some(a => a.startsWith('ROLL_FOR_CARDS'));
```

**Expansion Logic:**
- Mobile: Start all sections collapsed (except current card if active)
- Desktop (>768px): Current Card ALWAYS expanded, others auto-expand only if they have actions
- User expansions persist during turn, reset on new turn

---

## 4. Implementation Phases

### Phase 1: Core Expandable Sections (COMPLETED - Oct 12, 2025)
**Goal:** Build foundation with expandable UI pattern

**Status:** ✅ **DONE**

**Summary:** The core `ExpandableSection` component was built and integrated into the `ProjectScopeSection`, `FinancesSection`, `TimeSection`, and `CardsSection`. The layout was iteratively refined to a three-column header, and numerous bugs were fixed.

---

### Phase 2: Current Card & ChoiceEffect (Week 1-2)
**Goal:** Dynamic card choices rendering

**Tasks:**
1. Implement `CurrentCardSection` component
2. Integrate `ChoiceEffect` rendering (2-5 choice buttons)
3. Handle long choice descriptions (truncation + tooltips)
4. Test with various card types (Owner, Funding, Design, etc.)
5. Ensure Try Again properly resets choices
6. Write integration tests for card action flows

**Deliverable:** All card types render correctly with dynamic choices.

---

### Phase 3: Next Step Button (Week 2)
**Goal:** Persistent context-aware action button

**Tasks:**
1. Create `NextStepButton` component
2. Implement `getNextStepState()` logic
3. Wire up to `MovementService` (Roll to Move) and `TurnService` (End Turn)
4. Handle disabled state when choices pending
5. Fixed positioning (mobile + desktop)
6. Write unit + E2E tests for all button states

**Deliverable:** Next Step Button working across full game loop.

---

### Phase 4: Information Redistribution (Week 2-3)
**Goal:** Move elements to appropriate UI areas

**Tasks:**
1. Move Rules button to Progress Overview
2. Show player roles on Game Board active space
3. Implement "View Discarded" drawer in Cards section
4. Remove old Player Panel portfolio elements
5. Update navigation flows
6. Test across all game phases

**Deliverable:** Clean Player Panel with redistributed information.

---

### Phase 5: Edge Cases & Polish (Week 3)
**Goal:** Handle all identified edge cases

**Tasks:**
1. Verify Try Again state reset behavior
2. Test complex ChoiceEffect cards (3+ choices)
3. Ensure End Turn never hidden
4. Verify accessibility (screen reader, keyboard nav)
5. Performance optimization (re-render reduction)
6. Cross-browser testing

**Deliverable:** Production-ready UI with all edge cases handled.

---

### Phase 6: Documentation & Rollout (Week 3-4)
**Goal:** Document and deploy

**Tasks:**
1. Update component documentation
2. Create user guide for new UI
3. Update E2E test suite
4. Code review + QA testing
5. Deploy to staging
6. User acceptance testing
7. Production deployment

**Deliverable:** New UI live in production with full documentation.

---

# Part 3: Technical Debt

## From: docs/project/TECHNICAL_DEBT.md

# Technical Debt Log

This document tracks identified technical debt in the `code2027` codebase.

## High Priority Refactoring Candidates

- **TurnService.ts (2,421 lines)**
  - **Suggestion:** Could be split into smaller, more focused services (e.g., TurnPhaseService, EffectProcessingService, TurnValidationService).
  - **Impact:** High - central service, complex logic.
  - **Risk:** High - touches many systems.

- **EffectEngineService.ts (1,589 lines)**
  - **Suggestion:** Could be split into smaller services based on effect types.
  - **Impact:** High - central service for game logic.
  - **Risk:** Medium - can be refactored incrementally.

---

## In Progress

### `usedTryAgain` Flag in Player State
- **Status**: 🟡 In Progress (Refactor underway)
- **Description**: The "Try Again" feature was implemented using a persistent `usedTryAgain` boolean flag on the core `Player` state object. This proved to be a brittle, bug-prone pattern, as it required multiple, disparate functions (`rollDiceWithFeedback`, `handleAutomaticFunding`, etc.) to remember to manually clear the flag.
- **Impact**: This led to inconsistent state management, duplicate code, and hard-to-trace bugs where the flag was not cleared in all code paths (e.g., `triggerManualEffectWithFeedback`).
- **Resolution**: The flag is being removed from the core data model. The logic is being refactored to use a short-lived, ephemeral state variable in the `GameLayout.tsx` UI component, which passes a `skipAutoMove` parameter to the `endTurnWithMovement` function. This correctly separates UI state from core game state.

---

# Part 4: IPC System Roadmap

## From: claude-ipc-mcp/docs/ROADMAP.md

# Claude IPC MCP Roadmap

## Current Architecture Status

### Full MCP Support for Multiple Platforms

**Current Situation:**
- Google Gemini CLI now has native MCP support and can be the server/broker
- Claude Code, Gemini CLI, and any MCP-enabled AI can participate equally
- First AI to start becomes the broker - purely democratic election
- Python client scripts in `tools/` remain available as a fallback option

**Capabilities:**
- Gemini CLI with MCP can become the server/broker
- All MCP-enabled AIs participate in the democratic server model
- Non-MCP AIs can still connect using Python client scripts
- Full platform equality - no AI has special privileges

**Compatibility Note:**
- The v2.0.0 security updates work with all connection methods
- Both MCP and Python script approaches are supported
- All clients benefit from server-side security improvements

## Future Enhancements

### 1. Standalone Server Mode for Non-MCP Environments (v2.1.0)
- Create a standalone server script for environments without MCP support
- `tools/ipc_server.py` - dedicated broker for legacy systems
- Enable IPC in restricted environments or older AI platforms
- Estimated release: Q2 2025

### 2. Universal AI Adapter (v3.0.0)
- Plugin system for different AI platforms
- Native support for:
  - Google Gemini
  - OpenAI GPTs
  - Anthropic Claude (non-MCP)
  - Local LLMs (Ollama, etc.)
- Each AI type can become a server
- Estimated release: Q3 2025

### 3. Multi-Network Support (v3.1.0)
- Run multiple IPC networks on different ports
- Network isolation for security
- Bridge between networks
- Estimated release: Q4 2025

## Recently Completed

### v2.0.0 - Security & Persistence ✅
- SQLite message persistence
- Comprehensive security hardening
- Professional security audit passed
- UV package manager support

### v1.1.0 - Core Features ✅
- Session-based authentication
- Natural language commands
- Auto-check functionality
- Large message support

---

# Part 5: Completed Milestones

## From: docs/project/HANDOVER_REPORT.md & docs/project/PROJECT_SCOPE_REFACTORING_COMPLETE.md

## Project Scope Refactoring (November 5, 2025)

*   **Objective:** Refactored all project scope calculations to use a single source of truth: `GameRulesService.calculateProjectScope()`.
*   **Outcome:** Eliminated 4 different calculation methods, fixed the MovementService's incorrect $500k assumption, and deprecated the stale cached `player.projectScope` field. All 69 related tests are now passing.

## Production Readiness (October 3, 2025)

*   **Objective:** The core game was declared feature-complete and production-ready.
*   **Details:**
    *   **Development Phase Completion:**
        *   **Phase 1: Services Foundation (Completed: August-September 2025):** 6 core services implemented, DI architecture, >90% test coverage.
        *   **Phase 2: Game Transformation (Completed: September 2025):** Phase-Restricted Card System, Duration-Based Card Effects, Multi-Player Interactive Effects.
        *   **Phase 3: Infrastructure & Polish (Completed: September 2025):** Performance Optimization (75-85% improvement), Component Library, Base Service Class.
    *   **Test Suite Status:** 617 tests passing (100% success rate), 0 tests failing, 0 tests skipped.

---

# Part 6: Maintenance Process

This roadmap will be reviewed and updated at the end of every session to ensure it remains an accurate reflection of the project's status and priorities.