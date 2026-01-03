const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Load existing leads
const leadsPath = path.join(__dirname, 'src', 'data.json');
const existingData = JSON.parse(fs.readFileSync(leadsPath, 'utf-8'));

// Load TenderNed data
console.log('📂 Loading TenderNed Excel file (this may take a moment)...');
const workbook = XLSX.readFile(path.join(__dirname, 'public', 'tenderned_data.xlsx'));
const sheetName = workbook.SheetNames[0];
const tenderData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log(`✅ Loaded ${tenderData.length} tenders from TenderNed`);

// Keywords to search for AI/governance related tenders
const aiKeywords = ['ai', 'artificial intelligence', 'kunstmatige intelligentie', 'algoritme', 'algorithm', 'machine learning', 'deep learning', 'neural', 'chatbot', 'llm'];
const govKeywords = ['governance', 'compliance', 'gdpr', 'avg', 'privacy', 'informatiebeveiliging', 'security', 'audit', 'risk', 'risico'];
const ictKeywords = ['ict', 'software', 'saas', 'cloud', 'digitalisering', 'informatisering', 'applicatie', 'systeem'];

// Helper to check if tender matches keywords
function matchesKeywords(tender, keywords) {
    const searchFields = [
        tender['Naam opdracht'] || '',
        tender['Omschrijving'] || '',
        tender['Onderwerp'] || '',
        tender['Titel'] || '',
        tender['CPV-code omschrijving'] || ''
    ].join(' ').toLowerCase();

    return keywords.some(kw => searchFields.includes(kw.toLowerCase()));
}

// Find tenders per organization
const orgTenders = {};

tenderData.forEach(tender => {
    const orgName = tender['Aanbestedende dienst'] || tender['Naam organisatie'] || '';
    if (!orgName) return;

    // Normalize organization name
    const normalizedName = orgName.toLowerCase().trim();

    if (!orgTenders[normalizedName]) {
        orgTenders[normalizedName] = {
            original: orgName,
            total: 0,
            ai: 0,
            governance: 0,
            ict: 0,
            recentYears: new Set()
        };
    }

    orgTenders[normalizedName].total++;

    // Check categories
    if (matchesKeywords(tender, aiKeywords)) orgTenders[normalizedName].ai++;
    if (matchesKeywords(tender, govKeywords)) orgTenders[normalizedName].governance++;
    if (matchesKeywords(tender, ictKeywords)) orgTenders[normalizedName].ict++;

    // Track years
    const year = tender['Jaar'] || tender['Publicatiedatum']?.substring(0, 4);
    if (year && parseInt(year) >= 2023) {
        orgTenders[normalizedName].recentYears.add(year);
    }
});

console.log(`📊 Found ${Object.keys(orgTenders).length} unique organizations in TenderNed data`);

// Match with existing leads
let matchedCount = 0;
let enrichedCount = 0;

const enrichedLeads = existingData.leads.map(lead => {
    // Try to match by name (fuzzy matching)
    const leadNameLower = lead.name.toLowerCase();

    let bestMatch = null;
    let bestScore = 0;

    for (const [normalizedName, data] of Object.entries(orgTenders)) {
        // Check for exact or partial match
        if (normalizedName.includes(leadNameLower) || leadNameLower.includes(normalizedName)) {
            const score = data.total + (data.ai * 10) + (data.governance * 5) + (data.ict * 2);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = data;
            }
        }

        // Also check for gemeente/province name extraction
        const leadNameParts = leadNameLower.replace('gemeente ', '').replace('provincie ', '');
        if (normalizedName.includes(leadNameParts)) {
            const score = data.total + (data.ai * 10) + (data.governance * 5) + (data.ict * 2);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = data;
            }
        }
    }

    if (bestMatch) {
        matchedCount++;

        // Calculate buying signal score (0-15 points)
        let buyingSignal = 0;
        if (bestMatch.ai > 0) buyingSignal += Math.min(15, bestMatch.ai * 5); // Max 15 for AI
        else if (bestMatch.governance > 0) buyingSignal += Math.min(10, bestMatch.governance * 3); // Max 10 for governance
        else if (bestMatch.ict > 0) buyingSignal += Math.min(5, bestMatch.ict); // Max 5 for ICT

        // Recency bonus
        if (bestMatch.recentYears.has('2025') || bestMatch.recentYears.has('2024')) {
            buyingSignal = Math.min(15, buyingSignal + 3);
        }

        // Only add if there's a meaningful buying signal
        if (buyingSignal > 0 || bestMatch.total > 5) {
            enrichedCount++;
            return {
                ...lead,
                tender_count: bestMatch.total,
                tender_ai: bestMatch.ai,
                tender_governance: bestMatch.governance,
                tender_ict: bestMatch.ict,
                buying_signal: buyingSignal,
                // Recalculate lead score with buying signals
                lead_score_original: lead.lead_score,
                lead_score: Math.min(100, lead.lead_score + Math.round(buyingSignal * 0.5))
            };
        }
    }

    return {
        ...lead,
        tender_count: 0,
        tender_ai: 0,
        tender_governance: 0,
        tender_ict: 0,
        buying_signal: 0,
        lead_score_original: lead.lead_score
    };
});

// Sort by new lead score
enrichedLeads.sort((a, b) => b.lead_score - a.lead_score);

// Create enriched data file
const enrichedData = {
    generated_date: new Date().toISOString().split('T')[0],
    total_leads: enrichedLeads.length,
    total_algorithms: existingData.total_algorithms,
    matched_with_tenderned: matchedCount,
    enriched_with_signals: enrichedCount,
    leads: enrichedLeads
};

// Save to new file
const outputPath = path.join(__dirname, 'src', 'data_enriched.json');
fs.writeFileSync(outputPath, JSON.stringify(enrichedData, null, 2));

console.log('\n📈 Enrichment Summary:');
console.log(`   • Total leads: ${enrichedLeads.length}`);
console.log(`   • Matched with TenderNed: ${matchedCount}`);
console.log(`   • Enriched with buying signals: ${enrichedCount}`);
console.log(`\n💾 Saved to: ${outputPath}`);

// Show top 10 leads by new score
console.log('\n🏆 Top 10 Leads (with buying signals):');
enrichedLeads.slice(0, 10).forEach((lead, i) => {
    const signalEmoji = lead.buying_signal > 0 ? '🔥' : '📊';
    console.log(`   ${i + 1}. ${lead.name} - Score: ${lead.lead_score} (was ${lead.lead_score_original}) ${signalEmoji} AI: ${lead.tender_ai}, Gov: ${lead.tender_governance}`);
});

console.log('\n✅ Done! Data enriched with TenderNed buying signals.');
