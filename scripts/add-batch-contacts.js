const fs = require('fs');
const filepath = '../exports/contact-research.json';
const data = require(filepath);

// Batch 14 contacts to add
const updates = {
    "Gemeente Olst-Wijhe": {
        contacts: [
            {
                "role": "Gemeentesecretaris / Algemeen directeur",
                "name": "Sjoerd van den Berg",
                "email": null,
                "linkedin": "https://www.linkedin.com/search/results/all/?keywords=sjoerd%20van%20den%20berg%20olst-wijhe",
                "notes": "Gemeentesecretaris sinds november 2024"
            }
        ]
    },
    "Gemeente Oost Gelre": {
        contacts: [
            {
                "role": "Gemeentesecretaris",
                "name": "Jeroen Heerkens",
                "email": null,
                "linkedin": "https://www.linkedin.com/search/results/all/?keywords=jeroen%20heerkens%20oost%20gelre",
                "notes": "Gemeentesecretaris sinds mei 2020, penningmeester VGS"
            }
        ]
    },
    "Gemeente Bernheze": {
        contacts: [
            {
                "role": "Gemeentesecretaris",
                "name": "Peggy Hurkmans",
                "email": null,
                "linkedin": "https://www.linkedin.com/search/results/all/?keywords=peggy%20hurkmans%20bernheze",
                "notes": "Gemeentesecretaris sinds december 2019, DB-lid VGS"
            }
        ]
    },
    "Gemeente Berkelland": {
        contacts: [
            {
                "role": "Gemeentesecretaris / Algemeen directeur",
                "name": "Janien Jonker",
                "email": null,
                "linkedin": "https://www.linkedin.com/search/results/all/?keywords=janien%20jonker%20berkelland",
                "notes": "Gemeentesecretaris sinds mei 2024"
            }
        ]
    },
    "Gemeente Hellendoorn": {
        contacts: [
            {
                "role": "Gemeentesecretaris / Algemeen directeur",
                "name": "Adrie Ouwehand",
                "email": null,
                "linkedin": "https://www.linkedin.com/search/results/all/?keywords=adrie%20ouwehand%20hellendoorn",
                "notes": "Gemeentesecretaris sinds december 2023"
            }
        ]
    }
};

// Update contacts
Object.keys(updates).forEach(orgName => {
    if (data.contacts[orgName]) {
        const existingContacts = data.contacts[orgName].contacts || [];
        const newContacts = updates[orgName].contacts;
        data.contacts[orgName].contacts = [...newContacts, ...existingContacts];
        data.contacts[orgName].last_checked_online = "2026-01-02 20:38";
        console.log(`Updated: ${orgName}`);
    } else {
        console.log(`Not found: ${orgName}`);
    }
});

fs.writeFileSync(require.resolve(filepath), JSON.stringify(data, null, 4));
console.log('\nDone!');
