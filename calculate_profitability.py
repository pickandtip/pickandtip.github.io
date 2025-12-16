#!/usr/bin/env python3
"""
Calculate vacation rental profitability for all destinations
Based on research data from agent tasks
"""

import json

# Research data compiled from agent tasks
profitability_data = {
    "CUN": {  # Cancún
        "pricePerSqm": 1800,
        "expenseRatio": 0.61,
        "monthlyRevenue": {"50": 1000, "100": 2000, "200": 3500}
    },
    "IST": {  # Istanbul
        "pricePerSqm": 2850,
        "expenseRatio": 0.40,
        "monthlyRevenue": {"50": 1000, "100": 1600, "200": 2600}
    },
    "DXB": {  # Dubai
        "pricePerSqm": 5500,
        "expenseRatio": 0.40,
        "monthlyRevenue": {"50": 1815, "100": 3970, "200": 6250}
    },
    "LIS": {  # Lisbon
        "pricePerSqm": 4850,
        "expenseRatio": 0.50,
        "monthlyRevenue": {"50": 1750, "100": 3000, "200": 4750}
    },
    "PDC": {  # Playa del Carmen
        "pricePerSqm": 4000,
        "expenseRatio": 0.45,
        "monthlyRevenue": {"50": 1350, "100": 2400, "200": 4250}
    },
    "OPO": {  # Porto
        "pricePerSqm": 4610,
        "expenseRatio": 0.50,
        "monthlyRevenue": {"50": 1200, "100": 2150, "200": 3500}
    },
    "ROM": {  # Rome
        "pricePerSqm": 4200,
        "expenseRatio": 0.625,
        "monthlyRevenue": {"50": 2800, "100": 3850, "200": 5750}
    },
    "ATH": {  # Athens
        "pricePerSqm": 3600,
        "expenseRatio": 0.645,
        "monthlyRevenue": {"50": 1800, "100": 2500, "200": 3600}
    },
    "MIA": {  # Miami
        "pricePerSqm": 10000,
        "expenseRatio": 0.59,
        "monthlyRevenue": {"50": 3150, "100": 4600, "200": 7500}
    },
    "TUL": {  # Tulum
        "pricePerSqm": 2685,
        "expenseRatio": 0.665,
        "monthlyRevenue": {"50": 1400, "100": 2650, "200": 7000}
    },
    "UBU": {  # Bali (Ubud)
        "pricePerSqm": 825,
        "expenseRatio": 0.62,
        "monthlyRevenue": {"50": 550, "100": 1150, "200": 2250}
    },
    "JTR": {  # Santorini
        "pricePerSqm": 7625,
        "expenseRatio": 0.50,
        "monthlyRevenue": {"50": 3450, "100": 6250, "200": 12500}
    },
    "PRG": {  # Prague
        "pricePerSqm": 5450,
        "expenseRatio": 0.40,
        "monthlyRevenue": {"50": 2200, "100": 4000, "200": 7000}
    },
    "BUD": {  # Budapest
        "pricePerSqm": 4400,
        "expenseRatio": 0.575,
        "monthlyRevenue": {"50": 1400, "100": 2600, "200": 4750}
    },
    "RAK": {  # Marrakech
        "pricePerSqm": 1675,
        "expenseRatio": 0.50,
        "monthlyRevenue": {"50": 1500, "100": 2800, "200": 5500}
    },
    "CNX": {  # Chiang Mai
        "pricePerSqm": 2445,
        "expenseRatio": 0.30,
        "monthlyRevenue": {"50": 775, "100": 1400, "200": 2850}
    },
    "KRK": {  # Krakow
        "pricePerSqm": 4400,
        "expenseRatio": 0.60,
        "monthlyRevenue": {"50": 1200, "100": 1800, "200": 2850}
    },
    "SPU": {  # Split
        "pricePerSqm": 3750,
        "expenseRatio": 0.50,
        "monthlyRevenue": {"50": 1850, "100": 2600, "200": 4000}
    },
    "FAO": {  # Algarve (Albufeira)
        "pricePerSqm": 4150,
        "expenseRatio": 0.55,
        "monthlyRevenue": {"50": 2200, "100": 3100, "200": 4850}
    },
    "VLC": {  # Valencia
        "pricePerSqm": 3630,
        "expenseRatio": 0.60,
        "monthlyRevenue": {"50": 1800, "100": 2500, "200": 4000}
    }
}

def calculate_profitability(price_per_sqm, monthly_revenue, surface, expense_ratio):
    """
    Calculate net profitability percentage

    Args:
        price_per_sqm: Property price per square meter (USD)
        monthly_revenue: Monthly revenue (USD)
        surface: Property surface (sqm)
        expense_ratio: Operating expense ratio (0-1)

    Returns:
        Net profitability percentage
    """
    property_price = price_per_sqm * surface
    annual_gross_revenue = monthly_revenue * 12
    annual_net_revenue = annual_gross_revenue * (1 - expense_ratio)

    profitability = (annual_net_revenue / property_price) * 100

    return round(profitability, 1)

def main():
    results = {}

    for city_code, data in profitability_data.items():
        price_per_sqm = data["pricePerSqm"]
        expense_ratio = data["expenseRatio"]

        # Calculate for each size
        profitability_by_size = {}
        for size in ["50", "100", "200"]:
            monthly_rev = data["monthlyRevenue"][size]
            prof = calculate_profitability(
                price_per_sqm,
                monthly_rev,
                int(size),
                expense_ratio
            )
            profitability_by_size[f"{size}m2"] = {
                "profitability": prof,
                "monthlyRevenue": monthly_rev,
                "propertyPrice": price_per_sqm * int(size)
            }

        results[city_code] = {
            "pricePerSqm": price_per_sqm,
            "expenseRatio": round(expense_ratio * 100, 1),
            "netMargin": round((1 - expense_ratio) * 100, 1),
            "profitabilityBySize": profitability_by_size
        }

    # Print results
    print("=" * 80)
    print("VACATION RENTAL NET PROFITABILITY ANALYSIS")
    print("=" * 80)
    print()

    for city_code, result in sorted(results.items()):
        print(f"\n{city_code}:")
        print(f"  Price/m²: ${result['pricePerSqm']:,}")
        print(f"  Expense Ratio: {result['expenseRatio']}%")
        print(f"  Net Margin: {result['netMargin']}%")
        print(f"  Profitability:")
        for size, data in result['profitabilityBySize'].items():
            print(f"    {size}: {data['profitability']}% (${data['monthlyRevenue']}/mo, ${data['propertyPrice']:,} property)")

    # Save to JSON
    with open('/Users/chancebet/Proj/pickandtip/siteapp/profitability_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    print("\n" + "=" * 80)
    print("Results saved to profitability_results.json")
    print("=" * 80)

if __name__ == "__main__":
    main()
