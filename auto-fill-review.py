#!/usr/bin/env python3
"""
Auto-Fill Review File
=====================
This script automatically categorizes standalone notes into the appropriate fields
using keyword analysis and pattern matching.
"""

import json
import re
from pathlib import Path

def smart_categorize(text, lang):
    """
    Intelligently categorize text into propertyTaxNotes, transferTaxNotes, or countryGeneralNotes.

    Args:
        text: The text to categorize
        lang: Language code ('FR' or 'EN')

    Returns:
        dict with keys: propertyTaxNotes, transferTaxNotes, countryGeneralNotes
    """
    result = {
        'propertyTaxNotes': '',
        'transferTaxNotes': '',
        'countryGeneralNotes': ''
    }

    if lang.upper() == 'FR':
        # French patterns

        # Split by sentences (roughly)
        sentences = re.split(r'(?<=[.!?])\s+|\.\s+(?=[A-Z])', text)

        property_tax_keywords = [
            r'taxe foncière', r'property tax', r'\brates\b', r'impuesto predial',
            r'\bimu\b', r'\bibi\b', r'grundsteuer', r'kotei shisan', r'précompte',
            r'taxe.*annuelle', r'taxe d\'habitation', r'council tax', r'local property tax',
            r'enfia', r'ozb\b', r'arnona', r'emlak vergisi', r'land tax',
            r'assessment rate', r'quit rent', r'contribución inmobiliaria',
            r'impuesto inmobiliario', r'predial', r'contribuição', r'land rates',
            r'property rate'
        ]

        transfer_tax_keywords = [
            r'droits? de mutation', r'droits? de transfert', r'transfer tax',
            r'stamp duty', r'frais.*achat', r'frais totaux', r'grunderwerbsteuer',
            r'à l\'achat', r'acquisition', r'émoluments notaire', r'frais notari',
            r'débours', r'\btva\b', r'plus-value', r'capital gains',
            r'transaction', r'enregistrement', r'registration', r'\bitp\b'
        ]

        general_keywords = [
            r'varie par', r'selon', r'canton', r'état', r'province',
            r'municipalité', r'land\b', r'réforme', r'nouveau', r'récent',
            r'paradis fiscal', r'exonéré', r'aucun', r'pas de'
        ]

    else:  # EN
        sentences = re.split(r'(?<=[.!?])\s+|\.\s+(?=[A-Z])', text)

        property_tax_keywords = [
            r'property tax', r'\brates\b', r'annual.*tax', r'land tax',
            r'council tax', r'local tax', r'municipal tax', r'assessment',
            r'quit rent', r'house tax', r'real property tax'
        ]

        transfer_tax_keywords = [
            r'transfer tax', r'stamp duty', r'transaction.*fee', r'purchase.*tax',
            r'registration.*fee', r'capital gains', r'notary.*fee',
            r'transfer duty', r'acquisition.*tax'
        ]

        general_keywords = [
            r'varies by', r'depending on', r'canton', r'state', r'province',
            r'municipality', r'reform', r'new', r'recent', r'tax haven',
            r'exempt', r'no tax', r'none'
        ]

    # Analyze each sentence
    property_parts = []
    transfer_parts = []
    general_parts = []

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        # Check what category this sentence belongs to
        is_property = any(re.search(kw, sentence, re.IGNORECASE) for kw in property_tax_keywords)
        is_transfer = any(re.search(kw, sentence, re.IGNORECASE) for kw in transfer_tax_keywords)
        is_general = any(re.search(kw, sentence, re.IGNORECASE) for kw in general_keywords)

        # Categorize based on matches
        if is_property and not is_transfer:
            property_parts.append(sentence)
        elif is_transfer and not is_property:
            transfer_parts.append(sentence)
        elif is_property and is_transfer:
            # Contains both - try to split more carefully
            # Look for specific patterns that separate property tax from transfer tax

            # Pattern: "... property tax info. Transfer tax: ..."
            split_match = re.search(r'(.+?)\.\s*(Droits? de (?:mutation|transfert)|Transfer (?:tax|duty|Duty)|Stamp duty|Grunderwerbsteuer|à l\'achat)[:\s](.+)', sentence, re.IGNORECASE)
            if split_match:
                property_parts.append(split_match.group(1).strip())
                transfer_parts.append(split_match.group(2).strip() + ' ' + split_match.group(3).strip())
            else:
                # Can't split clearly - put in general for manual review
                general_parts.append(sentence)
        elif is_general:
            general_parts.append(sentence)
        else:
            # No clear categorization - put in general
            general_parts.append(sentence)

    # Combine parts
    if property_parts:
        result['propertyTaxNotes'] = ' '.join(property_parts).strip()

    if transfer_parts:
        result['transferTaxNotes'] = ' '.join(transfer_parts).strip()

    if general_parts:
        result['countryGeneralNotes'] = ' '.join(general_parts).strip()

    # If everything went to general but text clearly mentions one topic, reassign
    if result['countryGeneralNotes'] and not result['propertyTaxNotes'] and not result['transferTaxNotes']:
        text_lower = text.lower()

        # Check if it's clearly about one topic
        has_property = any(re.search(kw, text, re.IGNORECASE) for kw in property_tax_keywords)
        has_transfer = any(re.search(kw, text, re.IGNORECASE) for kw in transfer_tax_keywords)

        if has_property and not has_transfer:
            result['propertyTaxNotes'] = result['countryGeneralNotes']
            result['countryGeneralNotes'] = ''
        elif has_transfer and not has_property:
            result['transferTaxNotes'] = result['countryGeneralNotes']
            result['countryGeneralNotes'] = ''

    return result


