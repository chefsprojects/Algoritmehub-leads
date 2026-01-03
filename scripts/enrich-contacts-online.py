#!/usr/bin/env python3
"""
Online contact enrichment from official organization websites.
Adds contact persons to exports/contact-research.json using public pages.
"""

from __future__ import annotations

import argparse
import json
import re
import time
import ssl
from datetime import datetime
from html import unescape
from pathlib import Path
from typing import Iterable
from urllib.parse import quote_plus, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
LEADS_PATH = ROOT / "src" / "data.json"
ORGS_PATH = ROOT / "src" / "organizations.json"
CONTACTS_PATH = ROOT / "exports" / "contact-research.json"

USER_AGENT = "Mozilla/5.0 (compatible; AlgoritmehubContactBot/1.0)"
FETCH_TIMEOUT = 6
MAX_HTML_BYTES = 2_000_000
DEFAULT_MAX_PAGES = 4
DEFAULT_DELAY = 0.2
DEFAULT_LIMIT = 0
DEFAULT_CHECKPOINT = 10

EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+", re.I)
HREF_RE = re.compile(r'href=["\']([^"\']+)["\']', re.I)
MAILTO_RE = re.compile(
    r'<a[^>]+href=["\']mailto:([^"\']+?)["\'][^>]*>(.*?)</a>',
    re.I | re.S
)

KEYWORD_PATHS = [
    "/contact",
    "/contacten",
    "/contactgegevens",
    "/contactformulier",
    "/privacy",
    "/privacyverklaring",
    "/privacybeleid",
    "/gegevensbescherming",
    "/functionaris-gegevensbescherming",
    "/fg",
    "/dpo",
    "/organisatie",
    "/bestuur",
    "/directie",
    "/management",
    "/over-ons",
]

KEYWORD_LINKS = [
    "privacy",
    "gegevensbescherming",
    "functionaris",
    "fg",
    "dpo",
    "contact",
    "bestuur",
    "directie",
    "management",
    "organisatie",
    "over-ons",
    "algoritme",
]

ROLE_RULES = [
    ("Functionaris Gegevensbescherming (FG)", re.compile(r"(fg|functionaris|gegevensbescherming|privacy|dpo)", re.I)),
    ("CISO", re.compile(r"(ciso|informatiebeveilig)", re.I)),
    ("CIO", re.compile(r"(cio|chief information)", re.I)),
    ("Algoritmeregister contact", re.compile(r"algoritme", re.I)),
    ("Data/Informatiemanagement", re.compile(r"(data|informatie|informatiemanagement)", re.I)),
    ("Algemeen contact", re.compile(r"(info|contact|gemeente|secretariaat|postbus)", re.I)),
]

ROLE_KEYWORDS = {
    "Functionaris Gegevensbescherming (FG)": [
        "functionaris gegevensbescherming",
        "gegevensbescherming",
        "privacy officer",
        "privacyfunctionaris",
        "fg",
        "dpo",
    ],
    "CISO": [
        "ciso",
        "informatiebeveiliging",
        "security officer",
    ],
    "CIO": [
        "cio",
        "chief information officer",
        "informatiemanager",
    ],
}

GENERIC_LINK_TEXT = {
    "e-mail",
    "email",
    "mail",
    "contact",
    "meer informatie",
    "stuur een e-mail",
    "stuur een email",
}

LOWER_PREFIXES = {"van", "de", "der", "den", "ter", "ten", "von", "v.d.", "v.d", "v/d", "'t"}
NO_REPLY_TOKENS = ("noreply", "no-reply", "donotreply", "do-not-reply")
SCRIPT_STYLE_RE = re.compile(r"<(script|style)[^>]*>.*?</\\1>", re.I | re.S)
BR_RE = re.compile(r"<br\\s*/?>", re.I)


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
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
    return result


def is_auto_contact(contact: dict) -> bool:
    note = (contact.get("notes") or "").lower()
    return "afgeleid" in note or "algoritmeregister" in note or "found on" in note


def role_for_email(email: str) -> str:
    local = email.split("@", 1)[0].lower()
    for role, pattern in ROLE_RULES:
        if pattern.search(local):
            return role
    return "Algemeen contact"


