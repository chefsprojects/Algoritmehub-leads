const fs = require('fs');
const filepath = '../exports/contact-research.json';
const data = require(filepath);

// LinkedIn profile updates - Direct profile URLs found through research
const linkedinUpdates = [
    {
        org: "Gemeente Rotterdam",
        name: "Peter den Held",
        linkedin: "https://linkedin.com/in/peter-den-held-b755864"
    },
    {
        org: "Uitvoeringsinstituut Werknemersverzekeringen",
        name: "Maarten Jonker",
        linkedin: "https://linkedin.com/in/maartenjonker"
    }
];

let updatedCount = 0;

linkedinUpdates.forEach(update => {
    const orgData = data.contacts[update.org];
    if (!orgData) {
        console.log(`Organization not found: ${update.org}`);
        return;
    }

    const contacts = orgData.contacts || [];
    const contact = contacts.find(c => c.name === update.name);

    if (contact) {
        const oldLinkedin = contact.linkedin;
        contact.linkedin = update.linkedin;
        orgData.last_checked_online = "2026-01-03 13:30";
        console.log(`Updated ${update.name} at ${update.org}`);
        console.log(`  Old: ${oldLinkedin}`);
        console.log(`  New: ${update.linkedin}`);
        updatedCount++;
    } else {
        console.log(`Contact not found: ${update.name} at ${update.org}`);
    }
});

// Save the file
fs.writeFileSync(require.resolve(filepath), JSON.stringify(data, null, 4));
console.log(`\nDone! Updated ${updatedCount} LinkedIn profiles.`);
