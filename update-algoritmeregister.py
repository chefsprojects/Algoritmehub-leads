#!/usr/bin/env python3
"""
Update lead data from new Algoritmeregister CSV.
Adds enhanced fields: latest date, impactful count, algorithms list.
"""
import pandas as pd
import json
from datetime import datetime
from collections import defaultdict

CSV_PATH = '/Users/zahedashkara/Desktop/Gepubliceerde algoritmes 2026-1-2.csv'

print("📂 Loading Algoritmeregister CSV...")
df = pd.read_csv(CSV_PATH, encoding='utf-8')
print(f"✅ Loaded {len(df)} algorithms")

# Parse dates
df['publication_dt'] = pd.to_datetime(df['publication_dt'], errors='coerce')
df['begin_date'] = pd.to_datetime(df['begin_date'], errors='coerce')

# Identify impactful/high-risk
df['is_impactful'] = df['publication_category'].str.contains('Impactvolle', case=False, na=False)
df['is_high_risk'] = df['name'].str.contains('AI|machine learning|deep learning|neural|algoritm', case=False, na=False) | \
                      df['description_short'].str.contains('AI|machine learning|deep learning|neural|algoritm', case=False, na=False)
df['has_iama'] = df['impacttoetsen'].notna() & (df['impacttoetsen'] != '')

# Group by organization
orgs = defaultdict(lambda: {
    'algorithms': [],
    'count': 0,
    'impactful_count': 0,
    'high_risk_count': 0, 
    'has_iama': False,
    'latest_date': None,
    'first_date': None,
    'categories': defaultdict(int),
    'statuses': defaultdict(int),
    'contact_emails': set(),
    'websites': set()
})

for _, row in df.iterrows():
    org = str(row['organization']).strip()
    if not org or org == 'nan':
        continue
    
    # Algorithm record
    algo = {
        'name': row['name'],
        'description': row['description_short'][:200] if pd.notna(row['description_short']) else '',
        'category': row['category'] if pd.notna(row['category']) else '',
        'status': row['status'] if pd.notna(row['status']) else '',
        'goal': row['goal'][:300] if pd.notna(row['goal']) else '',
        'provider': row['provider'] if pd.notna(row['provider']) else '',
        'publication_category': row['publication_category'] if pd.notna(row['publication_category']) else '',
        'publication_date': row['publication_dt'].strftime('%Y-%m-%d') if pd.notna(row['publication_dt']) else None,
        'begin_date': row['begin_date'].strftime('%Y-%m-%d') if pd.notna(row['begin_date']) else None,
        'has_lawful_basis': pd.notna(row['lawful_basis']) and len(str(row['lawful_basis'])) > 5,
        'is_impactful': bool(row['is_impactful']),
        'algorithm_id': int(row['algorithm_id']) if pd.notna(row['algorithm_id']) else None,
        'contact_email': str(row['contact_email']).strip() if pd.notna(row['contact_email']) else None,
        'website': str(row['website']).strip() if pd.notna(row['website']) else None
    }
    
    orgs[org]['algorithms'].append(algo)
    orgs[org]['count'] += 1
    
    if row['is_impactful']:
        orgs[org]['impactful_count'] += 1
    if row['is_high_risk']:
        orgs[org]['high_risk_count'] += 1
    if row['has_iama']:
        orgs[org]['has_iama'] = True
    
    # Track dates
    if pd.notna(row['publication_dt']):
        pub_date = row['publication_dt']
        if orgs[org]['latest_date'] is None or pub_date > orgs[org]['latest_date']:
            orgs[org]['latest_date'] = pub_date
        if orgs[org]['first_date'] is None or pub_date < orgs[org]['first_date']:
            orgs[org]['first_date'] = pub_date
    
    # Categories and statuses
    if pd.notna(row['category']):
        orgs[org]['categories'][row['category']] += 1
    if pd.notna(row['status']):
        orgs[org]['statuses'][row['status']] += 1
    
    # Collect contact info
    if pd.notna(row['contact_email']) and '@' in str(row['contact_email']):
        # Extract email from potentially messy field
        email_raw = str(row['contact_email']).strip()
        # Find first email in the string
        import re
        email_match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', email_raw)
        if email_match:
            orgs[org]['contact_emails'].add(email_match.group().lower())
    if pd.notna(row['website']) and row['website'].startswith('http'):
        orgs[org]['websites'].add(str(row['website']).strip())

print(f"📊 Found {len(orgs)} unique organizations")

