#!/usr/bin/env python3
"""
Extract AI and governance related tenders from TenderNed for browser display.
Uses word boundary matching to avoid false positives.
"""
import pandas as pd
import json
import re
from datetime import datetime

print("📂 Loading TenderNed Excel file...")
df = pd.read_excel('public/tenderned_data.xlsx', sheet_name=1)
print(f"✅ Loaded {len(df)} tenders")

# Keywords with word boundaries - more specific phrases
AI_KEYWORDS = [
    r'\bartificial intelligence\b',
    r'\bkunstmatige intelligentie\b',
    r'\bmachine learning\b',
    r'\bdeep learning\b',
    r'\bneural network\b',
    r'\bneurale netwerk\b',
    r'\bchatbot\b',
    r'\bllm\b',
    r'\blarge language model\b',
    r'\bgeneratieve ai\b',
    r'\bgenerativ\w* ai\b',
    r'\bai[-\s]systeem\b',
    r'\bai[-\s]oplossing\b',
    r'\bai[-\s]toepassing\b',
    r'\bai[-\s]model\b',
    r'\bpredictive analytics\b',
    r'\bvoorspellende analyse\b',
    r'\bautomatische besluitvorming\b',
    r'\balgoritm\w+\b',  # algoritme, algoritmisch, etc.
    r'\bdata science\b',
    r'\bcomputer vision\b',
    r'\bbeeld\s?herkenning\b',
    r'\bspraakherkenning\b',
    r'\bnatural language\b',
    r'\bnlp\b',
    r'\brobotics?\b',
    r'\brobotic process automation\b',
    r'\brpa\b',
]

GOV_KEYWORDS = [
    r'\bgovernance\b',
    r'\bcompliance\b',
    r'\bgdpr\b',
    r'\bavg\b',  # Algemene Verordening Gegevensbescherming
    r'\bprivacy\b',
    r'\binformatiebeveiliging\b',
    r'\binformation security\b',
    r'\bcyber\s?security\b',
    r'\baudit\b',
    r'\brisk management\b',
    r'\brisicobeheer\b',
    r'\bdata protection\b',
    r'\bgegevensbescherming\b',
    r'\beu ai act\b',
    r'\bai act\b',
    r'\biama\b',
    r'\bbia\b',
    r'\bdpia\b',
    r'\bdata protection impact\b',
]

ICT_KEYWORDS = [
    r'\bsoftware ontwikkeling\b',
    r'\bsoftware development\b',
    r'\bsaas\b',
    r'\bcloud computing\b',
    r'\bcloud platform\b',
    r'\bdigitalisering\b',
    r'\bdigitale transformatie\b',
    r'\bict infrastructuur\b',
    r'\bict dienstverlening\b',
    r'\bdata platform\b',
    r'\bdata warehouse\b',
    r'\bbusiness intelligence\b',
    r'\banalytics platform\b',
    r'\berp systeem\b',
    r'\bcrm systeem\b',
]

# Words to exclude (false positives)
EXCLUDE_PATTERNS = [
    r'\bmaai',  # maaibeheer, maaiwerkzaamheden
    r'\bordermail\b',
    r'\bmail\b',
    r'\bdetail\b',
    r'\baircondition',
    r'\bairco\b',
    r'\brepair\b',
    r'\bchair\b',
    r'\bstair\b',
    r'\bfair\b',
    r'\bpair\b',
    r'\bhair\b',
    r'\bdair\b',
]

def matches_category(text, patterns):
    """Check if text matches any pattern using regex word boundaries."""
    if pd.isna(text):
        return False
    text_lower = str(text).lower()
    
    # First check exclusions
    for excl in EXCLUDE_PATTERNS:
        if re.search(excl, text_lower):
            return False
    
    # Then check for matches
    for pattern in patterns:
        if re.search(pattern, text_lower, re.IGNORECASE):
            return True
    return False

def get_category(text):
    """Determine the category of a tender based on keyword patterns."""
    if matches_category(text, AI_KEYWORDS):
        return 'AI'
    elif matches_category(text, GOV_KEYWORDS):
        return 'Governance'
    elif matches_category(text, ICT_KEYWORDS):
        return 'ICT'
    return None

# Create search text from relevant columns
search_cols = ['Naam aanbesteding', 'Korte beschrijving opdracht', 'Omschrijving opdracht']
df['search_text'] = ''
for col in search_cols:
    if col in df.columns:
        df['search_text'] += ' ' + df[col].fillna('').astype(str)

# Categorize each tender
df['category'] = df['search_text'].apply(get_category)

# Filter only relevant tenders (AI, Governance, or ICT)
relevant_df = df[df['category'].notna()].copy()
print(f"📊 Found {len(relevant_df)} relevant tenders (AI/Governance/ICT)")

# Get unique columns we need
columns_to_keep = [
    'ID publicatie',
    'Publicatiedatum', 
    'Naam Aanbestedende dienst',
    'Naam aanbesteding',
    'Korte beschrijving opdracht',
    'Geraamde waarde in EUR',
    'URL TenderNed',
    'category'
]

# Keep only columns that exist
available_cols = [c for c in columns_to_keep if c in relevant_df.columns]
export_df = relevant_df[available_cols].copy()

# Convert dates to string for JSON
if 'Publicatiedatum' in export_df.columns:
    export_df['Publicatiedatum'] = pd.to_datetime(export_df['Publicatiedatum'], errors='coerce')
    export_df['year'] = export_df['Publicatiedatum'].dt.year
    export_df['Publicatiedatum'] = export_df['Publicatiedatum'].dt.strftime('%Y-%m-%d')

# Clean up values and limit description length
if 'Korte beschrijving opdracht' in export_df.columns:
    export_df['Korte beschrijving opdracht'] = export_df['Korte beschrijving opdracht'].fillna('').apply(
        lambda x: str(x)[:300] + '...' if len(str(x)) > 300 else str(x)
    )

# Convert to dict
tenders = export_df.to_dict(orient='records')

# Clean NaN values
for tender in tenders:
    for key in tender:
        if pd.isna(tender[key]):
            tender[key] = None

# Get stats
stats = {
    'total': len(tenders),
    'ai': len([t for t in tenders if t.get('category') == 'AI']),
    'governance': len([t for t in tenders if t.get('category') == 'Governance']),
    'ict': len([t for t in tenders if t.get('category') == 'ICT']),
    'years': sorted(set(t.get('year') for t in tenders if t.get('year'))),
    'organizations': len(set(t.get('Naam Aanbestedende dienst') for t in tenders if t.get('Naam Aanbestedende dienst'))),
}

output = {
    'generated_date': datetime.now().strftime('%Y-%m-%d'),
    'stats': stats,
    'tenders': tenders
}

# Save to JSON
output_path = 'src/tenders.json'
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\n📈 Export Summary:")
print(f"   • Total relevant tenders: {stats['total']}")
print(f"   • AI-related: {stats['ai']}")
print(f"   • Governance-related: {stats['governance']}")
print(f"   • ICT-related: {stats['ict']}")
print(f"   • Unique organizations: {stats['organizations']}")
print(f"   • Year range: {min(stats['years'])} - {max(stats['years'])}")
print(f"\n💾 Saved to: {output_path}")
print(f"   File size: {len(json.dumps(output)) / 1024 / 1024:.1f} MB")
print("\n✅ Done!")
