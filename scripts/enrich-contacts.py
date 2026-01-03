#!/usr/bin/env python3
"""
Enrich leads with contact information.
- Generates standard contact emails for municipalities
- Fetches organization pages for contact details
"""

import json
import re
from pathlib import Path

# Load current data
data_path = Path(__file__).parent.parent / 'src' / 'data.json'
org_path = Path(__file__).parent.parent / 'src' / 'organizations.json'

with open(data_path, 'r') as f:
    lead_data = json.load(f)

with open(org_path, 'r') as f:
    org_data = json.load(f)

def generate_gemeente_email(name: str) -> dict:
    """Generate standard email patterns for municipalities."""
    # Extract gemeente name
    gemeente_name = name.replace('Gemeente ', '').lower()
    
    # Handle special characters
    gemeente_slug = gemeente_name.replace(' ', '').replace(',', '').replace("'", '')
    gemeente_slug = gemeente_slug.replace('ë', 'e').replace('ï', 'i').replace('ö', 'o')
    gemeente_slug = gemeente_slug.replace('é', 'e').replace('è', 'e')
    
    # Common patterns
    emails = [
        f"info@{gemeente_slug}.nl",
        f"gemeente@{gemeente_slug}.nl",
    ]
    
    website = f"https://www.{gemeente_slug}.nl"
    
    return {
        'email': emails[0],
        'email_alternatives': emails,
        'website': website,
        'contact_role': 'Algemeen contact',
        'source': 'generated'
    }

def generate_zbo_contact(name: str) -> dict:
    """Generate contact info for ZBOs and other organizations."""
    # Map known organizations
    known_contacts = {
        'Stichting Inlichtingenbureau': {
            'email': 'info@inlichtingenbureau.nl',
            'website': 'https://www.inlichtingenbureau.nl',
            'contact_role': 'Algemeen contact'
        },
        'Dienst Toeslagen': {
            'email': 'toeslagen@belastingdienst.nl',
            'website': 'https://www.toeslagen.nl',
            'contact_role': 'Algemeen contact'
        },
        'UWV': {
            'email': 'info@uwv.nl',
            'website': 'https://www.uwv.nl',
            'contact_role': 'Algemeen contact'
        },
        'Belastingdienst': {
            'email': 'info@belastingdienst.nl',
            'website': 'https://www.belastingdienst.nl',
            'contact_role': 'Algemeen contact'
        },
        'Douane': {
            'email': 'info@douane.nl',
            'website': 'https://www.douane.nl',
            'contact_role': 'Algemeen contact'
        },
        'Raad voor de Kinderbescherming': {
            'email': 'info@rvdk.nl',
            'website': 'https://www.kinderbescherming.nl',
            'contact_role': 'Algemeen contact'
        },
        'Uitvoeringsinstituut Werknemersverzekeringen': {
            'email': 'info@uwv.nl',
            'website': 'https://www.uwv.nl',
            'contact_role': 'Algemeen contact'
        },
        'Omgevingsdienst Noordzeekanaalgebied': {
            'email': 'info@odnzkg.nl',
            'website': 'https://www.odnzkg.nl',
            'contact_role': 'Algemeen contact'
        },
    }
    
    if name in known_contacts:
        return {**known_contacts[name], 'source': 'manual'}
    
    return None

def enrich_lead(lead: dict) -> dict:
    """Add contact information to a lead."""
    org_type = lead.get('type', '')
    name = lead.get('name', '')
    
    contact = None
    
    if org_type == 'Gemeente' or name.startswith('Gemeente '):
        contact = generate_gemeente_email(name)
    else:
        contact = generate_zbo_contact(name)
    
    if contact:
        lead['contact'] = contact
    else:
        # Generate a placeholder
        lead['contact'] = {
            'email': None,
            'website': None,
            'contact_role': None,
            'source': 'not_found',
            'note': 'Handmatig opzoeken via LinkedIn of organisatie website'
        }
    
    return lead

# Enrich all leads
print("🔄 Enriching leads with contact information...")
enriched_count = 0
for lead in lead_data['leads']:
    enrich_lead(lead)
    if lead.get('contact', {}).get('email'):
        enriched_count += 1

print(f"✅ {enriched_count}/{len(lead_data['leads'])} leads with contact info")

# Save updated data
with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(lead_data, f, indent=2, ensure_ascii=False)

print(f"✅ Saved to {data_path}")

# Also update organizations.json
for org_name, org in org_data['organizations'].items():
    # Find matching lead
    matching_lead = next((l for l in lead_data['leads'] if l['name'] == org_name), None)
    if matching_lead and matching_lead.get('contact'):
        org['contact'] = matching_lead['contact']

with open(org_path, 'w', encoding='utf-8') as f:
    json.dump(org_data, f, indent=2, ensure_ascii=False)

print(f"✅ Saved to {org_path}")

# Show some examples
print("\n📋 Voorbeeld contactgegevens:")
print("-" * 60)
for lead in lead_data['leads'][:10]:
    contact = lead.get('contact', {})
    email = contact.get('email', 'N/A')
    source = contact.get('source', 'unknown')
    print(f"  {lead['name'][:35]:<35} | {email:<30} [{source}]")
