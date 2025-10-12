# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Features
- **Player Panel UI Refactor (October 12, 2025):**
  - Replaced the static player panel with a dynamic, component-based system using a new `ExpandableSection` component.
  - Implemented a three-column header layout (Title, Actions, Summary) for all panel sections to improve information density and usability on all screen sizes.
  - Action buttons are now centered in the header and always visible.
  - Section summary text is now right-aligned for better readability.
  - Implemented an "exclusive accordion" for the Cards section, where opening one card type collapses others.
  - Iteratively refined UI spacing and button padding based on user feedback for a tighter, more compact design.

### Bug Fixes
- **Critical `End Turn` Bug (October 12, 2025):**
  - Fixed a game-breaking bug where the "End Turn" button was calling the wrong service method (`endTurn` instead of `endTurnWithMovement`), preventing the game from advancing to the next player.
