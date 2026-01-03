'use client';

import { useState, useEffect } from 'react';

// Lead tracking statuses
export type LeadStatus = 'new' | 'contacted' | 'replied' | 'meeting' | 'proposal' | 'won' | 'lost';

export interface LeadTracking {
    status: LeadStatus;
    notes: string;
    lastContactDate: string | null;
    nextFollowUp: string | null;
    updatedAt: string;
}

const STORAGE_KEY = 'algoritmehub_lead_tracking';

// Get all tracking data
export function getAllTracking(): Record<string, LeadTracking> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

// Get tracking for a specific lead
export function getLeadTracking(leadName: string): LeadTracking | null {
    const all = getAllTracking();
    return all[leadName] || null;
}

// Save tracking for a lead
export function saveLeadTracking(leadName: string, tracking: Partial<LeadTracking>): void {
    const all = getAllTracking();
    const existing = all[leadName] || {
        status: 'new',
        notes: '',
        lastContactDate: null,
        nextFollowUp: null,
        updatedAt: new Date().toISOString()
    };

    all[leadName] = {
        ...existing,
        ...tracking,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

// Status display config
export const statusConfig: Record<LeadStatus, { label: string; color: string; icon: string }> = {
    new: { label: 'Nieuw', color: 'bg-slate-100 text-slate-600', icon: '⬜' },
    contacted: { label: 'Gecontacteerd', color: 'bg-blue-100 text-blue-700', icon: '📧' },
    replied: { label: 'Reactie', color: 'bg-green-100 text-green-700', icon: '💬' },
    meeting: { label: 'Meeting', color: 'bg-purple-100 text-purple-700', icon: '📅' },
    proposal: { label: 'Voorstel', color: 'bg-orange-100 text-orange-700', icon: '📄' },
    won: { label: 'Gewonnen', color: 'bg-emerald-100 text-emerald-700', icon: '✅' },
    lost: { label: 'Verloren', color: 'bg-red-100 text-red-700', icon: '❌' }
};

// Hook for using tracking in components
export function useLeadTracking(leadName: string) {
    const [tracking, setTracking] = useState<LeadTracking | null>(null);

    useEffect(() => {
        setTracking(getLeadTracking(leadName));
    }, [leadName]);

    const updateTracking = (updates: Partial<LeadTracking>) => {
        saveLeadTracking(leadName, updates);
        setTracking(prev => prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null);
    };

    return { tracking, updateTracking };
}

// Email template generator
export function generateEmailTemplate(lead: {
    name: string;
    algorithm_count: number;
    impactful_count: number;
    has_iama: boolean;
    contact_emails?: string[];
}): { subject: string; body: string } {
    const subject = `AI Governance ondersteuning voor ${lead.name}`;

    const body = `Beste collega,

Ik zag dat ${lead.name} ${lead.algorithm_count} algoritme${lead.algorithm_count > 1 ? 's' : ''} heeft gepubliceerd in het Algoritmeregister${lead.impactful_count > 0 ? `, waarvan ${lead.impactful_count} als impactvol aangemerkt` : ''}.

${!lead.has_iama && lead.impactful_count > 0 ? `Ik merk dat er nog geen IAMA documentatie beschikbaar is. Een Impact Assessment Mensenrechten en Algoritmes (IAMA) is verplicht voor impactvolle algoritmes onder de EU AI Act die vanaf augustus 2025 van kracht wordt.

` : ''}Wij van Algoritmehub helpen overheidsorganisaties met:
• AI governance en compliance tooling
• IAMA begeleiding en documentatie
• Algoritmeregister management

Zou u interesse hebben in een kort gesprek van 15 minuten om te bespreken hoe we ${lead.name} kunnen ondersteunen?

Met vriendelijke groet,

[Jouw naam]
Algoritmehub`;

    return { subject, body };
}