def role_from_url(url: str) -> str | None:
    lower = url.lower()
    for role, pattern in ROLE_RULES:
        if pattern.search(lower):
            return role
    return None


def role_from_context(html_lower: str, email: str) -> str | None:
    index = html_lower.find(email.lower())
    if index == -1:
        return None
    window = html_lower[max(0, index - 200): index + 200]
    for role, pattern in ROLE_RULES:
        if pattern.search(window):
            return role
    return None


def looks_like_name(text: str) -> bool:
    cleaned = " ".join(text.split())
    if len(cleaned) < 4 or "@" in cleaned:
        return False
    if cleaned.lower() in GENERIC_LINK_TEXT:
        return False
    words = cleaned.split()
    if len(words) < 2 or len(words) > 5:
        return False
    for word in words:
        if word.lower() in LOWER_PREFIXES:
            continue
        if re.match(r"^[A-Z][a-zA-Z.'-]+$", word):
            continue
        if re.match(r"^[A-Z]\.$", word):
            continue
        return False
    return True


def strip_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", html)


def html_to_lines(html: str) -> list[str]:
    cleaned = SCRIPT_STYLE_RE.sub(" ", html)
    cleaned = BR_RE.sub("\n", cleaned)
    cleaned = cleaned.replace("</p>", "\n").replace("</li>", "\n").replace("</div>", "\n")
    text = unescape(strip_tags(cleaned))
    lines = [line.strip() for line in text.splitlines()]
    return [line for line in lines if line]


def extract_mailto_names(html: str) -> dict[str, str]:
    names: dict[str, str] = {}
    for match in MAILTO_RE.finditer(html):
        email_raw, anchor = match.groups()
        email = EMAIL_RE.findall(email_raw)
        if not email:
            continue
        email = email[0].lower()
        text = unescape(strip_tags(anchor))
        text = " ".join(text.split()).strip()
        if looks_like_name(text):
            names[email] = text
    return names


def extract_named_contacts(html: str, org_name: str, url: str, add_linkedin: bool) -> list[dict]:
    contacts: list[dict] = []
    lines = html_to_lines(html)
    lower_lines = [line.lower() for line in lines]

    def extract_name_from_line(line: str) -> str | None:
        if ":" in line:
            candidate = line.split(":", 1)[1].strip()
            if looks_like_name(candidate):
                return candidate
        if " - " in line:
            candidate = line.split(" - ", 1)[1].strip()
            if looks_like_name(candidate):
                return candidate
        tokens = re.findall(r"[A-Z][a-zA-Z.'-]+", line)
        if len(tokens) >= 2:
            candidate = " ".join(tokens[:3])
            if looks_like_name(candidate):
                return candidate
        return None

    for idx, line_lower in enumerate(lower_lines):
        for role, keywords in ROLE_KEYWORDS.items():
            if any(keyword in line_lower for keyword in keywords):
                name = extract_name_from_line(lines[idx])
                if not name and idx + 1 < len(lines):
                    name = extract_name_from_line(lines[idx + 1])
                if name:
                    contact = {
                        "role": role,
                        "name": name,
                        "email": None,
                        "linkedin": linkedin_search_url(name, org_name) if add_linkedin else None,
                        "notes": f"Found on {url}",
                    }
                    contacts.append(contact)
    return contacts


def fetch_html(url: str) -> str | None:
    req = Request(url, headers={"User-Agent": USER_AGENT})
    try:
        context = ssl.create_default_context()
        with urlopen(req, timeout=FETCH_TIMEOUT, context=context) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if content_type and "text/html" not in content_type:
                return None
            raw = resp.read(MAX_HTML_BYTES)
            charset = "utf-8"
            if "charset=" in content_type:
                charset = content_type.split("charset=")[-1].split(";")[0].strip()
            return raw.decode(charset, errors="ignore")
    except Exception:
        return None


def canonical_base(url: str) -> str | None:
    if not url:
        return None
    parsed = urlparse(url)
    if not parsed.scheme:
        parsed = urlparse("https://" + url)
    if not parsed.netloc:
        return None
    return f"{parsed.scheme}://{parsed.netloc}"