def auto_fill_review(review_file, output_file):
    """
    Auto-fill the review file with smart categorization.

    Args:
        review_file: Input review file
        output_file: Output filled review file
    """
    print("=" * 70)
    print("AUTO-FILLING REVIEW FILE")
    print("=" * 70)
    print(f"Input:  {review_file}")
    print(f"Output: {output_file}")
    print()

    # Read review file
    print("📖 Reading review file...")
    with open(review_file, 'r', encoding='utf-8') as f:
        review_data = json.load(f)

    print(f"🤖 Auto-categorizing {len(review_data)} items...")

    for item in review_data:
        current_notes = item['currentNotes']
        lang = item['lang']

        # Smart categorization
        categorized = smart_categorize(current_notes, lang)

        # Update item
        item['propertyTaxNotes'] = categorized['propertyTaxNotes']
        item['transferTaxNotes'] = categorized['transferTaxNotes']
        item['countryGeneralNotes'] = categorized['countryGeneralNotes']

    # Write output
    print(f"💾 Writing auto-filled review file...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(review_data, f, ensure_ascii=False, indent=2)

    # Statistics
    stats = {
        'total': len(review_data),
        'property_only': 0,
        'transfer_only': 0,
        'general_only': 0,
        'mixed': 0
    }

    for item in review_data:
        has_property = bool(item['propertyTaxNotes'])
        has_transfer = bool(item['transferTaxNotes'])
        has_general = bool(item['countryGeneralNotes'])

        count = sum([has_property, has_transfer, has_general])

        if count > 1:
            stats['mixed'] += 1
        elif has_property:
            stats['property_only'] += 1
        elif has_transfer:
            stats['transfer_only'] += 1
        elif has_general:
            stats['general_only'] += 1

    print()
    print("=" * 70)
    print("AUTO-FILL STATISTICS")
    print("=" * 70)
    print(f"Total items:              {stats['total']}")
    print(f"Property tax only:        {stats['property_only']}")
    print(f"Transfer tax only:        {stats['transfer_only']}")
    print(f"General only:             {stats['general_only']}")
    print(f"Mixed (multiple fields):  {stats['mixed']}")
    print()

    # Show examples
    print("=" * 70)
    print("EXAMPLES:")
    print("=" * 70)
    for i, item in enumerate(review_data[:3]):
        print(f"\n{i+1}. {item['countryCode']} ({item['lang']})")
        print(f"   Original: {item['currentNotes'][:80]}...")
        if item['propertyTaxNotes']:
            print(f"   → propertyTaxNotes: {item['propertyTaxNotes'][:60]}...")
        if item['transferTaxNotes']:
            print(f"   → transferTaxNotes: {item['transferTaxNotes'][:60]}...")
        if item['countryGeneralNotes']:
            print(f"   → countryGeneralNotes: {item['countryGeneralNotes'][:60]}...")

    print()
    print("=" * 70)
    print("✅ AUTO-FILL COMPLETED")
    print("=" * 70)
    print()
    print("Next steps:")
    print("1. Review the auto-filled file (optional)")
    print("2. Run: python3 apply-manual-review.py")
    print()


if __name__ == '__main__':
    script_dir = Path(__file__).parent

    review_file = script_dir / 'property-taxes-manual-review.json'
    output_file = script_dir / 'property-taxes-manual-review-filled.json'

    if not review_file.exists():
        print(f"❌ Error: Review file not found: {review_file}")
        exit(1)

    auto_fill_review(review_file, output_file)

    print(f"✅ Auto-filled file saved: {output_file}")
    print()
    print("To apply changes, run:")
    print(f"  python3 apply-manual-review.py {output_file}")
