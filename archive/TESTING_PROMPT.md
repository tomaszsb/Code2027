# Testing Prompt for Clean CSV Architecture

Copy and paste this prompt when starting a new Claude session to test and validate the clean CSV architecture:

---

**COMPREHENSIVE TESTING & VALIDATION PROMPT:**

I need to test and validate a completed clean CSV architecture system for a board game. The project is located at `/mnt/d/unravel/current_game/code2027/`.

## **Background Context:**
This project has restructured messy CSV files into a clean 6-file architecture with complete JavaScript integration. The data extraction and JavaScript engines are built, but I need to thoroughly test everything to ensure it works correctly.

## **Read These Files First to Understand the System:**
1. `/mnt/d/unravel/current_game/code2027/CLAUDE.md` - Complete project overview and architecture
2. `/mnt/d/unravel/current_game/code2027/index.html` - Test interface (scan to understand what should work)

## **Current System Status:**
- ✅ **6 Clean CSV Files**: Located in `data/CLEAN_FILES/` (306 total rows from 109 source rows)
- ✅ **JavaScript Architecture**: Complete with CSVDatabase, MovementEngine, EffectsEngine, ContentEngine, GameManager
- ✅ **Test Interface**: Working HTML page with interactive testing
- ❓ **Unknown**: Whether the system actually works correctly with real data

## **Your Mission: Comprehensive Testing & Validation**

### **Phase 1: Data Integrity Validation**
1. **Load and verify** all 6 clean CSV files contain expected data
2. **Cross-reference** with source files to ensure zero data loss
3. **Validate data structure** - check that columns match expected format
4. **Run provided validation script**: `python data/VALIDATION/validate_data.py`

### **Phase 2: JavaScript System Testing**
1. **Start test server**: `cd /mnt/d/unravel/current_game/code2027 && python -m http.server 8000`
2. **Open test interface**: `http://localhost:8000/index.html`
3. **Test system initialization**: Click "Initialize Game System"
4. **Test all major functions**:
   - CSV database loading
   - Movement engine operations
   - Effects engine processing
   - Content engine queries
   - Game manager coordination

### **Phase 3: End-to-End Game Flow Testing**
1. **Create test player** and verify player state management
2. **Test complete turn processing** at multiple spaces
3. **Test all movement types**: fixed, choice, dice, automatic
4. **Test effects application**: time, money, cards
5. **Test content display** and space information
6. **Test data validation** and error handling

### **Phase 4: Integration & Performance Testing**
1. **Test with debug mode** enabled to verify logging
2. **Test error scenarios** (missing data, invalid inputs)
3. **Performance check** - loading times, query speed
4. **Memory usage** - check for leaks during extended testing

## **Expected Deliverables:**

### **Testing Report:**
```markdown
# Clean CSV Architecture Testing Report

## Data Integrity Results
- [ ] All 6 CSV files load correctly
- [ ] Zero data loss from source files
- [ ] Data structure validation passes
- [ ] Python validation script passes

## JavaScript System Results  
- [ ] CSVDatabase loads all files
- [ ] MovementEngine processes all movement types
- [ ] EffectsEngine applies effects correctly
- [ ] ContentEngine displays content properly
- [ ] GameManager coordinates systems successfully

## End-to-End Game Flow Results
- [ ] Player creation and state management
- [ ] Complete turn processing
- [ ] Movement execution (all types)
- [ ] Effects application (time/money/cards)
- [ ] Content display and UI integration

## Issues Found
[List any bugs, data problems, or integration issues]

## Performance & Quality
- Load time: [X]ms
- Memory usage: [Normal/High]
- Debug logging: [Functional/Issues]
- Error handling: [Robust/Needs work]

## Recommendations
[Suggestions for improvements or fixes needed]
```

### **Issue Resolution:**
- **Fix any data integrity problems** in CSV files
- **Debug JavaScript integration issues** 
- **Improve error handling** where needed
- **Optimize performance** if issues found

## **Success Criteria:**
- ✅ All CSV files load without errors
- ✅ All game mechanics work identically to original system
- ✅ Zero data loss validated
- ✅ Complete game turns process successfully
- ✅ All movement types function correctly
- ✅ Effects apply properly to player state
- ✅ Content displays correctly in UI
- ✅ System handles errors gracefully

## **Key Files to Focus On:**
- **CSV Files**: `data/CLEAN_FILES/*.csv` - Verify data integrity
- **Database**: `js/data/CSVDatabase.js` - Test loading and queries
- **Engines**: `js/utils/*.js` - Test all engine operations
- **Game Manager**: `js/components/GameManager.js` - Test coordination
- **Test Interface**: `index.html` - Use for interactive testing

## **Debugging Resources:**
- **Browser Console**: Enable debug mode for detailed logging
- **Validation Script**: Python script provides data integrity checking
- **Test Interface**: Interactive UI for manual testing
- **Documentation**: CLAUDE.md contains usage examples

**Start by opening the test interface and working through each system methodically. Focus on finding any data inconsistencies or JavaScript integration problems.**

---

**This prompt provides everything needed to thoroughly test the clean CSV architecture and identify any issues that need resolution.**