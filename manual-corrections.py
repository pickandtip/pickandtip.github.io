#!/usr/bin/env python3
"""
Manual Corrections for Specific Countries
==========================================
This script applies manual corrections for countries that the auto-categorization
didn't handle perfectly.
"""

import json
from pathlib import Path
from datetime import datetime

def apply_manual_corrections(property_taxes_file, backup_file):
    """
    Apply manual corrections to specific countries.

    Args:
        property_taxes_file: Path to property-taxes.json
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("APPLYING MANUAL CORRECTIONS")
    print("=" * 70)
    print(f"Property taxes file: {property_taxes_file}")
    print(f"Backup file:         {backup_file}")
    print()

    # Read property taxes file
    print("📖 Reading property-taxes.json...")
    with open(property_taxes_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Create backup
    print("💾 Creating backup...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ Backup saved")
    print()

    # Manual corrections
    corrections = {
        'ZA': {  # South Africa - split "Rates + Transfer Duty progressif"
            'propertyTaxNotes': {'fr': 'Rates'},
            'transferTaxNotes': {'fr': 'Transfer Duty progressif'},
            'notes': {'fr': 'Accès étranger: Pleine propriété sans restriction.'}
        }
    }

    print("🔧 Applying manual corrections...")

    for country in data['countries']:
        code = country['countryCode']

        if code in corrections:
            print(f"   ✓ {code}: Applying corrections")

            for field, langs in corrections[code].items():
                if field == 'notes':
                    # Direct replacement for notes
                    for lang, value in langs.items():
                        country['notes'][lang] = value
                else:
                    # For other fields, ensure they exist
                    if field not in country:
                        country[field] = {}

                    for lang, value in langs.items():
                        if value:  # Only set if value is not empty
                            country[field][lang] = value

    # Write updated file
    print()
    print("💾 Writing updated property-taxes.json...")
    with open(property_taxes_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 70)
    print("✅ MANUAL CORRECTIONS APPLIED")
    print("=" * 70)
    print()
    print("Corrections applied:")
    for code, changes in corrections.items():
        print(f"  • {code}:")
        for field, langs in changes.items():
            for lang, value in langs.items():
                if value:
                    print(f"      {field}.{lang} = \"{value[:60]}...\"")
    print()


if __name__ == '__main__':
    script_dir = Path(__file__).parent

    property_taxes_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    backup_file = script_dir / f'../pickandtip-api/data/topics/property-taxes.backup-manual-corrections-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

    if not property_taxes_file.exists():
        print(f"❌ Error: Property taxes file not found: {property_taxes_file}")
        exit(1)

    apply_manual_corrections(property_taxes_file, backup_file)
