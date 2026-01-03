#!/usr/bin/env python3
"""
Generate Top 20 Lead List for Algoritmehub Outreach
Based on strategic criteria for first pilot customers.
"""

import json
import csv
from datetime import datetime, timedelta
from pathlib import Path

# Load data
data_path = Path(__file__).parent.parent / 'src' / 'data.json'
with open(data_path, 'r') as f:
    data = json.load(f)

leads = data['leads']

# Criteria weights
def calculate_outreach_score(lead):
    """Calculate a score optimized for outreach success, not just size."""
    score = 0
    
    # Sweet spot: 5-30 algorithms (not too small, not too big)
    algo_count = lead.get('algorithm_count', 0)
    if 5 <= algo_count <= 15:
        score += 30  # Perfect sweet spot
    elif 15 < algo_count <= 30:
        score += 20  # Good, but slightly complex
    elif algo_count > 30:
        score += 5   # Too big, slow decision making
    elif algo_count >= 3:
        score += 10  # Small but viable
    
    # Impactful algorithms (compliance urgency)
    impactful = lead.get('impactful_count', 0)
    if impactful >= 5:
        score += 30
    elif impactful >= 3:
        score += 20
    elif impactful >= 1:
        score += 10
    
    # No IAMA = clear sales opportunity
    if not lead.get('has_iama', True):
        score += 20
    
    # Recent activity (published in 2025)
    latest = lead.get('latest_date')
    if latest:
        try:
            latest_date = datetime.strptime(latest, '%Y-%m-%d')
            months_ago = (datetime.now() - latest_date).days / 30
            if months_ago <= 3:
                score += 20  # Very recent
            elif months_ago <= 6:
                score += 15
            elif months_ago <= 12:
                score += 10
        except:
            pass
    
    # Organization type preference
    org_type = lead.get('type', '').lower()
    if org_type == 'gemeente':
        score += 15  # Preferred - faster decisions
    elif org_type == 'zbo':
        score += 10  # Good alternative
    elif 'waterschap' in org_type:
        score += 8
    # Rijksoverheid gets no bonus (slower procurement)
    
    return score

# Calculate outreach scores
for lead in leads:
    lead['outreach_score'] = calculate_outreach_score(lead)

# Filter for viable leads
viable_leads = [
    l for l in leads 
    if l.get('impactful_count', 0) >= 1  # At least 1 impactful
    and l.get('algorithm_count', 0) >= 3  # At least some activity
]

# Sort by outreach score
viable_leads.sort(key=lambda x: x['outreach_score'], reverse=True)

# Split into categories
quick_wins = []
strategic = []

for lead in viable_leads:
    algo_count = lead.get('algorithm_count', 0)
    org_type = lead.get('type', '').lower()
    
    # Quick wins: smaller orgs, gemeente/ZBO, 3-15 algorithms
    if org_type in ['gemeente', 'zbo'] and 3 <= algo_count <= 15 and len(quick_wins) < 10:
        quick_wins.append(lead)
    # Strategic: larger orgs with high value
    elif lead.get('impactful_count', 0) >= 5 and len(strategic) < 10:
        strategic.append(lead)

# Make sure we have enough
remaining = [l for l in viable_leads if l not in quick_wins and l not in strategic]
while len(quick_wins) < 10 and remaining:
    quick_wins.append(remaining.pop(0))
while len(strategic) < 10 and remaining:
    strategic.append(remaining.pop(0))

# Output results
print("=" * 80)
print("🎯 TOP 20 LEADS VOOR ALGORITMEHUB OUTREACH")
print("=" * 80)
print(f"\nGebaseerd op {len(viable_leads)} viable leads uit {len(leads)} organisaties")
print(f"Data: {data.get('source_file', 'Algoritmeregister')}")
print()

print("\n" + "=" * 80)
print("🚀 QUICK WINS (10) - Snelle beslissers, goede fit")
print("=" * 80)
print(f"{'#':<3} {'Organisatie':<40} {'Type':<12} {'Algos':<6} {'Impact':<7} {'IAMA':<5} {'Score':<6}")
print("-" * 80)

for i, lead in enumerate(quick_wins, 1):
    iama = "✓" if lead.get('has_iama') else "✗"
    print(f"{i:<3} {lead['name'][:38]:<40} {lead.get('type', '-')[:10]:<12} {lead.get('algorithm_count', 0):<6} {lead.get('impactful_count', 0):<7} {iama:<5} {lead['outreach_score']:<6}")

print("\n" + "=" * 80)
print("🏛️ STRATEGIC TARGETS (10) - Hoge waarde, sterkere referentie")
print("=" * 80)
print(f"{'#':<3} {'Organisatie':<40} {'Type':<12} {'Algos':<6} {'Impact':<7} {'IAMA':<5} {'Score':<6}")
print("-" * 80)

for i, lead in enumerate(strategic, 1):
    iama = "✓" if lead.get('has_iama') else "✗"
    print(f"{i:<3} {lead['name'][:38]:<40} {lead.get('type', '-')[:10]:<12} {lead.get('algorithm_count', 0):<6} {lead.get('impactful_count', 0):<7} {iama:<5} {lead['outreach_score']:<6}")

# Export to CSV
output_dir = Path(__file__).parent.parent / 'exports'
output_dir.mkdir(exist_ok=True)

csv_path = output_dir / 'top-20-leads.csv'
with open(csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow([
        'Rang', 'Categorie', 'Organisatie', 'Type', 'Algoritmes', 
        'Impactvol', 'Hoog Risico', 'IAMA', 'Laatste Update', 
        'Outreach Score', 'Categorieën'
    ])
    
    for i, lead in enumerate(quick_wins, 1):
        categories = ', '.join(lead.get('categories', {}).keys())
        writer.writerow([
            i, 'Quick Win', lead['name'], lead.get('type', ''),
            lead.get('algorithm_count', 0), lead.get('impactful_count', 0),
            lead.get('high_risk_count', 0), 'Ja' if lead.get('has_iama') else 'Nee',
            lead.get('latest_date', ''), lead['outreach_score'], categories
        ])
    
    for i, lead in enumerate(strategic, 1):
        categories = ', '.join(lead.get('categories', {}).keys())
        writer.writerow([
            i, 'Strategic', lead['name'], lead.get('type', ''),
            lead.get('algorithm_count', 0), lead.get('impactful_count', 0),
            lead.get('high_risk_count', 0), 'Ja' if lead.get('has_iama') else 'Nee',
            lead.get('latest_date', ''), lead['outreach_score'], categories
        ])

print(f"\n✅ CSV geëxporteerd naar: {csv_path}")

# Also create detailed JSON for dashboard
json_path = output_dir / 'top-20-leads.json'
export_data = {
    'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
    'criteria': {
        'sweet_spot_algorithms': '5-30',
        'min_impactful': 1,
        'preferred_types': ['Gemeente', 'ZBO'],
        'recent_activity_bonus': 'Last 6 months'
    },
    'quick_wins': quick_wins[:10],
    'strategic_targets': strategic[:10]
}

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(export_data, f, indent=2, ensure_ascii=False)

print(f"✅ JSON geëxporteerd naar: {json_path}")
print()
print("=" * 80)
print("💡 VOLGENDE STAPPEN:")
print("=" * 80)
print("1. Review de Quick Wins lijst - dit zijn je eerste outreach targets")
print("2. Zoek contactpersonen (DPO/CIO) via LinkedIn of algoritmeregister")
print("3. Schrijf gepersonaliseerde email per organisatie")
print("4. Strategic targets = fallback of voor later (langere sales cycle)")
print()
