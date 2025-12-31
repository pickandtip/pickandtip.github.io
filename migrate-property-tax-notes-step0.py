#!/usr/bin/env python3
"""
Migration Script - Step 0: Country General Notes
=================================================
This script migrates notes that appear BEFORE the first specific section
(i.e., before "Taxe foncière annuelle:" or "Annual property tax:").

These are general notes about the country/jurisdiction that don't fit into
the specific categories (property tax, transfer tax, foreign access).

Examples:
- "Åland Islands (Finnish autonomy). Local legislation distinct from mainland Finland."
- "American Samoa (unincorporated US territory). Independent tax system..."
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

def extract_country_general_notes(notes_text, lang):
    """
    Extract general country notes that appear before the first section.

    Args:
        notes_text: Full notes text
        lang: 'fr' or 'en'

    Returns:
        tuple: (general_notes, remaining_notes)
    """
    if lang == 'fr':
        # Find where the first section starts
        # Look for "Taxe foncière annuelle:" OR "Taxe de transfert:" OR "Accès étrangers:"
        match = re.search(
            r'(Taxe foncière annuelle:|Taxe de transfert:|Accès étrangers:)',
            notes_text,
            re.IGNORECASE
        )

        if match:
            # Everything before the first section is general notes
            general_notes = notes_text[:match.start()].strip()
            remaining_notes = notes_text[match.start()].strip()

            # Only return if there's actually content
            if general_notes:
                return general_notes, remaining_notes

        # No sections found or no general notes
        return '', notes_text

    else:  # English
        # Find where the first section starts
        # Look for "Annual property tax:" OR "Transfer tax:" OR "Foreign access:"
        match = re.search(
            r'(Annual property tax:|Transfer tax:|Foreign access:)',
            notes_text,
            re.IGNORECASE
        )

        if match:
            # Everything before the first section is general notes
            general_notes = notes_text[:match.start()].strip()
            remaining_notes = notes_text[match.start():].strip()

            # Only return if there's actually content
            if general_notes:
                return general_notes, remaining_notes

        # No sections found or no general notes
        return '', notes_text


def migrate_property_taxes_step0(input_file, output_file, backup_file):
    """
    Migrate general country notes from notes field to countryGeneralNotes field.

    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("MIGRATION STEP 0: Country General Notes")
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
    print("🔄 Migrating country general notes...")
    countries_with_notes = []

    for country in data['countries']:
        country_code = country['countryCode']

        try:
            # Initialize countryGeneralNotes if not exists
            if 'countryGeneralNotes' not in country:
                country['countryGeneralNotes'] = {}

            # Process French notes
            if 'fr' in country['notes']:
                notes_fr = country['notes']['fr']
                general_fr, remaining_fr = extract_country_general_notes(notes_fr, 'fr')

                if general_fr:
                    country['countryGeneralNotes']['fr'] = general_fr
                    country['notes']['fr'] = remaining_fr
                    stats['migrated_fr'] += 1
                    countries_with_notes.append(f"{country_code} (FR): {general_fr[:80]}...")
                else:
                    country['countryGeneralNotes']['fr'] = ''
                    stats['no_match_fr'] += 1

            # Process English notes
            if 'en' in country['notes']:
                notes_en = country['notes']['en']
                general_en, remaining_en = extract_country_general_notes(notes_en, 'en')

                if general_en:
                    country['countryGeneralNotes']['en'] = general_en
                    country['notes']['en'] = remaining_en
                    stats['migrated_en'] += 1
                    if country_code not in [c.split(' ')[0] for c in countries_with_notes]:
                        countries_with_notes.append(f"{country_code} (EN): {general_en[:80]}...")
                else:
                    country['countryGeneralNotes']['en'] = ''
                    stats['no_match_en'] += 1

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
    print(f"No general notes FR:       {stats['no_match_fr']}")
    print(f"No general notes EN:       {stats['no_match_en']}")
    print(f"Errors:                    {len(stats['errors'])}")

    if countries_with_notes:
        print()
        print("=" * 70)
        print(f"COUNTRIES WITH GENERAL NOTES ({len(countries_with_notes)}):")
        print("=" * 70)
        for note in countries_with_notes[:10]:  # Show first 10
            print(f"  • {note}")
        if len(countries_with_notes) > 10:
            print(f"  ... and {len(countries_with_notes) - 10} more")

    if stats['errors']:
        print()
        print("Errors details:")
        for error in stats['errors']:
            print(f"  - {error}")

    print()
    print("=" * 70)
    print("✅ MIGRATION STEP 0 COMPLETED")
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

    # Default paths
    input_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    output_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    backup_file = script_dir / f'../pickandtip-api/data/topics/property-taxes.backup-step0-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

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
        print("Usage: python migrate-property-tax-notes-step0.py [input_file] [output_file] [backup_file]")
        sys.exit(1)

    # Run migration
    stats = migrate_property_taxes_step0(input_file, output_file, backup_file)

    # Exit with appropriate code
    sys.exit(0 if len(stats['errors']) == 0 else 1)
