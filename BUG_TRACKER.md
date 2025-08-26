# Bug Tracker

This document tracks known bugs and issues for the `code2027` project.

---

### BUG-001: Single Target Choice Does Not Auto-Resolve

*   **ID:** `BUG-001`
*   **Severity:** `Low`
*   **Status:** `Open`
*   **Description:** When a targeted effect has only one possible valid target (e.g., a 2-player game and a card targets 'other_player'), the system still presents a choice to the user rather than auto-resolving.
*   **Steps to Reproduce:**
    1. Start a 2-player game.
    2. Have one player use an effect that targets 'OTHER_PLAYER_CHOICE'.
*   **Expected Result:** The effect should be automatically applied to the only valid target.
*   **Actual Result:** The `ChoiceService` is invoked, and the user is presented with a choice that has only one option.
*   **Notes:** This is a non-critical UX refinement. The system remains stable and does not crash.
