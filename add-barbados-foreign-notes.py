#!/usr/bin/env python3
"""
Add Foreign Access Notes for Barbados
======================================
This script adds detailed foreign access notes for Barbados (BB).
"""

import json
from pathlib import Path
from datetime import datetime

def add_barbados_notes(property_taxes_file, backup_file):
    """
    Add foreign access notes for Barbados.

    Args:
        property_taxes_file: Path to property-taxes.json
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("ADDING FOREIGN ACCESS NOTES FOR BARBADOS")
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

    # Find Barbados
    barbados = None
    for country in data['countries']:
        if country['countryCode'] == 'BB':
            barbados = country
            break

    if not barbados:
        print("❌ Error: Barbados (BB) not found in data")
        return

    print(f"📝 Current foreign access notes for Barbados:")
    print(f"   FR: '{barbados['foreignAccessNotes']['fr']}'")
    print(f"   EN: '{barbados['foreignAccessNotes']['en']}'")
    print()

    # Add notes
    barbados['foreignAccessNotes'] = {
        'fr': "Les étrangers doivent obtenir une approbation de contrôle des changes de la Banque Centrale de la Barbade et payer une taxe de licence foncière pour non-barbadiens. Procédure relativement simple mais requiert autorisation préalable.",
        'en': "Foreigners must obtain exchange control approval from the Central Bank of Barbados and pay a non-Barbadian land license fee. Procedure is relatively straightforward but requires prior authorization."
    }

    print("✏️  Updated foreign access notes:")
    print(f"   FR: {barbados['foreignAccessNotes']['fr']}")
    print(f"   EN: {barbados['foreignAccessNotes']['en']}")
    print()

    # Write updated file
    print("💾 Writing updated property-taxes.json...")
    with open(property_taxes_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print()
    print("=" * 70)
    print("✅ BARBADOS FOREIGN ACCESS NOTES ADDED")
    print("=" * 70)
    print()


if __name__ == '__main__':
    script_dir = Path(__file__).parent

    property_taxes_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    backup_file = script_dir / f'../pickandtip-api/data/topics/property-taxes.backup-barbados-notes-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

    if not property_taxes_file.exists():
        print(f"❌ Error: Property taxes file not found: {property_taxes_file}")
        exit(1)

    add_barbados_notes(property_taxes_file, backup_file)
