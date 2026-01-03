const data = require('../exports/contact-research.json');
const topLeadsData = require('../exports/top-20-leads.json');

// Combine quick_wins and strategic_targets
const allLeads = [...topLeadsData.quick_wins, ...topLeadsData.strategic_targets];

// Also check all contacts in contact-research
const allOrgs = Object.keys(data.contacts);

// Find ones without named contacts
const missing = allLeads.filter(lead => {
    const org = data.contacts[lead.name];
    if (!org) return true;
    const namedContacts = org.contacts?.filter(c => c.name) || [];
    return namedContacts.length === 0;
});

console.log('Organizations without named contacts (Top 50 by score):');
missing.forEach((m, i) => {
    console.log(`${i + 1}. ${m.name} (score: ${m.lead_score})`);
});
console.log(`\nTotal: ${missing.length} organizations need contact research`);
