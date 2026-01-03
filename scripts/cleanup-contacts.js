#!/usr/bin/env node
const fs = require('fs');

const filepath = './exports/contact-research.json';
const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

// Patterns to identify garbage contact names
const garbagePatterns = [
    /^Cookie-instellingen/i,
    /^Props Details Context/i,
    /^Sreact\.fragment/i,
    /CharAt CodeAt/i,
    /^Contactgegevens E-mail/i,
    /^Het Klantcontactcentrum/i,
    /^De Mediawet$/i,
    /^Van Den Haag$/i,
    /^Vanaf NLdoc De$/i,
    /^Om Door ID\'s$/i,
    /^Justis Nederland Verklaring$/i,
    /^[A-Z]{20,}/,  // Long random uppercase strings
];

function isGarbageName(name) {
    if (!name) return false;
    return garbagePatterns.some(pattern => pattern.test(name));
}

let removedCount = 0;
let orgsModified = 0;

Object.keys(data.contacts).forEach(orgName => {
    const org = data.contacts[orgName];
    if (org.contacts && Array.isArray(org.contacts)) {
        const originalLength = org.contacts.length;
        org.contacts = org.contacts.filter(contact => {
            if (isGarbageName(contact.name)) {
                console.log(`Removing: "${contact.name}" from ${orgName}`);
                removedCount++;
                return false;
            }
            return true;
        });
        if (org.contacts.length !== originalLength) {
            orgsModified++;
        }
    }
});

// Update date
data.generated_date = new Date().toISOString().replace('T', ' ').substring(0, 16);

fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
console.log(`\nRemoved ${removedCount} garbage entries from ${orgsModified} organizations.`);
