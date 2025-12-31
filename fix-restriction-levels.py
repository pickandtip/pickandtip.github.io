#!/usr/bin/env python3
"""
Fix Incorrect Restriction Levels
=================================
This script fixes incorrect foreignerRestrictionLevel values in property-taxes.json.

Corrections:
- "medium" → "high" (restriction moyenne-haute)
- "prohibited" → "nationalsOnly" (propriété interdite aux étrangers)
"""

import json
from pathlib import Path
from datetime import datetime

def fix_restriction_levels(property_taxes_file, backup_file):
    """
    Fix incorrect restriction level values.

    Args:
        property_taxes_file: Path to property-taxes.json
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("FIXING INCORRECT RESTRICTION LEVELS")
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

    # Corrections mapping
    corrections = {
        'medium': 'high',        # Restriction moyenne → haute
        'prohibited': 'nationalsOnly'  # Interdit → Nationaux uniquement
    }

    # Value mapping for foreignerRestrictionValue
    value_map = {
        'unrestricted': 0,
        'low': 1,
        'high': 2,
        'nationalsOnly': 3
    }

    stats = {
        'total_countries': len(data['countries']),
        'fixed': 0,
        'corrections_detail': {}
    }

    print("🔧 Fixing incorrect restriction levels...")

    for country in data['countries']:
        code = country['countryCode']
        current_level = country.get('foreignerRestrictionLevel', '')

        if current_level in corrections:
            new_level = corrections[current_level]

            # Update level
            country['foreignerRestrictionLevel'] = new_level

            # Update value to match
            country['foreignerRestrictionValue'] = value_map[new_level]

            stats['fixed'] += 1

            if current_level not in stats['corrections_detail']:
                stats['corrections_detail'][current_level] = []
            stats['corrections_detail'][current_level].append({
                'code': code,
                'from': current_level,
                'to': new_level
            })

            print(f"   ✓ {code}: {current_level} → {new_level}")

    # Write updated file
    print()
    print("💾 Writing updated property-taxes.json...")
    with open(property_taxes_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 70)
    print("CORRECTION STATISTICS")
    print("=" * 70)
    print(f"Total countries:           {stats['total_countries']}")
    print(f"Countries corrected:       {stats['fixed']}")

    if stats['corrections_detail']:
        print()
        print("Corrections applied:")
        for old_level, items in stats['corrections_detail'].items():
            new_level = corrections[old_level]
            print(f"  {old_level} → {new_level}: {len(items)} pays")
            for item in items:
                print(f"    • {item['code']}")

    print()
    print("=" * 70)
    print("✅ RESTRICTION LEVELS FIXED")
    print("=" * 70)
    print()
    print("Valid values are now:")
    print("  • unrestricted (0) - Aucune restriction - Propriété libre")
    print("  • low (1) - Restriction basse - Permis/autorisation requis")
    print("  • high (2) - Restriction haute - Zones limitées, conditions strictes")
    print("  • nationalsOnly (3) - Nationaux uniquement - Propriété interdite/extrêmement restreinte")
    print()


if __name__ == '__main__':
    script_dir = Path(__file__).parent

    property_taxes_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    backup_file = script_dir / f'../pickandtip-api/data/topics/property-taxes.backup-fix-restrictions-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

    if not property_taxes_file.exists():
        print(f"❌ Error: Property taxes file not found: {property_taxes_file}")
        exit(1)

    fix_restriction_levels(property_taxes_file, backup_file)
