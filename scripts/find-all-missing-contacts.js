const data = require('../exports/contact-research.json');

// Find ALL organizations without named contacts
const allOrgs = Object.keys(data.contacts);
const missing = allOrgs.filter(orgName => {
    const org = data.contacts[orgName];
    const namedContacts = org.contacts?.filter(c => c.name) || [];
    return namedContacts.length === 0;
});

console.log(`Total organizations: ${allOrgs.length}`);
console.log(`Organizations without named contacts: ${missing.length}\n`);

// Show first 30
console.log('First 30 organizations needing contact research:');
missing.slice(0, 30).forEach((name, i) => {
    console.log(`${i + 1}. ${name}`);
});

if (missing.length > 30) {
    console.log(`\n... and ${missing.length - 30} more`);
}
