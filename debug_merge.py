#!/usr/bin/env python3

import csv
import os

# Paths
code2026_cards = '/mnt/d/unravel/current_game/code2026/game/data/cards.csv'
code2027_cards_backup = '/mnt/d/unravel/current_game/code2027/public/data/CLEAN_FILES/CARDS_EXPANDED_BACKUP.csv'

# Read code2026 cards to get work_type_restriction data (column 10, index 9)
work_types = {}
with open(code2026_cards, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)  # Skip header
    print("Code2026 header:")
    for i, col in enumerate(header):
        print(f"  {i}: {col}")
    print()
    
    for row_num, row in enumerate(reader):
        if len(row) > 9 and row[0]:  # Ensure we have enough columns and card_id exists
            card_id = row[0]
            work_type = row[9] if len(row) > 9 else ''  # work_type_restriction is column 10 (index 9)
            work_types[card_id] = work_type
            if row_num < 5 or card_id.startswith('W00'):  # Show first few and some W cards
                print(f"Card {card_id}: work_type='{work_type}' (from column {9})")

print(f"\nLoaded work types for {len(work_types)} cards from code2026")

# Check a few specific cards
test_cards = ['W001', 'W025', 'B001']
for card_id in test_cards:
    if card_id in work_types:
        print(f"  {card_id}: '{work_types[card_id]}'")
    else:
        print(f"  {card_id}: NOT FOUND")