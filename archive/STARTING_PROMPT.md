# Starting Prompt for CSV Restructure Project

Copy and paste this prompt when starting a new Claude session for the CSV restructure project:

---

**PROMPT START:**

I'm working on a CSV data restructure project for a board game. The project is located at `/mnt/d/unravel/current_game/code2027/`.

**Background**: I have two messy CSV files (Spaces.csv with 22 mixed columns, DiceRoll Info.csv with inconsistent data types) that have been causing 4 months of debugging issues. I need to restructure them into 6 clean, single-purpose CSV files.

**Read these files first to understand the project:**
1. `/mnt/d/unravel/current_game/code2027/CLAUDE.md` - Project boundaries and guidelines
2. `/mnt/d/unravel/current_game/code2027/CSV_RESTRUCTURE_PLAN.md` - Complete restructure specification

**Source files to work with:**
- `/mnt/d/unravel/current_game/code2027/data/SOURCE_FILES/Spaces.csv`
- `/mnt/d/unravel/current_game/code2027/data/SOURCE_FILES/DiceRoll Info.csv`

**Target: Create these 6 clean CSV files in `/mnt/d/unravel/current_game/code2027/data/CLEAN_FILES/`:**
1. `MOVEMENT.csv` - Pure space-to-space connections
2. `DICE_OUTCOMES.csv` - Dice roll destinations  
3. `SPACE_EFFECTS.csv` - Card/time/money effects
4. `DICE_EFFECTS.csv` - Dice-based effects
5. `SPACE_CONTENT.csv` - UI display content
6. `GAME_CONFIG.csv` - Metadata & configuration

**Key Requirements:**
- ✅ **Zero data loss** - Every piece of information must be preserved
- ✅ **Clean data types** - Consistent column types, no mixed data
- ✅ **Single responsibility** - Each CSV has one clear purpose
- ✅ **Preserve existing values** - Keep space names, visit types exactly as-is
- ❌ **No JavaScript changes** - This is pure data restructuring only

**Start by examining the source files and begin with extracting movement data into MOVEMENT.csv. Work systematically through each target file, validating data integrity at each step.**

**PROMPT END**

---

This prompt gives Claude everything needed to start the CSV restructure project efficiently.