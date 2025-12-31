#!/usr/bin/env python3
"""
Migration Script: Extract Country Warnings
===========================================
This script extracts warning messages from notes into a dedicated countryWarnings field.

Warnings are identified by patterns like:
- "ATTENTION:", "WARNING:", "IMPORTANT:", "Note:", etc.
- Usually at the end of notes or standalone sentences

These warnings apply to the entire country and should be displayed in a warning triangle.
"""

import json
import re
import sys
from datetime import datetime
from pathlib import Path

def extract_warnings(notes_text, lang):
    """
    Extract warning messages from notes text.

    Args:
        notes_text: Full notes text
        lang: 'fr' or 'en'

    Returns:
        tuple: (warnings, remaining_notes)
    """
    if lang == 'fr':
        # Patterns for French warnings
        warning_patterns = [
            r'ATTENTION:\s*(.+?)(?=\s*(?:Taxe foncière|Taxe de transfert|Accès étrangers|$))',
            r'IMPORTANT:\s*(.+?)(?=\s*(?:Taxe foncière|Taxe de transfert|Accès étrangers|$))',
            r'Note:\s*(.+?)(?=\s*(?:Taxe foncière|Taxe de transfert|Accès étrangers|$))',
            r'⚠️\s*(.+?)(?=\s*(?:Taxe foncière|Taxe de transfert|Accès étrangers|$))',
        ]
    else:  # English
        # Patterns for English warnings
        warning_patterns = [
            r'WARNING:\s*(.+?)(?=\s*(?:Annual property tax|Transfer tax|Foreign access|$))',
            r'IMPORTANT:\s*(.+?)(?=\s*(?:Annual property tax|Transfer tax|Foreign access|$))',
            r'Note:\s*(.+?)(?=\s*(?:Annual property tax|Transfer tax|Foreign access|$))',
            r'⚠️\s*(.+?)(?=\s*(?:Annual property tax|Transfer tax|Foreign access|$))',
            r'ATTENTION:\s*(.+?)(?=\s*(?:Annual property tax|Transfer tax|Foreign access|$))',
        ]

    warnings_found = []
    cleaned_notes = notes_text

    for pattern in warning_patterns:
        matches = re.finditer(pattern, notes_text, re.DOTALL | re.IGNORECASE)
        for match in matches:
            warning_text = match.group(0).strip()
            if warning_text and warning_text not in warnings_found:
                warnings_found.append(warning_text)
                # Remove from original notes
                cleaned_notes = cleaned_notes.replace(warning_text, '').strip()

    # Join all warnings
    warnings = ' '.join(warnings_found).strip()

    # Clean up extra spaces in remaining notes
    cleaned_notes = re.sub(r'\s+', ' ', cleaned_notes).strip()

    return warnings, cleaned_notes


def migrate_country_warnings(input_file, output_file, backup_file):
    """
    Extract warnings from notes field to countryWarnings field.

    Args:
        input_file: Path to input JSON file
        output_file: Path to output JSON file
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("MIGRATION: Country Warnings Extraction")
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
        'warnings_found_fr': 0,
        'warnings_found_en': 0,
        'no_warnings_fr': 0,
        'no_warnings_en': 0,
        'errors': []
    }

    # Migrate each country
    print("🔄 Extracting country warnings...")
    countries_with_warnings = []

    for country in data['countries']:
        country_code = country['countryCode']

        try:
            # Initialize countryWarnings if not exists
            if 'countryWarnings' not in country:
                country['countryWarnings'] = {}

            # Process French notes
            if 'fr' in country['notes']:
                notes_fr = country['notes']['fr']
                warnings_fr, remaining_fr = extract_warnings(notes_fr, 'fr')

                if warnings_fr:
                    country['countryWarnings']['fr'] = warnings_fr
                    country['notes']['fr'] = remaining_fr
                    stats['warnings_found_fr'] += 1
                    countries_with_warnings.append(f"{country_code} (FR): {warnings_fr[:80]}...")
                else:
                    country['countryWarnings']['fr'] = ''
                    stats['no_warnings_fr'] += 1

            # Process English notes
            if 'en' in country['notes']:
                notes_en = country['notes']['en']
                warnings_en, remaining_en = extract_warnings(notes_en, 'en')

                if warnings_en:
                    country['countryWarnings']['en'] = warnings_en
                    country['notes']['en'] = remaining_en
                    stats['warnings_found_en'] += 1
                    if country_code not in [c.split(' ')[0] for c in countries_with_warnings]:
                        countries_with_warnings.append(f"{country_code} (EN): {warnings_en[:80]}...")
                else:
                    country['countryWarnings']['en'] = ''
                    stats['no_warnings_en'] += 1

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
    print(f"Warnings found FR:         {stats['warnings_found_fr']}")
    print(f"Warnings found EN:         {stats['warnings_found_en']}")
    print(f"No warnings FR:            {stats['no_warnings_fr']}")
    print(f"No warnings EN:            {stats['no_warnings_en']}")
    print(f"Errors:                    {len(stats['errors'])}")

    if countries_with_warnings:
        print()
        print("=" * 70)
        print(f"COUNTRIES WITH WARNINGS ({len(countries_with_warnings)}):")
        print("=" * 70)
        for warning in countries_with_warnings:
            print(f"  • {warning}")

    if stats['errors']:
        print()
        print("Errors details:")
        for error in stats['errors']:
            print(f"  - {error}")

    print()
    print("=" * 70)
    print("✅ MIGRATION COMPLETED")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Review the extracted warnings")
    print("2. Test the interface to see warning triangles")
    print("3. Adjust warnings manually if needed")
    print()

    return stats


if __name__ == '__main__':
    # Determine file paths
    script_dir = Path(__file__).parent

    # Default paths
    input_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    output_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    backup_file = script_dir / f'../pickandtip-api/data/topics/property-taxes.backup-warnings-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

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
        print("Usage: python migrate-country-warnings.py [input_file] [output_file] [backup_file]")
        sys.exit(1)

    # Run migration
    stats = migrate_country_warnings(input_file, output_file, backup_file)

    # Exit with appropriate code
    sys.exit(0 if len(stats['errors']) == 0 else 1)