# Convert to final format
organizations = {}
for org_name, data in orgs.items():
    # Sort algorithms by date (most recent first)
    data['algorithms'].sort(key=lambda x: x['publication_date'] or '1970-01-01', reverse=True)
    
    organizations[org_name] = {
        'name': org_name,
        'algorithm_count': data['count'],
        'impactful_count': data['impactful_count'],
        'high_risk_count': data['high_risk_count'],
        'has_iama': data['has_iama'],
        'latest_date': data['latest_date'].strftime('%Y-%m-%d') if data['latest_date'] else None,
        'first_date': data['first_date'].strftime('%Y-%m-%d') if data['first_date'] else None,
        'categories': dict(data['categories']),
        'statuses': dict(data['statuses']),
        'algorithms': data['algorithms'],
        'contact_emails': list(data['contact_emails']),
        'websites': list(data['websites'])
    }

# Calculate lead scores
def calculate_lead_score(org):
    score = 0
    # Base: algorithm count (cap at 30)
    score += min(30, org['algorithm_count'] * 3)
    # Impactful bonus (cap at 30)
    score += min(30, org['impactful_count'] * 6)
    # High-risk bonus
    score += min(20, org['high_risk_count'] * 4)
    # IAMA presence
    if not org['has_iama'] and org['impactful_count'] > 0:
        score += 10  # Missing IAMA = opportunity
    # Recency bonus
    if org['latest_date']:
        latest = datetime.strptime(org['latest_date'], '%Y-%m-%d')
        if latest.year >= 2025:
            score += 10
        elif latest.year >= 2024:
            score += 5
    return min(100, score)

# Create leads from organizations
leads = []
for org_name, org_data in organizations.items():
    lead_score = calculate_lead_score(org_data)
    
    # Determine priority/tier
    if lead_score >= 70:
        priority = 'Hot'
    elif lead_score >= 50:
        priority = 'Warm'
    elif lead_score >= 30:
        priority = 'Medium'
    else:
        priority = 'Low'
    
    lead = {
        'name': org_name,
        'type': 'Gemeente' if 'gemeente' in org_name.lower() else 
                'Rijk' if any(x in org_name.lower() for x in ['ministerie', 'rijks', 'belasting', 'uwv', 'svb', 'duo', 'cjib']) else
                'Provincie' if 'provincie' in org_name.lower() else
                'ZBO' if any(x in org_name.lower() for x in ['autoriteit', 'college', 'raad', 'bureau']) else
                'Overig',
        'algorithm_count': org_data['algorithm_count'],
        'impactful_count': org_data['impactful_count'],
        'high_risk_count': org_data['high_risk_count'],
        'has_iama': org_data['has_iama'],
        'latest_date': org_data['latest_date'],
        'first_date': org_data['first_date'],
        'lead_score': lead_score,
        'priority': priority,
        'categories': org_data['categories'],
        # Contact info from Algoritmeregister
        'contact_emails': org_data['contact_emails'],
        'websites': org_data['websites'],
        # Recent 3 algorithms for quick preview
        'recent_algorithms': [
            {'name': a['name'], 'date': a['publication_date'], 'category': a['category']}
            for a in org_data['algorithms'][:3]
        ]
    }
    leads.append(lead)

# Sort by lead score
leads.sort(key=lambda x: x['lead_score'], reverse=True)

# Output data
output = {
    'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
    'source_file': 'Gepubliceerde algoritmes 2026-1-2.csv',
    'total_algorithms': len(df),
    'total_leads': len(leads),
    'leads': leads
}

# Save leads
with open('src/data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

# Save full organization details (for detail pages)
org_output = {
    'generated_date': datetime.now().strftime('%Y-%m-%d %H:%M'),
    'organizations': organizations
}
with open('src/organizations.json', 'w', encoding='utf-8') as f:
    json.dump(org_output, f, indent=2, ensure_ascii=False)

# Stats
print(f"\n📈 Update Summary:")
print(f"   • Total algorithms: {len(df)}")
print(f"   • Total organizations (leads): {len(leads)}")
print(f"   • Hot leads (score ≥70): {sum(1 for l in leads if l['lead_score'] >= 70)}")
print(f"   • Warm leads (score ≥50): {sum(1 for l in leads if 50 <= l['lead_score'] < 70)}")
print(f"   • Impactful algorithms: {sum(organizations[o]['impactful_count'] for o in organizations)}")

print(f"\n💾 Saved to:")
print(f"   • src/data.json (leads)")
print(f"   • src/organizations.json (full details)")

print(f"\n🏆 Top 10 Leads:")
for i, lead in enumerate(leads[:10]):
    print(f"   {i+1}. {lead['name']} - Score: {lead['lead_score']} ({lead['priority']}) - {lead['algorithm_count']} algos, {lead['impactful_count']} impactful")

print("\n✅ Done!")