def collect_base_urls(lead: dict, org: dict | None) -> list[str]:
    candidates = []
    for source in (lead, org or {}):
        for site in source.get("websites", []) or []:
            base = canonical_base(site)
            if base:
                candidates.append(base)
    if not candidates:
        emails = normalize_emails(extract_emails(lead.get("contact_emails", [])))
        if org:
            emails += normalize_emails(extract_emails(org.get("contact_emails", [])))
        emails = normalize_emails(emails)
        for email in emails:
            domain = email.split("@")[-1]
            base = canonical_base(domain)
            if base:
                candidates.append(base)
    return list(dict.fromkeys(candidates))


def extract_links(html: str, base_url: str) -> list[str]:
    parsed_base = urlparse(base_url)
    links: list[str] = []
    for href in HREF_RE.findall(html):
        href = unescape(href.strip())
        if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        absolute = urljoin(base_url + "/", href)
        parsed = urlparse(absolute)
        if parsed.netloc != parsed_base.netloc:
            continue
        if any(keyword in absolute.lower() for keyword in KEYWORD_LINKS):
            links.append(absolute.split("#")[0])
    return list(dict.fromkeys(links))


def prioritize_emails(emails: list[str]) -> list[str]:
    def score(email: str) -> int:
        role = role_for_email(email)
        for index, (rule_role, _) in enumerate(ROLE_RULES):
            if role == rule_role:
                return index
        return len(ROLE_RULES)

    return sorted(emails, key=lambda e: (score(e), e))


def needs_research(entry: dict | None) -> bool:
    if not entry:
        return True
    contacts = entry.get("contacts") or []
    if not contacts:
        return True
    if all(is_auto_contact(c) for c in contacts):
        return True
    return not has_specific_person(contacts)


def has_specific_person(contacts: list[dict]) -> bool:
    for contact in contacts:
        if contact.get("name") and (contact.get("email") or contact.get("linkedin")):
            return True
    return False


def contact_key(contact: dict) -> tuple | None:
    email = (contact.get("email") or "").strip().lower()
    if email:
        return ("email", email)
    name = (contact.get("name") or "").strip().lower()
    role = (contact.get("role") or "").strip().lower()
    if name and role:
        return ("name_role", name, role)
    return None


def has_contact_key(contacts: list[dict], key: tuple) -> bool:
    for contact in contacts:
        if contact_key(contact) == key:
            return True
    return False


def merge_contact(entry: dict, candidate: dict) -> None:
    contacts = entry.setdefault("contacts", [])
    email = candidate.get("email")
    if email and any(token in email.lower() for token in NO_REPLY_TOKENS):
        return
    if not email and not candidate.get("name"):
        return
    for existing in contacts:
        if email and (existing.get("email") or "").lower() == email.lower():
            if existing.get("name") is None and candidate.get("name"):
                existing["name"] = candidate["name"]
            if is_auto_contact(existing) and existing.get("role") == "Algemeen contact" and candidate.get("role"):
                existing["role"] = candidate["role"]
            if existing.get("linkedin") is None and candidate.get("linkedin"):
                existing["linkedin"] = candidate["linkedin"]
            return
    key = contact_key(candidate)
    if key and has_contact_key(contacts, key):
        return
    contacts.append(candidate)


def linkedin_search_url(name: str, org_name: str) -> str:
    query = f"{name} {org_name}".strip()
    return f"https://www.linkedin.com/search/results/all/?keywords={quote_plus(query)}"


