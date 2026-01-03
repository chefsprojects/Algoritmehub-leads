'use client';

import { useState, useEffect } from 'react';
import topLeadsData from '../../exports/top-20-leads.json';
import contactResearchData from '../../exports/contact-research.json';
import { OrganizationDetail } from './OrganizationDetail';
import {
    LeadStatus,
    statusConfig,
    getAllTracking,
    saveLeadTracking,
    generateEmailTemplate
} from '@/lib/leadTracking';

interface TopLead {
    name: string;
    type: string;
    algorithm_count: number;
    impactful_count: number;
    high_risk_count: number;
    has_iama: boolean;
    latest_date: string | null;
    first_date: string | null;
    lead_score: number;
    priority: string;
    outreach_score: number;
    categories: Record<string, number | undefined>;
    recent_algorithms?: Array<{ name: string; date: string | null; category: string }>;
    contact_emails?: string[];
    websites?: string[];
}

interface TopLeadsData {
    generated_date: string;
    criteria: {
        sweet_spot_algorithms: string;
        min_impactful: number;
        preferred_types: string[];
        recent_activity_bonus: string;
    };
    quick_wins: TopLead[];
    strategic_targets: TopLead[];
}

interface ContactPerson {
    role: string;
    name: string | null;
    email: string | null;
    linkedin: string | null;
    notes: string | null;
}

interface OrgContactData {
    primary_email: string | null;
    contacts: ContactPerson[];
    notes?: string;
}

interface ContactResearchData {
    contacts: Record<string, OrgContactData>;
}

const data = topLeadsData as unknown as TopLeadsData;
const contactResearch = contactResearchData as unknown as ContactResearchData;

