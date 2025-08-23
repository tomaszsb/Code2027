# Data File Structure

## CSV Data Files Location
All game data files are stored in `/public/data/CLEAN_FILES/`:

- `CARDS.csv` - Card definitions with types W, B, E, L, I
- `DICE_EFFECTS.csv` - Effects triggered by dice rolls
- `DICE_OUTCOMES.csv` - Dice roll to destination mapping
- `GAME_CONFIG.csv` - Game configuration and space metadata
- `MOVEMENT.csv` - Space-to-space movement rules
- `SPACE_CONTENT.csv` - UI text and story content
- `SPACE_EFFECTS.csv` - Effects applied when landing on spaces

## Why Public Directory?
The Vite development server serves static files from the `/public` directory. When the DataService fetches `/data/CLEAN_FILES/CARDS.csv`, it maps to `/public/data/CLEAN_FILES/CARDS.csv`.

## Single Source of Truth
- ✅ **Only one location**: `/public/data/CLEAN_FILES/`
- ❌ **Removed redundant copies**: `/data/CLEAN_FILES/` and `/dist/data/`
- 🎯 **Result**: No more confusion about which file to edit

## Editing Data Files
To modify game data:
1. Edit files in `/public/data/CLEAN_FILES/`
2. Refresh browser (cache busting is enabled)
3. Changes take effect immediately

## Build Process
During `npm run build`, files are copied from `/public` to `/dist` automatically.