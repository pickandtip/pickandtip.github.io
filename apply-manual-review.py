#!/usr/bin/env python3
"""
Apply Manual Review Changes
============================
This script applies the manual categorizations from the review file
to the property-taxes.json file.
"""

import json
import sys
from datetime import datetime
from pathlib import Path

def apply_manual_review(review_file, property_taxes_file, backup_file):
    """
    Apply manual review changes to property-taxes.json.

    Args:
        review_file: Path to completed manual review JSON
        property_taxes_file: Path to property-taxes.json
        backup_file: Path to backup file
    """
    print("=" * 70)
    print("APPLYING MANUAL REVIEW CHANGES")
    print("=" * 70)
    print(f"Review file:         {review_file}")
    print(f"Property taxes file: {property_taxes_file}")
    print(f"Backup file:         {backup_file}")
    print()

    # Read review file
    print("📖 Reading review file...")
    with open(review_file, 'r', encoding='utf-8') as f:
        review_data = json.load(f)

    # Read property taxes file
    print("📖 Reading property-taxes.json...")
    with open(property_taxes_file, 'r', encoding='utf-8') as f:
        property_taxes_data = json.load(f)

    # Create backup
    print("💾 Creating backup...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(property_taxes_data, f, ensure_ascii=False, indent=2)
    print(f"✅ Backup saved to: {backup_file}")
    print()

    # Apply changes
    print("🔄 Applying manual categorizations...")

    stats = {
        'total_items': len(review_data),
        'applied_propertyTaxNotes': 0,
        'applied_transferTaxNotes': 0,
        'applied_countryGeneralNotes': 0,
        'skipped_empty': 0,
        'errors': []
    }

    for review_item in review_data:
        country_code = review_item['countryCode']
        lang = review_item['lang'].lower()

        try:
            # Find the country in property taxes data
            country = next((c for c in property_taxes_data['countries'] if c['countryCode'] == country_code), None)

            if not country:
                stats['errors'].append(f"{country_code}: Country not found in property-taxes.json")
                continue

            # Check if user filled in any categorization
            has_changes = False

            # Apply propertyTaxNotes
            if review_item.get('propertyTaxNotes', '').strip():
                if 'propertyTaxNotes' not in country:
                    country['propertyTaxNotes'] = {}
                country['propertyTaxNotes'][lang] = review_item['propertyTaxNotes'].strip()
                stats['applied_propertyTaxNotes'] += 1
                has_changes = True

            # Apply transferTaxNotes
            if review_item.get('transferTaxNotes', '').strip():
                if 'transferTaxNotes' not in country:
                    country['transferTaxNotes'] = {}
                country['transferTaxNotes'][lang] = review_item['transferTaxNotes'].strip()
                stats['applied_transferTaxNotes'] += 1
                has_changes = True

            # Apply countryGeneralNotes
            if review_item.get('countryGeneralNotes', '').strip():
                if 'countryGeneralNotes' not in country:
                    country['countryGeneralNotes'] = {}
                country['countryGeneralNotes'][lang] = review_item['countryGeneralNotes'].strip()
                stats['applied_countryGeneralNotes'] += 1
                has_changes = True

            # If changes were made, remove the standalone note from notes field
            if has_changes:
                current_notes = country['notes'].get(lang, '')
                # Remove the text that was categorized
                remaining_text = current_notes.replace(review_item['currentNotes'], '').strip()
                country['notes'][lang] = remaining_text
            else:
                stats['skipped_empty'] += 1

        except Exception as e:
            error_msg = f"{country_code} ({lang}): {str(e)}"
            stats['errors'].append(error_msg)
            print(f"  ❌ Error: {error_msg}")

    # Write updated property taxes file
    print()
    print("💾 Writing updated property-taxes.json...")
    with open(property_taxes_file, 'w', encoding='utf-8') as f:
        json.dump(property_taxes_data, f, ensure_ascii=False, indent=2)

    # Print statistics
    print()
    print("=" * 70)
    print("APPLICATION STATISTICS")
    print("=" * 70)
    print(f"Total review items:           {stats['total_items']}")
    print(f"Applied to propertyTaxNotes:  {stats['applied_propertyTaxNotes']}")
    print(f"Applied to transferTaxNotes:  {stats['applied_transferTaxNotes']}")
    print(f"Applied to countryGeneralNotes: {stats['applied_countryGeneralNotes']}")
    print(f"Skipped (empty):              {stats['skipped_empty']}")
    print(f"Errors:                       {len(stats['errors'])}")

    if stats['errors']:
        print()
        print("Error details:")
        for error in stats['errors']:
            print(f"  - {error}")

    print()
    print("=" * 70)
    print("✅ MANUAL REVIEW APPLIED")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Test the interface to verify the changes")
    print("2. Proceed with STEP 3 migration (foreignAccessNotes)")
    print()

    return stats


if __name__ == '__main__':
    script_dir = Path(__file__).parent

    # Default paths
    review_file = script_dir / 'property-taxes-manual-review.json'
    property_taxes_file = script_dir / '../pickandtip-api/data/topics/property-taxes.json'
    backup_file = script_dir / f'../pickandtip-api/data/topics/property-taxes.backup-manual-review-{datetime.now().strftime("%Y%m%d-%H%M%S")}.json'

    # Allow override via command line
    if len(sys.argv) > 1:
        review_file = Path(sys.argv[1])
    if len(sys.argv) > 2:
        property_taxes_file = Path(sys.argv[2])
    if len(sys.argv) > 3:
        backup_file = Path(sys.argv[3])

    # Validate files exist
    if not review_file.exists():
        print(f"❌ Error: Review file not found: {review_file}")
        print()
        print("Please complete the manual review first:")
        print("1. Open property-taxes-manual-review.json")
        print("2. Fill in propertyTaxNotes, transferTaxNotes, or countryGeneralNotes for each item")
        print("3. Save the file")
        print("4. Run this script again")
        sys.exit(1)

    if not property_taxes_file.exists():
        print(f"❌ Error: Property taxes file not found: {property_taxes_file}")
        sys.exit(1)

    # Run application
    stats = apply_manual_review(review_file, property_taxes_file, backup_file)

    # Exit with appropriate code
    sys.exit(0 if len(stats['errors']) == 0 else 1)
