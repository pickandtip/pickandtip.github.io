#!/usr/bin/env python3
"""
Migration Script - Step 2: Transfer Tax Notes
==============================================
This script migrates transfer tax notes from the general notes field
to a dedicated transferTaxNotes field.

It extracts content that appears after "Taxe de transfert:" (FR) or
"Transfer tax:" (EN) and before the next section or end of text.

Example:
- FR: "Taxe de transfert: Droits fixes de 2.5% + frais notariaux..."
- EN: "Transfer tax: Fixed rate of 2.5% plus notary fees..."
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

def extract_transfer_tax_notes(notes_text, lang):
    """
    Extract transfer tax notes from notes text.

    Args:
        notes_text: Full notes text
        lang: 'fr' or 'en'

    Returns:
        tuple: (transfer_tax_notes, remaining_notes)
    """
    if lang == 'fr':
        # Find "Taxe de transfert:" section
        match = re.search(
            r'Taxe de transfert:\s*(.*?)(?=\s*(?:Accès étrangers:|$))',
            notes_text,
            re.DOTALL | re.IGNORECASE
        )

        if match:
            transfer_tax_notes = match.group(1).strip()
            # Remove this section from original notes
            remaining_notes = re.sub(
                r'Taxe de transfert:\s*.*?(?=\s*(?:Accès étrangers:|$))',
                '',
                notes_text,
                count=1,
                flags=re.DOTALL | re.IGNORECASE
            ).strip()

            # Only return if there's actual content
            if transfer_tax_notes:
                return transfer_tax_notes, remaining_notes

        # No match found
        return '', notes_text

    else:  # English
        # Find "Transfer tax:" section
        match = re.search(
            r'Transfer tax:\s*(.*?)(?=\s*(?:Foreign access:|$))',
            notes_text,
            re.DOTALL | re.IGNORECASE
        )

        if match:
            transfer_tax_notes = match.group(1).strip()
            # Remove this section from original notes
            remaining_notes = re.sub(
                r'Transfer tax:\s*.*?(?=\s*(?:Foreign access:|$))',
                '',
                notes_text,
                count=1,
                flags=re.DOTALL | re.IGNORECASE
            ).strip()

            # Only return if there's actual content
            if transfer_tax_notes:
                return transfer_tax_notes, remaining_notes

        # No match found
        return '', notes_text


def migrate_property_taxes_step2(input_file, output_file, backup_file):
    """
    Migrate transfer tax notes from notes field to transferTaxNotes field.

    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("MIGRATION STEP 2: Transfer Tax Notes")
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
    print("🔄 Migrating transfer tax notes...")
    countries_with_notes = []

    for country in data['countries']:
        country_code = country['countryCode']

        try:
            # Initialize transferTaxNotes if not exists
            if 'transferTaxNotes' not in country:
                country['transferTaxNotes'] = {}

            # Process French notes
            if 'fr' in country['notes']:
                notes_fr = country['notes']['fr']
                transfer_fr, remaining_fr = extract_transfer_tax_notes(notes_fr, 'fr')

                if transfer_fr:
                    country['transferTaxNotes']['fr'] = transfer_fr
                    country['notes']['fr'] = remaining_fr
                    stats['migrated_fr'] += 1
                    countries_with_notes.append(f"{country_code} (FR): {transfer_fr[:80]}...")
                else:
                    country['transferTaxNotes']['fr'] = ''
                    stats['no_match_fr'] += 1

            # Process English notes
            if 'en' in country['notes']:
                notes_en = country['notes']['en']
                transfer_en, remaining_en = extract_transfer_tax_notes(notes_en, 'en')

                if transfer_en:
                    country['transferTaxNotes']['en'] = transfer_en
                    country['notes']['en'] = remaining_en
                    stats['migrated_en'] += 1
                    if country_code not in [c.split(' ')[0] for c in countries_with_notes]:
                        countries_with_notes.append(f"{country_code} (EN): {transfer_en[:80]}...")
                else:
                    country['transferTaxNotes']['en'] = ''
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
    print(f"No transfer tax notes FR:  {stats['no_match_fr']}")
    print(f"No transfer tax notes EN:  {stats['no_match_en']}")
    print(f"Errors:                    {len(stats['errors'])}")

    if countries_with_notes:
        print()
        print("=" * 70)
        print(f"COUNTRIES WITH TRANSFER TAX NOTES ({len(countries_with_notes)}):")
        print("=" * 70)
        for note in countries_with_notes[:15]:  # Show first 15
            print(f"  • {note}")
        if len(countries_with_notes) > 15:
            print(f"  ... and {len(countries_with_notes) - 15} more")

    if stats['errors']:
        print()
        print("Errors details:")
        for error in stats['errors']:
            print(f"  - {error}")

    print()
    print("=" * 70)
    print("✅ MIGRATION STEP 2 COMPLETED")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Review the migrated data in the output file")
    print("2. Test the interface to validate transfer tax tooltips")
    print("3. Once validated, proceed to Step 3 (foreignAccessNotes)")
    print()

    return stats


if __name__ == '__main__':
    # Determine file paths
    script_dir = Path(__file__).parent

    # Default paths
    input_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    output_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    backup_file = script_dir / f'../pickandtip-api/data/topics/property-taxes.backup-step2-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

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
        print("Usage: python migrate-property-tax-notes-step2.py [input_file] [output_file] [backup_file]")
        sys.exit(1)

    # Run migration
    stats = migrate_property_taxes_step2(input_file, output_file, backup_file)

    # Exit with appropriate code
    sys.exit(0 if len(stats['errors']) == 0 else 1)
