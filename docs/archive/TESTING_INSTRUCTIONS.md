# Testing Instructions for Movement Fix

## Step 1: Pull Latest Code

```bash
git checkout claude/movement-polish-011CUqGxAsjrNrnF61kG9xnB
git pull origin claude/movement-polish-011CUqGxAsjrNrnF61kG9xnB
```

This gets you the Python scripts and code changes.

---

## Step 2: Generate CSV Data Files

The `/public` directory is gitignored, so you need to generate the CSV files locally.

```bash
cd data

# Generate all game data files (takes ~2 seconds)
python3 fix_all_movements.py
python3 process_remaining_files.py
python3 convert_cards_expanded.py
```

**Expected output:**
```
✓ Created MOVEMENT.csv with 54 movement entries
  - 18 spaces use dice-based movement
✓ Created DICE_OUTCOMES.csv with 18 dice outcome entries

✓ Created GAME_CONFIG.csv with 27 game config entries
✓ Created SPACE_CONTENT.csv with 54 space content entries
✓ Created SPACE_EFFECTS.csv with 45 space effect entries
✓ Created DICE_EFFECTS.csv (basic structure)

Converted 404 cards
  B: 62, E: 75, I: 40, L: 50, W: 177
```

---

## Step 3: Verify Files Were Created

```bash
ls -lh public/data/CLEAN_FILES/
```

**You should see 7 files:**
```
CARDS_EXPANDED.csv    (~76KB)
DICE_EFFECTS.csv      (~87 bytes)
DICE_OUTCOMES.csv     (~2.7KB)
GAME_CONFIG.csv       (~1.4KB)
MOVEMENT.csv          (~3.8KB)
SPACE_CONTENT.csv     (~13KB)
SPACE_EFFECTS.csv     (~3.5KB)
```

---

## Step 4: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Step 5: Hard Refresh Browser

**In your browser with game open:**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

This clears cached CSV files.

---

## Step 6: Test ARCH-INITIATION

1. Navigate to ARCH-INITIATION (First visit)
2. **Expected behavior:**
   - Should see destination: ARCH-FEE-REVIEW
   - Movement should work
   - Console should show: `🎯 BOARD: Player has 1 valid moves: ['ARCH-FEE-REVIEW']`

---

## Step 7: Test Other Spaces

Navigate through these spaces to verify all movements work:

### Critical Spaces to Test:
- ✅ ARCH-INITIATION (First) → should go to ARCH-FEE-REVIEW
- ✅ ARCH-INITIATION (Subsequent) → should roll dice, get choices
- ✅ CHEAT-BYPASS → should roll dice, 6 destinations
- ✅ CON-INSPECT → should roll dice
- ✅ CON-ISSUES → should roll dice
- ✅ REG-DOB-FINAL-REVIEW → should roll dice (can FINISH)
- ✅ REG-FDNY-PLAN-EXAM → should roll dice with 4-way choices

---

## Troubleshooting

### If you still see "0 valid moves":

1. **Check browser console** (F12) for errors
2. **Verify files exist:**
   ```bash
   ls public/data/CLEAN_FILES/ | wc -l
   # Should show: 7
   ```

3. **Check file sizes aren't 0:**
   ```bash
   ls -lh public/data/CLEAN_FILES/
   # All should have size > 0
   ```

4. **Try clearing browser cache completely:**
   - Chrome: Settings → Privacy → Clear browsing data → Cached files
   - Firefox: Settings → Privacy → Clear Data → Cache

5. **Check DataService loading:**
   - Open browser console
   - Look for "Failed to fetch" errors
   - Should see no errors on page load

---

## Quick Test Script

Run this to verify everything:

```bash
cd /home/user/Code2027

# Check we have the Python scripts
ls data/*.py

# Generate all data
cd data
python3 fix_all_movements.py
python3 process_remaining_files.py
python3 convert_cards_expanded.py
cd ..

# Verify output
echo "Checking generated files..."
ls -lh public/data/CLEAN_FILES/

echo "Done! Now restart your dev server and hard refresh browser."
```