def enrich_org(name: str, lead: dict, org: dict | None, entry: dict, max_pages: int, delay: float, add_linkedin: bool) -> int:
    added = 0
    base_urls = collect_base_urls(lead, org)
    for base_url in base_urls:
        homepage = fetch_html(base_url)
        if homepage is None and base_url.startswith("https://"):
            homepage = fetch_html(base_url.replace("https://", "http://", 1))
        if homepage is None:
            continue

        mailto_names = extract_mailto_names(homepage)
        candidate_urls = [urljoin(base_url, path) for path in KEYWORD_PATHS]
        candidate_urls += extract_links(homepage, base_url)
        candidate_urls = list(dict.fromkeys(candidate_urls))[:max_pages]

        for url in candidate_urls:
            html = fetch_html(url)
            if html is None:
                continue
            html_lower = html.lower()
            mailto_names.update(extract_mailto_names(html))
            emails = normalize_emails(EMAIL_RE.findall(html))
            for email in prioritize_emails(emails):
                role = role_from_url(url) or role_from_context(html_lower, email) or role_for_email(email)
                name_guess = mailto_names.get(email)
                linkedin = None
                if add_linkedin and name_guess:
                    linkedin = linkedin_search_url(name_guess, name)
                contact = {
                    "role": role,
                    "name": name_guess,
                    "email": email,
                    "linkedin": linkedin,
                    "notes": f"Found on {url}",
                }
                before = len(entry.get("contacts") or [])
                merge_contact(entry, contact)
                after = len(entry.get("contacts") or [])
                if after > before:
                    added += 1
            named_contacts = extract_named_contacts(html, name, url, add_linkedin)
            for contact in named_contacts:
                before = len(entry.get("contacts") or [])
                merge_contact(entry, contact)
                after = len(entry.get("contacts") or [])
                if after > before:
                    added += 1
            time.sleep(delay)
    if entry.get("primary_email") is None and entry.get("contacts"):
        emails = [c.get("email") for c in entry["contacts"] if c.get("email")]
        if emails:
            entry["primary_email"] = prioritize_emails(emails)[0]
    return added


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Online contact enrichment from org websites.")
    parser.add_argument("--max-pages", type=int, default=DEFAULT_MAX_PAGES, help="Max pages per org base url")
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY, help="Delay between requests (seconds)")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT, help="Limit number of orgs to process (0 = all)")
    parser.add_argument("--start", type=int, default=0, help="Skip the first N leads (for resume)")
    parser.add_argument("--checkpoint", type=int, default=DEFAULT_CHECKPOINT, help="Write progress every N orgs")
    parser.add_argument("--all", action="store_true", help="Process all orgs, not just missing/auto contacts")
    parser.add_argument("--force", action="store_true", help="Re-check orgs even if already checked online")
    parser.add_argument("--no-linkedin", action="store_true", help="Do not add LinkedIn search links")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    leads_data = json.loads(LEADS_PATH.read_text(encoding="utf-8"))
    orgs_data = json.loads(ORGS_PATH.read_text(encoding="utf-8"))
    orgs = orgs_data.get("organizations", {})

    if CONTACTS_PATH.exists():
        contacts_payload = json.loads(CONTACTS_PATH.read_text(encoding="utf-8"))
    else:
        contacts_payload = {"generated_date": "", "source": "", "contacts": {}}

    contacts_map = contacts_payload.get("contacts", {})
    total_added = 0
    processed = 0
    skipped = 0
    leads = leads_data.get("leads", [])
    total_targets = len(leads)
    run_timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

    def save_checkpoint() -> None:
        contacts_payload["generated_date"] = run_timestamp
        contacts_payload["source"] = "Manual research + Algoritmeregister + online org sites"
        contacts_payload["contacts"] = contacts_map
        CONTACTS_PATH.write_text(
            json.dumps(contacts_payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8"
        )

    for index, lead in enumerate(leads, start=1):
        if args.start and index <= args.start:
            continue
        name = lead.get("name")
        if not name:
            continue
        entry = contacts_map.get(name)
        if entry and entry.get("last_checked_online") and not args.force:
            skipped += 1
            continue
        if not args.all and not needs_research(entry):
            skipped += 1
            continue
        if entry is None:
            entry = {"primary_email": None, "contacts": []}
            contacts_map[name] = entry
        processed += 1
        if args.limit and processed > args.limit:
            break
        print(f"[{processed}/{args.limit or total_targets}] {name}")
        total_added += enrich_org(
            name,
            lead,
            orgs.get(name),
            entry,
            args.max_pages,
            args.delay,
            not args.no_linkedin
        )
        entry["last_checked_online"] = run_timestamp
        if args.checkpoint and processed % args.checkpoint == 0:
            save_checkpoint()

    save_checkpoint()

    print(f"✅ Added {total_added} contact entries")
    print(f"⏭️  Skipped {skipped} organizations (already checked or not needed)")
    print(f"💾 Saved to {CONTACTS_PATH}")


if __name__ == "__main__":
    main()
