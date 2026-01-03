const data = require('../exports/contact-research.json');

const orgsWithoutLinkedIn = [];

Object.entries(data.contacts).forEach(([org, info]) => {
    const contacts = info.contacts || [];
    // Check if there's any named contact with a direct LinkedIn profile (not just a search link)
    const hasDirectLinkedIn = contacts.some(c =>
        c.name &&
        c.linkedin &&
        c.linkedin.includes('linkedin.com/in/')
    );

    if (!hasDirectLinkedIn) {
        const namedContacts = contacts.filter(c => c.name);
        const searchLinks = contacts.filter(c => c.linkedin && c.linkedin.includes('search/results'));
        orgsWithoutLinkedIn.push({
            org,
            namedContacts: namedContacts.length,
            searchLinks: searchLinks.length,
            totalContacts: contacts.length,
            names: namedContacts.map(c => `${c.name} (${c.role})`).slice(0, 3)
        });
    }
});

// Sort by namedContacts descending (prioritize orgs with named contacts but no LinkedIn)
orgsWithoutLinkedIn.sort((a, b) => b.namedContacts - a.namedContacts);

console.log(`Organizations without direct LinkedIn profiles: ${orgsWithoutLinkedIn.length}`);
console.log('\nTop 30 organizations to enrich:');
orgsWithoutLinkedIn.slice(0, 30).forEach((o, i) => {
    console.log(`${i + 1}. ${o.org}`);
    console.log(`   Named: ${o.namedContacts}, Search links: ${o.searchLinks}`);
    if (o.names.length > 0) {
        console.log(`   Contacts: ${o.names.join(', ')}`);
    }
});
