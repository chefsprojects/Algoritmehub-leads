#!/usr/bin/env python3
"""
Expand exports/contact-research.json with fallback contact persons for all leads.
Uses Algoritmeregister contact emails from src/data.json and src/organizations.json.
Preserves existing manual research and only fills missing organizations.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Iterable

ROOT = Path(__file__).resolve().parent.parent
LEADS_PATH = ROOT / "src" / "data.json"
ORGS_PATH = ROOT / "src" / "organizations.json"
CONTACTS_PATH = ROOT / "exports" / "contact-research.json"

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
EMAIL_FULL_RE = re.compile(r"^[\w.+-]+@[\w-]+\.[\w.-]+$")

ROLE_RULES = [
    ("Functionaris Gegevensbescherming (FG)", re.compile(r"(^|[._-])(fg|functionaris|gegevensbescherming|privacy|dpo)([._-]|$)")),
    ("CISO", re.compile(r"(^|[._-])ciso([._-]|$)")),
    ("CIO", re.compile(r"(^|[._-])cio([._-]|$)")),
    ("Algoritmeregister contact", re.compile(r"algoritme")),
    ("Data/Informatiemanagement", re.compile(r"(data|informatie|informatiemanagement)")),
    ("Algemeen contact", re.compile(r"(info|contact|gemeente|secretariaat|postbus)")),
]


def extract_emails(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        emails: list[str] = []
        for item in value:
            emails.extend(extract_emails(item))
        return emails
    if not isinstance(value, str):
        return []
    return EMAIL_RE.findall(value)


def normalize_emails(emails: Iterable[str]) -> list[str]:
    seen = set()
    result: list[str] = []
    for email in emails:
        cleaned = email.strip().lower()
        if not cleaned or not EMAIL_FULL_RE.match(cleaned):
            continue
        if cleaned in seen:
            continue
        seen.add(cleaned)
        result.append(cleaned)
    return result


def role_for_email(email: str) -> tuple[str, int]:
    local = email.split("@", 1)[0].lower()
    for index, (role, pattern) in enumerate(ROLE_RULES):
        if pattern.search(local):
            return role, index
    return "Algemeen contact", len(ROLE_RULES)


def prioritize_emails(emails: list[str]) -> list[str]:
    return sorted(emails, key=lambda e: (role_for_email(e)[1], e))


def build_contacts(emails: list[str], max_contacts: int = 3) -> list[dict]:
    contacts = []
    for email in prioritize_emails(emails)[:max_contacts]:
        role, _ = role_for_email(email)
        contacts.append({
            "role": role,
            "name": None,
            "email": email,
            "linkedin": None,
            "notes": "Afgeleid uit Algoritmeregister",
        })
    return contacts


def collect_emails(lead: dict, org: dict | None) -> list[str]:
    emails: list[str] = []
    emails.extend(extract_emails(lead.get("contact_emails", [])))
    if org:
        emails.extend(extract_emails(org.get("contact_emails", [])))
        for algo in org.get("algorithms", []):
            emails.extend(extract_emails(algo.get("contact_email")))
    return normalize_emails(emails)


def main() -> None:
    leads_data = json.loads(LEADS_PATH.read_text(encoding="utf-8"))
    orgs_data = json.loads(ORGS_PATH.read_text(encoding="utf-8"))
    orgs = orgs_data.get("organizations", {})

    if CONTACTS_PATH.exists():
        contacts_payload = json.loads(CONTACTS_PATH.read_text(encoding="utf-8"))
    else:
        contacts_payload = {"generated_date": "", "source": "", "contacts": {}}

    contacts_map = contacts_payload.get("contacts", {})

    added = 0
    for lead in leads_data.get("leads", []):
        name = lead.get("name")
        if not name:
            continue
        if name in contacts_map:
            continue

        org = orgs.get(name)
        emails = collect_emails(lead, org)
        entry: dict = {
            "primary_email": None,
            "contacts": [],
        }

        if emails:
            prioritized = prioritize_emails(emails)
            entry["primary_email"] = prioritized[0]
            entry["contacts"] = build_contacts(prioritized)
        else:
            entry["notes"] = "Geen email gevonden in Algoritmeregister"

        contacts_map[name] = entry
        added += 1

    contacts_payload["generated_date"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    contacts_payload["source"] = "Manual research (Top 20) + Algoritmeregister derived contacts"
    contacts_payload["contacts"] = contacts_map

    CONTACTS_PATH.write_text(
        json.dumps(contacts_payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8"
    )

    print(f"✅ Added contact entries for {added} organizations")
    print(f"💾 Saved to {CONTACTS_PATH}")


if __name__ == "__main__":
    main()
