# Starting Prompt for Code2027 CSV Restructure Project

Copy and paste this comprehensive prompt when starting a new Claude session for the code2027 CSV restructure project:

---

**COMPREHENSIVE PROJECT STARTUP PROMPT:**

I'm working on a critical CSV data restructure project for a board game located at `/mnt/d/unravel/current_game/code2027/`. This project is designed to eliminate 4 months of debugging issues caused by messy, multi-purpose CSV files.

## **Essential Reading (Read These First):**
1. `/mnt/d/unravel/current_game/code2027/CLAUDE.md` - **Complete project boundaries, constraints, and specifications**
2. `/mnt/d/unravel/current_game/code2027/CSV_RESTRUCTURE_PLAN.md` - **Detailed restructure architecture and examples**
3. `/mnt/d/unravel/current_game/code2027/INTEGRATION_GUIDE.md` - **JavaScript integration patterns**
4. `/mnt/d/unravel/current_game/code2027/MIGRATION_PLAN.md` - **Step-by-step implementation process**

## **Project Context:**
- **Base Game**: Working board game implementation at code2026 (don't touch this)
- **This Project**: Pure CSV data restructure and integration preparation
- **Critical Constraint**: **ZERO DATA LOSS** - Every piece of information must be preserved
- **Scope**: Data architecture only - **NO JavaScript changes in this project**

## **Source Files (Current Problem):**
```
data/SOURCE_FILES/
├── Spaces.csv              # 22 mixed columns causing parsing nightmares
└── DiceRoll Info.csv       # Inconsistent data types across rows
```

**Why These Are Problematic:**
- Movement logic mixed with card effects and story text
- Multiple data types in same columns ("Draw 3", "8%", "PM-DECISION-CHECK")  
- Complex conditional parsing: `"Draw 1 if scope ≤ $ 4 M"`
- Debugging takes hours due to mixed concerns
- Adding new content requires touching multiple systems

## **Target Architecture (Clean Solution):**
```
data/CLEAN_FILES/
├── MOVEMENT.csv            # Pure space-to-space connections
├── DICE_OUTCOMES.csv       # Dice roll destinations only  
├── SPACE_EFFECTS.csv       # Card/time/money effects with structured conditions
├── DICE_EFFECTS.csv        # Dice-based effects (separate from outcomes)
├── SPACE_CONTENT.csv       # UI display text and story content
└── GAME_CONFIG.csv         # Metadata, phases, game configuration
```

## **Your Mission:**
**Extract and restructure data from the 2 messy source files into 6 clean, single-purpose CSV files.**

### **Critical Requirements:**
- ✅ **Zero Data Loss**: Every piece of information must be preserved exactly
- ✅ **Exact Value Preservation**: Keep space names, visit types, card values identical
- ✅ **Single Responsibility**: Each CSV has one clear, focused purpose
- ✅ **Consistent Data Types**: No mixed data within columns
- ✅ **Validation Required**: Use provided Python script to verify integrity
- ❌ **No JavaScript Changes**: This is pure data restructuring only

### **Start Here - First Session Workflow:**

**Step 1: Examine Source Data**
```bash
# Navigate to project
cd /mnt/d/unravel/current_game/code2027

# Examine the problematic source files
head -10 data/SOURCE_FILES/Spaces.csv
head -10 data/SOURCE_FILES/"DiceRoll Info.csv"
```

**Step 2: Begin with Movement Data**
Start by extracting pure movement logic from Spaces.csv columns (space_1, space_2, space_3, space_4, space_5) into MOVEMENT.csv. This is the foundation - get movement working first.

**Step 3: Validate Early and Often**
```bash
# After creating each file, validate immediately
python data/VALIDATION/validate_data.py
```

## **Working Examples Available:**
- `CODE_EXAMPLES.js` - Complete JavaScript integration patterns
- All documentation files contain detailed examples
- Validation script provides immediate feedback

## **Expected Approach:**
1. **Read CLAUDE.md thoroughly** - Understand project boundaries and constraints
2. **Analyze source CSV structure** - Understand current data organization  
3. **Extract movement data first** - Create MOVEMENT.csv (foundation)
4. **Work systematically** - One target file at a time
5. **Validate continuously** - Check data integrity after each step
6. **Document any ambiguities** - Ask questions rather than make assumptions

## **Success Criteria:**
- All 6 clean CSV files created with proper structure
- Python validation script passes with zero data loss
- Clear documentation of any transformations made
- Ready for JavaScript integration (but don't implement it)

## **Key Files for Reference:**
- **Project Rules**: `CLAUDE.md`
- **Architecture Spec**: `CSV_RESTRUCTURE_PLAN.md`  
- **Integration Examples**: `INTEGRATION_GUIDE.md`
- **Implementation Process**: `MIGRATION_PLAN.md`
- **Validation Tool**: `data/VALIDATION/validate_data.py`

**Start by reading CLAUDE.md to understand the full project scope, then examine the source files to understand what you're working with. Focus on data extraction and restructuring - this is the foundation that will eliminate months of debugging issues in the game implementation.**

---

**This prompt provides everything needed to start the CSV restructure project with full context and clear direction.**