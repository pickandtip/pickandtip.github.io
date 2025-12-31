#!/usr/bin/env python3
"""
Migration Script - Step 1: Property Tax Notes Only
===================================================
This script migrates ONLY the "Taxe foncière annuelle" / "Annual property tax"
section from the notes field to a new propertyTaxNotes field.

The original notes field is preserved but with the property tax section removed.
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

def extract_property_tax_notes(notes_text, lang):
    """
    Extract property tax section from notes text.

    Args:
        notes_text: Full notes text
        lang: 'fr' or 'en'

    Returns:
        tuple: (property_tax_notes, remaining_notes)
    """
    if lang == 'fr':
        # Match "Taxe foncière annuelle:" until next section or end
        match = re.search(
            r'Taxe foncière annuelle:\s*(.*?)(?=\s*(?:Taxe de transfert:|Accès étrangers:|$))',
            notes_text,
            re.DOTALL | re.IGNORECASE
        )

        if match:
            property_tax_notes = match.group(1).strip()
            # Remove the matched section from original notes
            remaining_notes = re.sub(
                r'Taxe foncière annuelle:\s*.*?(?=\s*(?:Taxe de transfert:|Accès étrangers:|$))',
                '',
                notes_text,
                count=1,
                flags=re.DOTALL | re.IGNORECASE
            ).strip()
            return property_tax_notes, remaining_notes

    else:  # English
        # Match "Annual property tax:" until next section or end
        match = re.search(
            r'Annual property tax:\s*(.*?)(?=\s*(?:Transfer tax:|Foreign access:|$))',
            notes_text,
            re.DOTALL | re.IGNORECASE
        )

        if match:
            property_tax_notes = match.group(1).strip()
            # Remove the matched section from original notes
            remaining_notes = re.sub(
                r'Annual property tax:\s*.*?(?=\s*(?:Transfer tax:|Foreign access:|$))',
                '',
                notes_text,
                count=1,
                flags=re.DOTALL | re.IGNORECASE
            ).strip()
            return property_tax_notes, remaining_notes

    # If no match found, return empty extraction
    return '', notes_text


def migrate_property_taxes_step1(input_file, output_file, backup_file):
    """
    Migrate property tax notes from notes field to propertyTaxNotes field.

    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("MIGRATION STEP 1: Property Tax Notes")
    print("=" * 70)
    print(f"Input file:  {input_file}")
    print(f"Output file: {output_file}")
    print(f"Backup file: {backup_file}")
    print()

    # Read input file
    print("📖 Reading input file...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Create backup
    print("💾 Creating backup...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Backup saved to: {backup_file}")
    print()

    # Statistics
    stats = {
        'total_countries': len(data['countries']),
        'migrated_fr': 0,
        'migrated_en': 0,
        'no_match_fr': 0,
        'no_match_en': 0,
        'errors': []
    }

    # Migrate each country
    print("🔄 Migrating property tax notes...")
    for country in data['countries']:
        country_code = country['countryCode']

        try:
            # Initialize propertyTaxNotes if not exists
            if 'propertyTaxNotes' not in country:
                country['propertyTaxNotes'] = {}

            # Process French notes
            if 'fr' in country['notes']:
                notes_fr = country['notes']['fr']
                property_tax_fr, remaining_fr = extract_property_tax_notes(notes_fr, 'fr')

                if property_tax_fr:
                    country['propertyTaxNotes']['fr'] = property_tax_fr
                    country['notes']['fr'] = remaining_fr
                    stats['migrated_fr'] += 1
                else:
                    country['propertyTaxNotes']['fr'] = ''
                    stats['no_match_fr'] += 1
                    print(f"  ⚠️  {country_code}: No French property tax section found")

            # Process English notes
            if 'en' in country['notes']:
                notes_en = country['notes']['en']
                property_tax_en, remaining_en = extract_property_tax_notes(notes_en, 'en')

                if property_tax_en:
                    country['propertyTaxNotes']['en'] = property_tax_en
                    country['notes']['en'] = remaining_en
                    stats['migrated_en'] += 1
                else:
                    country['propertyTaxNotes']['en'] = ''
                    stats['no_match_en'] += 1
                    print(f"  ⚠️  {country_code}: No English property tax section found")

        except Exception as e:
            error_msg = f"{country_code}: {str(e)}"
            stats['errors'].append(error_msg)
            print(f"  ❌ Error processing {country_code}: {e}")

    # Write output file
    print()
    print("💾 Writing migrated data...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    # Print statistics
    print()
    print("=" * 70)
    print("MIGRATION STATISTICS")
    print("=" * 70)
    print(f"Total countries:           {stats['total_countries']}")
    print(f"Successfully migrated FR:  {stats['migrated_fr']}")
    print(f"Successfully migrated EN:  {stats['migrated_en']}")
    print(f"No match found FR:         {stats['no_match_fr']}")
    print(f"No match found EN:         {stats['no_match_en']}")
    print(f"Errors:                    {len(stats['errors'])}")

    if stats['errors']:
        print()
        print("Errors details:")
        for error in stats['errors']:
            print(f"  - {error}")

    print()
    print("=" * 70)
    print("✅ MIGRATION STEP 1 COMPLETED")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Review the migrated data in the output file")
    print("2. Test the interface to validate the migration")
    print("3. Once validated, proceed to Step 2 (transferTaxNotes)")
    print()

    return stats


if __name__ == '__main__':
    # Determine file paths
    script_dir = Path(__file__).parent

    # Default paths (adjust if your API is elsewhere)
    input_file = script_dir / '../api/data/property-taxes.json'
    output_file = script_dir / '../api/data/property-taxes.json'
    backup_file = script_dir / f'../api/data/property-taxes.backup-step1-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

    # Allow override via command line
    if len(sys.argv) > 1:
        input_file = Path(sys.argv[1])
    if len(sys.argv) > 2:
        output_file = Path(sys.argv[2])
    if len(sys.argv) > 3:
        backup_file = Path(sys.argv[3])

    # Check if input file exists
    if not input_file.exists():
        print(f"❌ Error: Input file not found: {input_file}")
        print()
        print("Please provide the correct path to property-taxes.json")
        print("Usage: python migrate-property-tax-notes-step1.py [input_file] [output_file] [backup_file]")
        sys.exit(1)

    # Run migration
    stats = migrate_property_taxes_step1(input_file, output_file, backup_file)

    # Exit with appropriate code
    sys.exit(0 if len(stats['errors']) == 0 else 1)
