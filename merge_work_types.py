#!/usr/bin/env python3

import csv
import os

# Paths
code2026_cards = '/mnt/d/unravel/current_game/code2026/game/data/cards.csv'
code2027_cards = '/mnt/d/unravel/current_game/code2027/public/data/CLEAN_FILES/CARDS_EXPANDED.csv'
output_file = '/mnt/d/unravel/current_game/code2027/public/data/CLEAN_FILES/CARDS_EXPANDED_WITH_WORK_TYPES.csv'

# Read code2026 cards to get work_type_restriction data (column 10, index 9)
work_types = {}
with open(code2026_cards, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)  # Skip header
    for row in reader:
        if len(row) > 9 and row[0]:  # Ensure we have enough columns and card_id exists
            card_id = row[0]
            work_type = row[9] if len(row) > 9 else ''  # work_type_restriction is column 10 (index 9)
            work_types[card_id] = work_type

print(f"Loaded work types for {len(work_types)} cards from code2026")

# Read code2027 cards and append work_type_restriction column
with open(code2027_cards, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    
    # Add work_type_restriction to header
    new_header = header + ['work_type_restriction']
    
    # Prepare output data
    output_data = [new_header]
    
    for row in reader:
        if len(row) > 0 and row[0]:  # Ensure card_id exists
            card_id = row[0]
            work_type = work_types.get(card_id, '')  # Get work type or empty string
            new_row = row + [work_type]
            output_data.append(new_row)
        else:
            # Handle empty rows
            new_row = row + ['']
            output_data.append(new_row)

# Write the merged data
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerows(output_data)

print(f"Created {output_file} with work_type_restriction column added")

# Show some examples of the work types added
print("\nSample work types added:")
sample_count = 0
for card_id, work_type in work_types.items():
    if work_type and sample_count < 10:
        print(f"  {card_id}: {work_type}")
        sample_count += 1
    if sample_count >= 10:
        break