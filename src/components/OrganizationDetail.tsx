'use client';

import { useState, useMemo, useEffect } from 'react';
import organizationsData from '@/organizations.json';
import contactResearchData from '../../exports/contact-research.json';
import { ContactEditor } from './ContactEditor';
import { getOrgCustomContacts, OrganizationContacts } from '@/lib/contactManagement';

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
    phone?: string;
}

const contactResearch = contactResearchData as { contacts: Record<string, OrgContactData> };

interface Algorithm {
    name: string;
    description: string;
    category: string;
    status: string;
    goal: string;
    provider: string;
    publication_category: string;
    publication_date: string | null;
    begin_date: string | null;
    is_impactful: boolean;
    algorithm_id: number | null;
}

interface Organization {
    name: string;
    algorithm_count: number;
    impactful_count: number;
    high_risk_count: number;
    has_iama: boolean;
    latest_date: string | null;
    first_date: string | null;
    categories: Record<string, number | undefined>;
    statuses: Record<string, number>;
    algorithms: Algorithm[];
}

const data = organizationsData as { organizations: Record<string, Organization> };

interface OrganizationDetailProps {
    orgName: string;
    onClose: () => void;
}

export function OrganizationDetail({ orgName, onClose }: OrganizationDetailProps) {
    const [activeTab, setActiveTab] = useState<'algorithms' | 'insights' | 'contacts'>('algorithms');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showContactEditor, setShowContactEditor] = useState(false);
    const [customContacts, setCustomContacts] = useState<OrganizationContacts | null>(null);

    // Load custom contacts on mount and when editor closes
    useEffect(() => {
        setCustomContacts(getOrgCustomContacts(orgName));
    }, [orgName, showContactEditor]);

    const org = data.organizations[orgName];

    if (!org) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 text-center">
                    <p className="text-slate-600">Organisatie niet gevonden</p>
                    <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-200 rounded-lg">Sluiten</button>
                </div>
            </div>
        );
    }

    const filteredAlgorithms = useMemo(() => {
        let result = [...org.algorithms];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(a =>
                a.name.toLowerCase().includes(term) ||
                a.description.toLowerCase().includes(term)
            );
        }

        if (statusFilter) {
            result = result.filter(a => a.status === statusFilter);
        }

        return result;
    }, [org.algorithms, searchTerm, statusFilter]);

    const uniqueStatuses = [...new Set(org.algorithms.map(a => a.status).filter(Boolean))];

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getCategoryColor = (cat: string) => {
        const colors: Record<string, string> = {
            'Organisatie en bedrijfsvoering': 'bg-blue-100 text-blue-700',
            'Uitvoering': 'bg-green-100 text-green-700',
            'Dienstverlening': 'bg-purple-100 text-purple-700',
            'Handhaving': 'bg-red-100 text-red-700',
            'Beleid': 'bg-amber-100 text-amber-700',
        };
        return colors[cat] || 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 flex-shrink-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold">{org.name}</h2>
                            <p className="text-slate-300 mt-1">Algoritmeregister details</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-white/10 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{org.algorithm_count}</div>
                            <div className="text-xs text-slate-300">Algoritmes</div>
                        </div>
                        <div className="bg-orange-500/30 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{org.impactful_count}</div>
                            <div className="text-xs text-slate-300">Impactvol</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{formatDate(org.latest_date)}</div>
                            <div className="text-xs text-slate-300">Laatste update</div>
                        </div>
                        <div className={`${org.has_iama ? 'bg-green-500/30' : 'bg-red-500/30'} rounded-lg p-3 text-center`}>
                            <div className="text-2xl font-bold">{org.has_iama ? '✓' : '✗'}</div>
                            <div className="text-xs text-slate-300">IAMA aanwezig</div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-slate-200 px-6 flex-shrink-0">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('algorithms')}
                            className={`py-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'algorithms'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            📋 Algoritmes ({org.algorithm_count})
                        </button>
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={`py-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'insights'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            📊 Inzichten
                        </button>
                        <button
                            onClick={() => setActiveTab('contacts')}
                            className={`py-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'contacts'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            👤 Contactpersonen
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'algorithms' && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    placeholder="Zoek algoritme..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Alle statussen</option>
                                    {uniqueStatuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Algorithm List */}
                            <div className="space-y-3">
                                {filteredAlgorithms.map((algo, i) => (
                                    <div key={i} className={`border rounded-xl p-4 ${algo.is_impactful ? 'border-orange-200 bg-orange-50/30' : 'border-slate-200'}`}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-slate-800">{algo.name}</h4>
                                                    {algo.is_impactful && (
                                                        <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full font-medium">
                                                            Impactvol
                                                        </span>
                                                    )}
                                                </div>
                                                {algo.description && (
                                                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{algo.description}</p>
                                                )}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {algo.category && (
                                                        <span className={`px-2 py-0.5 text-xs rounded ${getCategoryColor(algo.category)}`}>
                                                            {algo.category}
                                                        </span>
                                                    )}
                                                    {algo.status && (
                                                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                                                            {algo.status}
                                                        </span>
                                                    )}
                                                    {algo.provider && (
                                                        <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded">
                                                            🏢 {algo.provider}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right text-xs text-slate-500 ml-4">
                                                <div>{formatDate(algo.publication_date)}</div>
                                                {algo.algorithm_id && (
                                                    <a
                                                        href={`https://algoritmes.overheid.nl/nl/algoritme/${algo.algorithm_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:underline mt-1 block"
                                                    >
                                                        Bekijk →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredAlgorithms.length === 0 && (
                                <div className="text-center py-8 text-slate-500">
                                    Geen algoritmes gevonden
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="space-y-6">
                            {/* Category Breakdown */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3">Categorieën</h3>
                                <div className="space-y-2">
                                    {Object.entries(org.categories)
                                        .filter(([, count]) => count !== undefined)
                                        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
                                        .map(([cat, count]) => (
                                            <div key={cat} className="flex items-center gap-3">
                                                <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${((count ?? 0) / org.algorithm_count) * 100}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-slate-600 w-32 text-right">{cat}</span>
                                                <span className="text-sm font-medium text-slate-800 w-8">{count ?? 0}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            {/* Status Breakdown */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3">Status</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {Object.entries(org.statuses).map(([status, count]) => (
                                        <div key={status} className="bg-slate-50 rounded-lg p-3 text-center">
                                            <div className="text-xl font-bold text-slate-800">{count}</div>
                                            <div className="text-xs text-slate-500">{status}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-3">Tijdlijn</h3>
                                <div className="bg-slate-50 rounded-lg p-4">
                                    <div className="flex justify-between text-sm">
                                        <div>
                                            <div className="text-slate-500">Eerste publicatie</div>
                                            <div className="font-medium">{formatDate(org.first_date)}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-500">Laatste publicatie</div>
                                            <div className="font-medium">{formatDate(org.latest_date)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Contacts Tab */}
                    {activeTab === 'contacts' && (
                        <div className="space-y-6">
                            {/* Edit Button */}
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowContactEditor(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    ✏️ Contacten Bewerken
                                </button>
                            </div>

                            {/* Custom Contacts Section */}
                            {customContacts?.customContacts && customContacts.customContacts.length > 0 && (
                                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-slate-800 mb-3">📝 Eigen contactpersonen</h3>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {customContacts.customContacts.map((contact) => (
                                            <div key={contact.id} className="bg-white border border-green-200 rounded-lg p-3 shadow-sm">
                                                <div className="font-medium text-slate-800">{contact.name}</div>
                                                <div className="text-sm text-green-600">{contact.role}</div>
                                                {contact.email && (
                                                    <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 hover:underline block mt-1">
                                                        📧 {contact.email}
                                                    </a>
                                                )}
                                                {contact.phone && <div className="text-sm text-slate-500 mt-1">📞 {contact.phone}</div>}
                                                {contact.linkedin && (
                                                    <a href={contact.linkedin} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                                                        LinkedIn
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {contactResearch.contacts[orgName] ? (
                                <>
                                    {/* Primary Contact Info */}
                                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-4">
                                        <h3 className="font-semibold text-slate-800 mb-3">📧 Contact Informatie</h3>
                                        <div className="space-y-2">
                                            {contactResearch.contacts[orgName].primary_email && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-500">Email:</span>
                                                    <a
                                                        href={`mailto:${contactResearch.contacts[orgName].primary_email}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {contactResearch.contacts[orgName].primary_email}
                                                    </a>
                                                </div>
                                            )}
                                            {contactResearch.contacts[orgName].phone && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-slate-500">Telefoon:</span>
                                                    <span className="text-slate-700">{contactResearch.contacts[orgName].phone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Contact Persons */}
                                    {contactResearch.contacts[orgName].contacts.length > 0 ? (
                                        <div>
                                            <h3 className="font-semibold text-slate-800 mb-3">👤 Contactpersonen (onderzoek)</h3>
                                            <div className="grid gap-3 md:grid-cols-2">
                                                {contactResearch.contacts[orgName].contacts.map((contact, idx) => (
                                                    <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-slate-800">
                                                                    {contact.name || <span className="text-slate-400 italic">Naam onbekend</span>}
                                                                </div>
                                                                <div className="text-sm text-indigo-600 mt-0.5">{contact.role}</div>
                                                                {contact.email && (
                                                                    <a
                                                                        href={`mailto:${contact.email}`}
                                                                        className="text-sm text-blue-600 hover:underline block mt-2"
                                                                    >
                                                                        📧 {contact.email}
                                                                    </a>
                                                                )}
                                                                {contact.notes && (
                                                                    <div className="text-xs text-slate-400 mt-2">{contact.notes}</div>
                                                                )}
                                                            </div>
                                                            {contact.linkedin && (
                                                                <a
                                                                    href={contact.linkedin}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex-shrink-0 ml-3 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                                                                >
                                                                    LinkedIn
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            <div className="text-4xl mb-2">📭</div>
                                            <p>Nog geen specifieke contactpersonen gevonden</p>
                                            <p className="text-sm mt-1">Gebruik de email hierboven voor contact</p>
                                        </div>
                                    )}

                                    {contactResearch.contacts[orgName].notes && (
                                        <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
                                            💡 {contactResearch.contacts[orgName].notes}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-500">
                                    <div className="text-5xl mb-3">🔍</div>
                                    <p className="font-medium">Geen contactonderzoek beschikbaar</p>
                                    <p className="text-sm mt-1">Klik op 'Contacten Bewerken' om eigen contacten toe te voegen</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contact Editor Modal */}
                    {showContactEditor && (
                        <ContactEditor
                            orgName={orgName}
                            onClose={() => setShowContactEditor(false)}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 p-4 bg-slate-50 flex-shrink-0">
                    <div className="flex justify-between items-center">
                        <a
                            href={`https://algoritmes.overheid.nl/nl/algoritme?organization=${encodeURIComponent(org.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-indigo-600 hover:underline"
                        >
                            Bekijk op Algoritmeregister →
                        </a>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition"
                        >
                            Sluiten
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