export function Top20Dashboard() {
    const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'quick_wins' | 'strategic'>('quick_wins');
    const [expandedLead, setExpandedLead] = useState<string | null>(null);
    const [trackingData, setTrackingData] = useState<Record<string, { status: LeadStatus; notes: string }>>({});
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [notesText, setNotesText] = useState('');

    // Load tracking data
    useEffect(() => {
        setTrackingData(getAllTracking());
    }, []);

    const leads = activeTab === 'quick_wins' ? data.quick_wins : data.strategic_targets;

    const updateStatus = (leadName: string, status: LeadStatus) => {
        saveLeadTracking(leadName, { status });
        setTrackingData(prev => ({
            ...prev,
            [leadName]: { ...prev[leadName], status, notes: prev[leadName]?.notes || '' }
        }));
    };

    const saveNotes = (leadName: string) => {
        saveLeadTracking(leadName, { notes: notesText });
        setTrackingData(prev => ({
            ...prev,
            [leadName]: { ...prev[leadName], notes: notesText, status: prev[leadName]?.status || 'new' }
        }));
        setEditingNotes(null);
    };

    const [sendingEmail, setSendingEmail] = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState<Record<string, boolean>>({});

    const sendEmail = async (lead: TopLead) => {
        const email = lead.contact_emails?.[0];
        if (!email) {
            alert('Geen email adres beschikbaar');
            return;
        }

        setSendingEmail(lead.name);

        try {
            const { subject, body } = generateEmailTemplate(lead);

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: email,
                    subject,
                    body,
                    leadName: lead.name,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setEmailSent(prev => ({ ...prev, [lead.name]: true }));
                updateStatus(lead.name, 'contacted');

                // Save email to notes
                const timestamp = new Date().toLocaleString('nl-NL');
                const noteUpdate = `[${timestamp}] Email verzonden naar ${email}`;
                saveLeadTracking(lead.name, {
                    notes: trackingData[lead.name]?.notes
                        ? `${trackingData[lead.name].notes}\n\n${noteUpdate}`
                        : noteUpdate,
                    lastContactDate: new Date().toISOString()
                });
                setTrackingData(prev => ({
                    ...prev,
                    [lead.name]: {
                        ...prev[lead.name],
                        notes: prev[lead.name]?.notes
                            ? `${prev[lead.name].notes}\n\n${noteUpdate}`
                            : noteUpdate
                    }
                }));
            } else {
                alert(`Fout bij verzenden: ${result.error}`);
            }
        } catch (error) {
            console.error('Email error:', error);
            alert('Fout bij verzenden van email');
        } finally {
            setSendingEmail(null);
        }
    };

    const getLeadStatus = (name: string): LeadStatus => {
        return trackingData[name]?.status || 'new';
    };

    // Count statuses
    const allLeads = [...data.quick_wins, ...data.strategic_targets];
    const statusCounts = {
        contacted: allLeads.filter(l => ['contacted', 'replied', 'meeting', 'proposal'].includes(getLeadStatus(l.name))).length,
        new: allLeads.filter(l => getLeadStatus(l.name) === 'new').length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Top 20 Outreach Leads</h2>
                        <p className="text-slate-500 text-sm mt-1">Geselecteerd op basis van sweet spot criteria</p>
                    </div>
                    <div className="text-sm text-slate-400">
                        {data.generated_date}
                    </div>
                </div>

                {/* Tracking Stats */}
                <div className="flex gap-4 text-sm">
                    <span className="text-slate-500">
                        📧 <strong>{statusCounts.contacted}</strong> gecontacteerd
                    </span>
                    <span className="text-slate-500">
                        ⬜ <strong>{statusCounts.new}</strong> nieuw
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                    <div className="text-2xl font-bold text-slate-800">10</div>
                    <div className="text-xs text-slate-500">Quick Wins</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                    <div className="text-2xl font-bold text-slate-800">10</div>
                    <div className="text-xs text-slate-500">Strategic</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                    <div className="text-2xl font-bold text-slate-800">
                        {data.quick_wins.filter(l => !l.has_iama).length + data.strategic_targets.filter(l => !l.has_iama).length}
                    </div>
                    <div className="text-xs text-slate-500">Zonder IAMA</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 text-center">
                    <div className="text-2xl font-bold text-slate-800">
                        {data.quick_wins.reduce((sum, l) => sum + l.impactful_count, 0) +
                            data.strategic_targets.reduce((sum, l) => sum + l.impactful_count, 0)}
                    </div>
                    <div className="text-xs text-slate-500">Impactvol</div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('quick_wins')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'quick_wins'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    Quick Wins
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${activeTab === 'quick_wins' ? 'bg-white/20' : 'bg-slate-100'}`}>10</span>
                </button>
                <button
                    onClick={() => setActiveTab('strategic')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${activeTab === 'strategic'
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                        }`}
                >
                    Strategic Targets
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs ${activeTab === 'strategic' ? 'bg-white/20' : 'bg-slate-100'}`}>10</span>
                </button>
            </div>

            {/* Leads Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-12">#</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Organisatie</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-36">Contactpersoon</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-44">Email</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-16">LinkedIn</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-28">Status</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-16">Algos</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-16">Impact</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-16">IAMA</th>
                            <th className="w-10"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.map((lead, index) => {
                            const status = getLeadStatus(lead.name);
                            const config = statusConfig[status];
                            const orgContact = contactResearch.contacts[lead.name];
                            const namedContacts = orgContact?.contacts.filter(c => c.name) || [];
                            const primaryContact = namedContacts[0];
                            const linkedInContact = namedContacts.find(c => c.linkedin);

                            return (
                                <>
                                    <tr
                                        key={lead.name}
                                        className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition ${expandedLead === lead.name ? 'bg-slate-50' : ''}`}
                                        onClick={() => setExpandedLead(expandedLead === lead.name ? null : lead.name)}
                                    >
                                        <td className="px-4 py-3 text-sm font-medium text-slate-400">{index + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-800">{lead.name}</div>
                                            <div className="text-xs text-slate-400">{lead.type}</div>
                                        </td>
                                        {/* Contactpersoon Column */}
                                        <td className="px-4 py-2">
                                            {primaryContact ? (
                                                <div>
                                                    <div className="text-sm font-medium text-slate-700 truncate" title={primaryContact.name || ''}>
                                                        {primaryContact.name}
                                                    </div>
                                                    <div className="text-xs text-slate-400 truncate" title={primaryContact.role}>
                                                        {primaryContact.role}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                        {/* Email Column */}
                                        <td className="px-4 py-2">
                                            {orgContact?.primary_email ? (
                                                <a
                                                    href={`mailto:${orgContact.primary_email}`}
                                                    className="text-sm text-blue-600 hover:underline block truncate"
                                                    title={orgContact.primary_email}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {orgContact.primary_email}
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                        {/* LinkedIn Column */}
                                        <td className="px-4 py-2 text-center">
                                            {linkedInContact?.linkedin ? (
                                                <a
                                                    href={linkedInContact.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800"
                                                    title={`${linkedInContact.name} - LinkedIn`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                                    </svg>
                                                </a>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <select
                                                value={status}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    updateStatus(lead.name, e.target.value as LeadStatus);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`text-xs px-2 py-1 rounded border-0 cursor-pointer ${config.color}`}
                                            >
                                                {Object.entries(statusConfig).map(([key, val]) => (
                                                    <option key={key} value={key}>{val.icon} {val.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium text-slate-700">{lead.algorithm_count}</td>
                                        <td className="px-4 py-3 text-center font-medium text-slate-700">{lead.impactful_count}</td>
                                        <td className="px-4 py-3 text-center">
                                            {lead.has_iama ? <span className="text-slate-400">✓</span> : <span className="text-red-500">✗</span>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <svg
                                                className={`w-4 h-4 text-slate-400 transition-transform ${expandedLead === lead.name ? 'rotate-180' : ''}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </td>
                                    </tr>

                                    {/* Expanded Row */}
                                    {expandedLead === lead.name && (
                                        <tr key={`${lead.name}-expanded`}>
                                            <td colSpan={10} className="bg-slate-50 px-4 py-4 border-b border-slate-200">
                                                <div className="grid md:grid-cols-3 gap-6">
                                                    {/* Contact & Actions */}
                                                    <div>
                                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Contact & Acties</h4>
                                                        {lead.contact_emails && lead.contact_emails.length > 0 ? (
                                                            <div className="space-y-2">
                                                                <a
                                                                    href={`mailto:${lead.contact_emails[0]}`}
                                                                    className="text-sm text-blue-600 hover:underline block"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {lead.contact_emails[0]}
                                                                </a>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        sendEmail(lead);
                                                                    }}
                                                                    disabled={sendingEmail === lead.name}
                                                                    className={`px-3 py-1.5 rounded text-sm transition ${emailSent[lead.name]
                                                                        ? 'bg-green-600 text-white'
                                                                        : sendingEmail === lead.name
                                                                            ? 'bg-slate-400 text-white cursor-wait'
                                                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                                                        }`}
                                                                >
                                                                    {sendingEmail === lead.name
                                                                        ? '⏳ Verzenden...'
                                                                        : emailSent[lead.name]
                                                                            ? '✅ Verzonden'
                                                                            : '📧 Stuur Email'}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">Geen email</span>
                                                        )}
                                                    </div>

                                                    {/* Notes */}
                                                    <div>
                                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Notities</h4>
                                                        {editingNotes === lead.name ? (
                                                            <div className="space-y-2">
                                                                <textarea
                                                                    value={notesText}
                                                                    onChange={(e) => setNotesText(e.target.value)}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-full px-2 py-1 text-sm border border-slate-200 rounded resize-none"
                                                                    rows={3}
                                                                    placeholder="Voeg notitie toe..."
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            saveNotes(lead.name);
                                                                        }}
                                                                        className="px-2 py-1 bg-slate-900 text-white rounded text-xs"
                                                                    >
                                                                        Opslaan
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingNotes(null);
                                                                        }}
                                                                        className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs"
                                                                    >
                                                                        Annuleer
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setNotesText(trackingData[lead.name]?.notes || '');
                                                                    setEditingNotes(lead.name);
                                                                }}
                                                                className="text-sm text-slate-600 cursor-pointer hover:bg-white p-2 rounded border border-dashed border-slate-200 min-h-[60px]"
                                                            >
                                                                {trackingData[lead.name]?.notes || <span className="text-slate-400">Klik om notitie toe te voegen...</span>}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Categories */}
                                                    <div>
                                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Categorieën</h4>
                                                        <div className="flex flex-wrap gap-1">
                                                            {Object.entries(lead.categories || {}).map(([cat, count]) => (
                                                                <span key={cat} className="bg-white px-2 py-1 rounded text-xs text-slate-600 border border-slate-200">
                                                                    {cat} ({count})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Contactpersonen Section */}
                                                {contactResearch.contacts[lead.name]?.contacts && contactResearch.contacts[lead.name].contacts.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                                        <h4 className="text-xs font-medium text-slate-500 uppercase mb-3">👤 Contactpersonen (onderzoek)</h4>
                                                        <div className="grid gap-2 md:grid-cols-2">
                                                            {contactResearch.contacts[lead.name].contacts.map((contact, idx) => (
                                                                <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200">
                                                                    <div className="flex items-start justify-between">
                                                                        <div>
                                                                            <div className="font-medium text-slate-800 text-sm">
                                                                                {contact.name || <span className="text-slate-400 italic">Naam onbekend</span>}
                                                                            </div>
                                                                            <div className="text-xs text-slate-500">{contact.role}</div>
                                                                            {contact.email && (
                                                                                <a
                                                                                    href={`mailto:${contact.email}`}
                                                                                    className="text-xs text-blue-600 hover:underline block mt-1"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    {contact.email}
                                                                                </a>
                                                                            )}
                                                                            {contact.notes && (
                                                                                <div className="text-xs text-slate-400 mt-1">{contact.notes}</div>
                                                                            )}
                                                                        </div>
                                                                        {contact.linkedin && (
                                                                            <a
                                                                                href={contact.linkedin}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="flex-shrink-0 ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition"
                                                                            >
                                                                                LinkedIn
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* More Actions */}
                                                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedOrg(lead.name);
                                                        }}
                                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-sm hover:bg-slate-50 transition"
                                                    >
                                                        Bekijk Details
                                                    </button>
                                                    <a
                                                        href={`https://algoritmes.overheid.nl/nl/algoritmes?organisatie=${encodeURIComponent(lead.name)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded text-sm hover:bg-slate-50 transition"
                                                    >
                                                        Algoritmeregister →
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Organization Detail Modal */}
            {selectedOrg && (
                <OrganizationDetail
                    orgName={selectedOrg}
                    onClose={() => setSelectedOrg(null)}
                />
            )}
        </div>
    );
}
