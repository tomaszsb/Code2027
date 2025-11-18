# Code2027 - Player Panel UI User Guide

**Version:** 2.0 (Mobile-First Redesign)
**Last Updated:** November 18, 2025
**Status:** Production Ready

---

## Overview

The Player Panel has been redesigned with a mobile-first approach to improve usability on all devices. This guide explains how to use the new interface effectively.

---

## Key Features

### 🎯 Mobile-Optimized Layout
- **Collapsible Sections**: Tap section headers to expand/collapse
- **Action Indicators**: Red dots (🔴) show when actions are available
- **Persistent Next Step Button**: Always accessible in bottom-right corner
- **Clean Design**: Important information is never more than one tap away

### 📱 Responsive Design
- **Mobile (<768px)**: Sections start collapsed to save space
- **Desktop (≥768px)**: Sections with actions auto-expand for quick access
- **Touch-Friendly**: Large tap targets for mobile devices

---

## Player Panel Sections

### 1. On This Space (Current Card Section)

**What it shows:**
- Content from your current board space
- Story text and action descriptions
- Available choices (Accept, Reject, Negotiate, etc.)

**How to use:**
- **Expand**: Tap the section header to read full space content
- **Make Choices**: Tap choice buttons (Accept/Reject/Negotiate)
- **Loading**: Buttons show "Processing..." while choice resolves
- **Errors**: If something goes wrong, you'll see an error message with retry option

**Visual Cues:**
- 🔴 Red dot when choices are available
- Section defaults to expanded on desktop
- Choice buttons use color coding:
  - **Blue (Accept/Yes)**: Primary positive choice
  - **Red (Reject/No)**: Negative or risky choice
  - **Gray (Negotiate/Maybe)**: Neutral or secondary choice

---

### 2. Project Scope Section

**What it shows:**
- Current project scope value
- Target scope (if applicable)
- Roll for Scope action (when available)

**How to use:**
- **Expand**: Tap to see detailed scope information
- **Roll for Scope**: Tap button when available to gain scope
- **Track Progress**: Monitor your scope against requirements

**Visual Cues:**
- 🔴 Red dot when Roll for Scope is available

---

### 3. Finances Section

**What it shows:**
- Current money balance
- Surplus (money after costs paid)
- Roll for Money action (when available)

**How to use:**
- **Expand**: Tap to see financial details
- **Roll for Money**: Tap button when available to gain funds
- **Monitor**: Keep track of your financial health

**Visual Cues:**
- 🔴 Red dot when Roll for Money is available
- Money values formatted with commas (e.g., $1,000)

---

### 4. Time Section

**What it shows:**
- Time cost for current action
- Elapsed time so far
- Roll for Time action (when available)

**How to use:**
- **Expand**: Tap to see time breakdown
- **Roll for Time**: Tap button when available to reduce time

**Visual Cues:**
- 🔴 Red dot when Roll for Time is available

---

### 5. Cards Section

**What it shows:**
- Number of cards in hand
- Card type breakdown (W, B, E, L, I)
- Roll for Cards actions (when available)
- View Discarded button

**How to use:**
- **Expand**: Tap to see full card details
- **Roll for W/B Cards**: Tap buttons to draw specific card types
- **View Discarded**: Tap to see all cards you've discarded
- **Play Cards**: Use the card modal system (separate from panel)

**Visual Cues:**
- 🔴 Red dot when Roll for Cards is available
- "View Discarded" always visible as secondary action

---

### 6. Next Step Button

**Location:** Fixed in bottom-right corner

**What it shows:**
- **"End Turn"**: When all required actions are complete
- **"End Turn (X actions remaining)"**: When actions are incomplete (disabled)
- **"Processing..."**: During turn processing

**How to use:**
- **Ready to End Turn**: Button is blue and clickable
- **Actions Remaining**: Button is gray and shows how many actions needed
- **Pending Choice**: Button is disabled until you make a choice

**Visual Cues:**
- Always visible during your turn
- Hidden during other players' turns
- Tooltip on hover explains why button is disabled

---

## Top Banner (Progress Overview)

**What it shows:**
- Overall project progress (all players)
- Current game phase
- Leading phase indicator
- Player progress bars
- Current turn indicator

**Buttons:**
- **📋 Rules**: Opens game rules modal
- **📜 Log**: Opens game action log

**How to use:**
- Check overall game progress at a glance
- See which phase each player is in
- Track current player's turn and location

---

## Movement System

### Making Movement Choices

When you roll dice and get movement options:

1. **Movement Destinations Appear** in a highlighted section
2. **Select Your Destination** by tapping a destination button
3. **Confirm Choice** by clicking "End Turn"
4. **Change Selection** anytime before ending turn

**Visual Cues:**
- Selected destination shows checkmark
- Can change selection multiple times
- Movement doesn't execute until you click "End Turn"

---

## Error Handling

### What Happens if Something Goes Wrong?

**Component-Level Errors:**
- Section shows error message in red
- "Retry" button appears to try action again
- Error messages explain what went wrong

**Application-Level Errors:**
- Error boundary catches crashes
- Shows friendly "Something went wrong" screen
- Reload button to restart game
- Dev mode shows error details for debugging

**Error Message Format:**
- ❌ Icon indicates error
- Clear explanation of problem
- Suggestions for how to fix it

---

## Keyboard Navigation

### Accessibility Features

**Tab Order:**
1. Section headers (expandable sections)
2. Action buttons within expanded sections
3. Next Step Button

**Keyboard Shortcuts:**
- **Tab**: Move to next element
- **Shift+Tab**: Move to previous element
- **Enter/Space**: Activate buttons and expand sections
- **Escape**: Collapse focused section

**Screen Reader Support:**
- All buttons have descriptive labels
- Section expand/collapse announced
- Action availability announced
- Error messages read aloud

---

## Tips for Best Experience

### Mobile Users
1. **One-Handed Mode**: Next Step Button is positioned for thumb reach
2. **Expand Smartly**: Only expand sections you need to see
3. **Use Indicators**: Red dots show where actions are available
4. **Landscape Mode**: More space for sections if needed

### Desktop Users
1. **Multi-Task**: Sections auto-expand so you can see everything
2. **Hover Tooltips**: Hover over disabled buttons to see why
3. **Quick Scanning**: Progress bar at top shows overall status
4. **Rules Access**: Rules button always visible in top banner

---

## Common Workflows

### Taking Your Turn

1. **Check Progress Bar**: See whose turn it is
2. **Look for Red Dots**: Find sections with available actions
3. **Complete Actions**: Roll dice, draw cards, make choices
4. **Watch Next Step Button**: It will enable when ready
5. **End Turn**: Click "End Turn" to pass to next player

### Making a Choice (e.g., Accept/Reject)

1. **Expand "On This Space"**: Read the full story
2. **Review Options**: See all available choices
3. **Consider Outcomes**: Read potential outcomes
4. **Select Choice**: Tap your preferred option
5. **Wait for Processing**: Button shows "Processing..."
6. **Result Appears**: New content appears or turn advances

### Drawing Cards

1. **Expand Cards Section**: Check your current hand
2. **Look for Roll Buttons**: Red dot if available
3. **Select Card Type**: Choose W or B cards
4. **Confirm Draw**: Cards added to hand automatically
5. **View Discarded**: Check discarded cards anytime

---

## Troubleshooting

### "End Turn button is disabled"
- **Check**: Do you have actions remaining?
- **Solution**: Look for red dots, complete required actions
- **Tooltip**: Hover to see exactly what's needed

### "I can't find an action"
- **Check**: Is the section expanded?
- **Solution**: Look for red dots, expand those sections
- **Mobile**: Swipe down to see all sections

### "Error message appeared"
- **Check**: What does the error say?
- **Solution**: Follow the error message suggestions
- **Retry**: Use the Retry button if available
- **Last Resort**: Reload the page (progress may be saved)

### "Section won't expand"
- **Check**: Did you tap the header?
- **Solution**: Tap the entire header area (not just icon)
- **Mobile**: Ensure touch registered (try again)

---

## What's New in v2.0?

### Improvements from Old UI
✅ **Mobile-first design** - Optimized for small screens
✅ **Action indicators** - Red dots show where to act
✅ **Persistent Next Step** - Always know what's next
✅ **Better error handling** - Clear error messages
✅ **Loading states** - Visual feedback during operations
✅ **Cleaner layout** - Less clutter, better organization
✅ **Accessibility** - Keyboard and screen reader support

### Removed Features
❌ **Inline End Turn** - Now in persistent button
❌ **Scattered actions** - Consolidated in sections
❌ **Old portfolio view** - Replaced with Cards Section

---

## Feedback & Support

**Found a bug?** Report it on GitHub: [github.com/tomaszsb/Code2027/issues](https://github.com/tomaszsb/Code2027/issues)

**Have a suggestion?** We're always improving! Let us know what would make your experience better.

---

**Thank you for playing Code2027!** 🎲🚀
