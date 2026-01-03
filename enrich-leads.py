#!/usr/bin/env python3
"""
Process TenderNed data and enrich existing leads with buying signals.
"""
import pandas as pd
import json
import os
from collections import defaultdict

print("📂 Loading TenderNed Excel file...")
df = pd.read_excel('public/tenderned_data.xlsx', sheet_name=1)
print(f"✅ Loaded {len(df)} tenders from TenderNed")

# Load existing leads
with open('src/data.json', 'r') as f:
    existing_data = json.load(f)

print(f"📊 Loaded {len(existing_data['leads'])} existing leads")

# Keywords for matching
AI_KEYWORDS = ['ai', 'artificial intelligence', 'kunstmatige intelligentie', 'algoritme', 'algorithm', 
               'machine learning', 'deep learning', 'neural', 'chatbot', 'llm', 'generatieve ai']
GOV_KEYWORDS = ['governance', 'compliance', 'gdpr', 'avg', 'privacy', 'informatiebeveiliging', 
                'security', 'audit', 'risk', 'risico', 'eu ai act', 'ai act', 'iama']
ICT_KEYWORDS = ['ict', 'software', 'saas', 'cloud', 'digitalisering', 'informatisering', 
                'applicatie', 'systeem', 'platform', 'analytics']

def matches_keywords(text, keywords):
    """Check if text contains any of the keywords."""
    if pd.isna(text):
        return False
    text_lower = str(text).lower()
    return any(kw.lower() in text_lower for kw in keywords)

# Create search field combining relevant columns
df['search_text'] = ''
search_cols = ['Naam aanbesteding', 'Omschrijving opdracht', 'Korte beschrijving opdracht']
for col in search_cols:
    if col in df.columns:
        df['search_text'] += ' ' + df[col].fillna('').astype(str)

# Categorize each tender
df['is_ai'] = df['search_text'].apply(lambda x: matches_keywords(x, AI_KEYWORDS))
df['is_gov'] = df['search_text'].apply(lambda x: matches_keywords(x, GOV_KEYWORDS))
df['is_ict'] = df['search_text'].apply(lambda x: matches_keywords(x, ICT_KEYWORDS))

# Get year from publication date
df['year'] = pd.to_datetime(df['Publicatiedatum'], errors='coerce').dt.year

# Aggregate by organization
org_col = 'Naam Aanbestedende dienst'
if org_col not in df.columns:
    org_col = 'Officiële naam Aanbestedende dienst'

agg_data = df.groupby(org_col).agg({
    'ID publicatie': 'count',
    'is_ai': 'sum',
    'is_gov': 'sum',
    'is_ict': 'sum',
    'year': lambda x: set(x.dropna().astype(int)) if len(x.dropna()) > 0 else set()
}).reset_index()

agg_data.columns = ['org_name', 'total', 'ai', 'governance', 'ict', 'years']

# Convert to dict for easy lookup
org_tenders = {}
for _, row in agg_data.iterrows():
    name = str(row['org_name']).lower().strip()
    org_tenders[name] = {
        'original': row['org_name'],
        'total': int(row['total']),
        'ai': int(row['ai']),
        'governance': int(row['governance']),
        'ict': int(row['ict']),
        'recent': any(y >= 2024 for y in row['years'] if isinstance(y, (int, float)))
    }

print(f"📊 Found {len(org_tenders)} unique organizations in TenderNed data")

# Print some stats
ai_orgs = sum(1 for v in org_tenders.values() if v['ai'] > 0)
gov_orgs = sum(1 for v in org_tenders.values() if v['governance'] > 0)
print(f"   • {ai_orgs} organizations with AI-related tenders")
print(f"   • {gov_orgs} organizations with governance-related tenders")

# Match with existing leads
matched_count = 0
enriched_count = 0

def find_best_match(lead_name, org_dict):
    """Find the best matching organization for a lead."""
    lead_lower = lead_name.lower()
    
    # Try exact match first
    if lead_lower in org_dict:
        return org_dict[lead_lower]
    
    # Try contains match
    best_match = None
    best_score = 0
    
    for org_name, data in org_dict.items():
        # Check various matching strategies
        match_score = 0
        
        # Check if lead name is in org name or vice versa
        if lead_lower in org_name or org_name in lead_lower:
            match_score = data['total'] + (data['ai'] * 10) + (data['governance'] * 5)
        
        # Check for gemeente/province name
        simplified_lead = lead_lower.replace('gemeente ', '').replace('provincie ', '').strip()
        simplified_org = org_name.replace('gemeente ', '').replace('provincie ', '').strip()
        
        if simplified_lead in simplified_org or simplified_org in simplified_lead:
            match_score = data['total'] + (data['ai'] * 10) + (data['governance'] * 5)
        
        if match_score > best_score:
            best_score = match_score
            best_match = data
    
    return best_match

enriched_leads = []
for lead in existing_data['leads']:
    match = find_best_match(lead['name'], org_tenders)
    
    if match:
        matched_count += 1
        
        # Calculate buying signal (0-15 points)
        buying_signal = 0
        if match['ai'] > 0:
            buying_signal += min(15, match['ai'] * 5)
        elif match['governance'] > 0:
            buying_signal += min(10, match['governance'] * 3)
        elif match['ict'] > 0:
            buying_signal += min(5, match['ict'])
        
        # Recency bonus
        if match['recent']:
            buying_signal = min(15, buying_signal + 3)
        
        if buying_signal > 0 or match['total'] > 5:
            enriched_count += 1
        
        enriched_lead = {
            **lead,
            'tender_count': match['total'],
            'tender_ai': match['ai'],
            'tender_governance': match['governance'],
            'tender_ict': match['ict'],
            'buying_signal': buying_signal,
            'lead_score_original': lead['lead_score'],
            'lead_score': min(100, lead['lead_score'] + int(buying_signal * 0.5))
        }
    else:
        enriched_lead = {
            **lead,
            'tender_count': 0,
            'tender_ai': 0,
            'tender_governance': 0,
            'tender_ict': 0,
            'buying_signal': 0,
            'lead_score_original': lead['lead_score']
        }
    
    enriched_leads.append(enriched_lead)

# Sort by new score
enriched_leads.sort(key=lambda x: x['lead_score'], reverse=True)

# Create output
enriched_data = {
    'generated_date': pd.Timestamp.now().strftime('%Y-%m-%d'),
    'total_leads': len(enriched_leads),
    'total_algorithms': existing_data['total_algorithms'],
    'matched_with_tenderned': matched_count,
    'enriched_with_signals': enriched_count,
    'leads': enriched_leads
}

# Save
with open('src/data_enriched.json', 'w', encoding='utf-8') as f:
    json.dump(enriched_data, f, indent=2, ensure_ascii=False)

print(f"\n📈 Enrichment Summary:")
print(f"   • Total leads: {len(enriched_leads)}")
print(f"   • Matched with TenderNed: {matched_count}")
print(f"   • Enriched with buying signals: {enriched_count}")
print(f"\n💾 Saved to: src/data_enriched.json")

print("\n🏆 Top 10 Leads (with buying signals):")
for i, lead in enumerate(enriched_leads[:10]):
    signal = '🔥' if lead['buying_signal'] > 0 else '📊'
    print(f"   {i+1}. {lead['name']} - Score: {lead['lead_score']} (was {lead['lead_score_original']}) {signal} AI:{lead['tender_ai']} Gov:{lead['tender_governance']}")

print("\n✅ Done!")
