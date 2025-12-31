#!/usr/bin/env python3
"""
Remove Notes Field from Property Taxes JSON
============================================
This script removes the obsolete 'notes' field from property-taxes.json
after all content has been migrated to dedicated fields.
"""

import json
from pathlib import Path
from datetime import datetime

def remove_notes_field(property_taxes_file, backup_file):
    """
    Remove the notes field from all countries.

    Args:
        property_taxes_file: Path to property-taxes.json
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("REMOVING NOTES FIELD FROM PROPERTY TAXES JSON")
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

    # Statistics
    stats = {
        'total_countries': len(data['countries']),
        'removed': 0,
        'had_empty_notes': 0,
        'had_non_empty_notes': 0
    }

    print("🗑️  Removing notes field from all countries...")

    for country in data['countries']:
        if 'notes' in country:
            # Check if notes were empty
            notes_fr = country['notes'].get('fr', '').strip()
            notes_en = country['notes'].get('en', '').strip()

            if not notes_fr and not notes_en:
                stats['had_empty_notes'] += 1
            else:
                stats['had_non_empty_notes'] += 1
                # Log countries with remaining notes
                if notes_fr or notes_en:
                    print(f"  ⚠️  {country['countryCode']}: Has non-empty notes!")
                    if notes_fr:
                        print(f"      FR: {notes_fr[:100]}...")
                    if notes_en:
                        print(f"      EN: {notes_en[:100]}...")

            # Remove the notes field
            del country['notes']
            stats['removed'] += 1

    # Write updated file
    print()
    print("💾 Writing updated property-taxes.json...")
    with open(property_taxes_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 70)
    print("REMOVAL STATISTICS")
    print("=" * 70)
    print(f"Total countries:           {stats['total_countries']}")
    print(f"Notes field removed:       {stats['removed']}")
    print(f"Had empty notes:           {stats['had_empty_notes']}")
    print(f"Had non-empty notes:       {stats['had_non_empty_notes']}")

    print()
    print("=" * 70)
    print("✅ NOTES FIELD REMOVED")
    print("=" * 70)
    print()

    if stats['had_non_empty_notes'] > 0:
        print("⚠️  WARNING: Some countries still had non-empty notes!")
        print("   Please review the migration to ensure all content was properly categorized.")
        print()
    else:
        print("✅ All notes were empty - migration successful!")
        print()
        print("Migration complete! All note content has been successfully migrated to:")
        print("  • countryGeneralNotes - General jurisdiction information")
        print("  • propertyTaxNotes - Annual property tax information")
        print("  • transferTaxNotes - Transfer/purchase tax information")
        print("  • foreignAccessNotes - Foreign ownership restrictions")
        print("  • countryWarnings - General warnings and alerts")
        print()


if __name__ == '__main__':
    script_dir = Path(__file__).parent

    property_taxes_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    backup_file = script_dir / f'../pickandtip-api/data/topics/property-taxes.backup-remove-notes-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

    if not property_taxes_file.exists():
        print(f"❌ Error: Property taxes file not found: {property_taxes_file}")
        exit(1)

    remove_notes_field(property_taxes_file, backup_file)
