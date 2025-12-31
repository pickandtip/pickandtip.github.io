#!/usr/bin/env python3
"""
Generate Review File for Standalone Notes
==========================================
This script generates a review file listing all countries with standalone notes
that need manual categorization into propertyTaxNotes, transferTaxNotes, or countryGeneralNotes.
"""

import json
import re
import sys
from pathlib import Path

def generate_review_file(input_file, output_file):
    """
    Generate a review file for manual note categorization.

    Args:
        input_file: Path to property-taxes.json
        output_file: Path to output review file
    """
    print("=" * 70)
    print("GENERATING REVIEW FILE FOR STANDALONE NOTES")
    print("=" * 70)
    print(f"Input file:  {input_file}")
    print(f"Output file: {output_file}")
    print()

    # Read input file
    print("📖 Reading input file...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    review_data = []

    print("🔍 Analyzing standalone notes...")

    for country in data['countries']:
        code = country['countryCode']

        notes_fr = country['notes'].get('fr', '')
        notes_en = country['notes'].get('en', '')

        # Check for standalone notes before Foreign Access section
        for lang, notes in [('fr', notes_fr), ('en', notes_en)]:
            if not notes:
                continue

            # Extract text before 'Foreign access:' or 'Accès étrangers:'
            match = re.match(r'^(.*?)\s*(?:Accès étrangers?:|Foreign access:)', notes, re.IGNORECASE | re.DOTALL)

            if match:
                text_before = match.group(1).strip()

                # Check if this text is substantial and not already a proper section
                if text_before and len(text_before) > 5:
                    # Skip if already starts with a section header
                    if not re.match(r'^(Taxe foncière annuelle:|Annual property tax:|Taxe de transfert:|Transfer tax:)', text_before, re.IGNORECASE):

                        # Try to suggest categorization based on keywords
                        suggestions = []

                        # Keywords for property tax
                        if re.search(r'(taxe foncière|property tax|rates|impuesto predial|imu|ibi|grundsteuer|kotei shisan|taxe.*annuelle)', text_before, re.IGNORECASE):
                            suggestions.append('propertyTaxNotes')

                        # Keywords for transfer tax
                        if re.search(r'(transfert|transfer|mutation|stamp duty|droits?(?! foncière)|frais.*achat|grunderwerbsteuer|à l\'achat)', text_before, re.IGNORECASE):
                            suggestions.append('transferTaxNotes')

                        # If no clear categorization or multiple, suggest general
                        if not suggestions or len(suggestions) > 1:
                            suggestion = 'REVIEW_NEEDED (contains both or unclear)'
                        else:
                            suggestion = suggestions[0]

                        review_data.append({
                            'countryCode': code,
                            'lang': lang.upper(),
                            'currentNotes': text_before,
                            'suggestion': suggestion,
                            'INSTRUCTIONS': 'Split the text below into the appropriate fields. Leave empty if not applicable.',
                            'propertyTaxNotes': '',
                            'transferTaxNotes': '',
                            'countryGeneralNotes': ''
                        })

    # Write review file
    print(f"💾 Writing review file ({len(review_data)} items)...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(review_data, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 70)
    print("REVIEW FILE GENERATED")
    print("=" * 70)
    print(f"Total items to review: {len(review_data)}")
    print()
    print("Next steps:")
    print("1. Open the review file in a text editor")
    print("2. For each item, split 'currentNotes' into appropriate fields:")
    print("   - propertyTaxNotes: Info about annual property taxes")
    print("   - transferTaxNotes: Info about transfer/purchase taxes")
    print("   - countryGeneralNotes: General jurisdiction info")
    print("3. Save the review file")
    print("4. Run the apply script to update property-taxes.json")
    print()

    # Print some examples
    print("=" * 70)
    print("EXAMPLES TO REVIEW:")
    print("=" * 70)
    for i, item in enumerate(review_data[:5]):
        print(f"\n{i+1}. {item['countryCode']} ({item['lang']})")
        print(f"   Current: {item['currentNotes'][:100]}...")
        print(f"   Suggestion: {item['suggestion']}")

    if len(review_data) > 5:
        print(f"\n... and {len(review_data) - 5} more items in the review file")

    print()

    return review_data


if __name__ == '__main__':
    script_dir = Path(__file__).parent

    input_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    output_file = script_dir / 'property-taxes-manual-review.json'

    # Allow override via command line
    if len(sys.argv) > 1:
        input_file = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_file = Path(sys.argv[2])

    if not input_file.exists():
        print(f"❌ Error: Input file not found: {input_file}")
        sys.exit(1)

    review_data = generate_review_file(input_file, output_file)

    print(f"✅ Review file ready: {output_file}")
    sys.exit(0)
