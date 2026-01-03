const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../exports/contact-research.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const missing = [];

for (const [org, info] of Object.entries(data.contacts)) {
    if (!info.contacts) continue;
    for (const contact of info.contacts) {
        // Check for real names (not generic placeholders) and missing LinkedIn
        if (contact.name &&
            contact.name !== null &&
            !contact.name.toLowerCase().includes('algemeen') &&
            !contact.name.toLowerCase().includes('e-mail') &&
            !contact.name.toLowerCase().includes('config') &&
            !contact.name.toLowerCase().includes('openingstijden') &&
            !contact.name.toLowerCase().includes('signalen') &&
            !contact.name.toLowerCase().includes('het de mocht') &&
            contact.role !== 'Algemeen contact' &&
            (!contact.linkedin || contact.linkedin === "")) {
            missing.push({
                org: org,
                name: contact.name,
                role: contact.role
            });
        }
    }
}

console.log(JSON.stringify(missing, null, 2));
