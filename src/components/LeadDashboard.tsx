'use client';

import { useState, useMemo } from 'react';
import { OrganizationDetail } from './OrganizationDetail';
import contactResearchData from '../../exports/contact-research.json';

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

const contactResearch = contactResearchData as { contacts: Record<string, OrgContactData> };

interface Lead {
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
    categories: Record<string, number>;
    recent_algorithms?: Array<{ name: string; date: string | null; category: string }>;
}

interface LeadData {
    generated_date: string;
    total_algorithms: number;
    total_leads: number;
    leads: Lead[];
}

interface LeadDashboardProps {
    data: LeadData;
}

export function LeadDashboard({ data }: LeadDashboardProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [recencyFilter, setRecencyFilter] = useState('');
    const [contactFilter, setContactFilter] = useState('');
    const [sortBy, setSortBy] = useState('lead_score');
    const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Calculate stats
    const stats = useMemo(() => ({
        totalLeads: data.leads.length,
        hotLeads: data.leads.filter(l => l.priority === 'Hot').length,
        warmLeads: data.leads.filter(l => l.priority === 'Warm').length,
        totalAlgorithms: data.total_algorithms || 0,
        totalImpactful: data.leads.reduce((sum, l) => sum + (l.impactful_count || 0), 0),
    }), [data]);

    // Filter and sort leads
    const filteredLeads = useMemo(() => {
        let result = [...data.leads];

        if (searchTerm) {
            result = result.filter(l =>
                l.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (typeFilter) {
            result = result.filter(l => l.type === typeFilter);
        }

        if (priorityFilter) {
            result = result.filter(l => l.priority === priorityFilter);
        }

        // Recency filter
        if (recencyFilter) {
            const now = new Date();
            let cutoffDate: Date;
            switch (recencyFilter) {
                case 'week': cutoffDate = new Date(now.setDate(now.getDate() - 7)); break;
                case 'month': cutoffDate = new Date(now.setMonth(now.getMonth() - 1)); break;
                case '3months': cutoffDate = new Date(now.setMonth(now.getMonth() - 3)); break;
                case '6months': cutoffDate = new Date(now.setMonth(now.getMonth() - 6)); break;
                case 'year': cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
                default: cutoffDate = new Date(0);
            }
            result = result.filter(l => {
                if (!l.latest_date) return false;
                return new Date(l.latest_date) >= cutoffDate;
            });
        }

        // Contact filter
        if (contactFilter) {
            result = result.filter(l => {
                const orgContact = contactResearch.contacts[l.name];
                const namedContacts = orgContact?.contacts.filter(c => c.name) || [];
                const hasEmail = !!orgContact?.primary_email;
                const hasLinkedIn = namedContacts.some(c => c.linkedin);

                switch (contactFilter) {
                    case 'named': return namedContacts.length > 0;
                    case 'email-only': return hasEmail && namedContacts.length === 0;
                    case 'linkedin': return hasLinkedIn;
                    case 'none': return !hasEmail && namedContacts.length === 0;
                    default: return true;
                }
            });
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case 'lead_score': return b.lead_score - a.lead_score;
                case 'algorithm_count': return b.algorithm_count - a.algorithm_count;
                case 'impactful_count': return (b.impactful_count || 0) - (a.impactful_count || 0);
                case 'latest_date':
                    if (!a.latest_date) return 1;
                    if (!b.latest_date) return -1;
                    return b.latest_date.localeCompare(a.latest_date);
                case 'name': return a.name.localeCompare(b.name);
                default: return b.lead_score - a.lead_score;
            }
        });

        return result;
    }, [data.leads, searchTerm, typeFilter, priorityFilter, recencyFilter, contactFilter, sortBy]);

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Alle Leads</h2>
                        <p className="text-slate-500 text-sm mt-1">Organisaties uit het Algoritmeregister</p>
                    </div>
                </div>

                {/* Stats - minimal */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800">{stats.totalLeads}</div>
                        <div className="text-xs text-slate-500">Organisaties</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800">{stats.hotLeads}</div>
                        <div className="text-xs text-slate-500">Hot Leads</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800">{stats.totalImpactful}</div>
                        <div className="text-xs text-slate-500">Impactvol</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-slate-800">{stats.totalAlgorithms.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">Algoritmes</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-64 max-w-md">
                    <input
                        type="text"
                        placeholder="Zoek organisatie..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all text-sm"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer text-sm"
                >
                    <option value="">Alle types</option>
                    <option value="Gemeente">Gemeente</option>
                    <option value="Provincie">Provincie</option>
                    <option value="ZBO">ZBO</option>
                    <option value="Overig">Overig</option>
                </select>
                <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer text-sm"
                >
                    <option value="">Alle prioriteiten</option>
                    <option value="Hot">Hot</option>
                    <option value="Warm">Warm</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <select
                    value={recencyFilter}
                    onChange={(e) => setRecencyFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer text-sm"
                >
                    <option value="">Alle updates</option>
                    <option value="week">Laatste week</option>
                    <option value="month">Laatste maand</option>
                    <option value="3months">Laatste 3 maanden</option>
                    <option value="6months">Laatste 6 maanden</option>
                    <option value="year">Laatste jaar</option>
                </select>
                <select
                    value={contactFilter}
                    onChange={(e) => setContactFilter(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer text-sm"
                >
                    <option value="">Alle contacten</option>
                    <option value="named">Met contactpersoon</option>
                    <option value="linkedin">Met LinkedIn</option>
                    <option value="email-only">Alleen email</option>
                    <option value="none">Geen contact</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer text-sm"
                >
                    <option value="lead_score">Score</option>
                    <option value="algorithm_count">Algoritmes</option>
                    <option value="impactful_count">Impactvol</option>
                    <option value="latest_date">Datum</option>
                    <option value="name">Naam</option>
                </select>
                <span className="text-sm text-slate-500">
                    {filteredLeads.length} resultaten
                </span>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Organisatie</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-40">Contactpersoon</th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-48">Email</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-20">LinkedIn</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-20">Priority</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-16">Algos</th>
                            <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide w-16">Score</th>
                            <th className="w-16"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
                            const startIndex = (currentPage - 1) * itemsPerPage;
                            const pagedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);
                            return pagedLeads.map((lead) => {
                                const orgContact = contactResearch.contacts[lead.name];
                                const namedContacts = orgContact?.contacts.filter(c => c.name) || [];
                                const primaryContact = namedContacts[0];
                                const linkedInContact = namedContacts.find(c => c.linkedin);

                                return (
                                    <tr
                                        key={lead.name}
                                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                                    >
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelectedOrg(lead.name)}
                                                className="font-medium text-slate-800 hover:text-slate-600 hover:underline text-left"
                                            >
                                                {lead.name}
                                            </button>
                                            <div className="text-xs text-slate-400 mt-0.5">{lead.type}</div>
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
                                                    {namedContacts.length > 1 && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">+{namedContacts.length - 1}</span>
                                                    )}
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
                                            <span className={`text-xs font-medium ${lead.priority === 'Hot' ? 'text-red-600' :
                                                lead.priority === 'Warm' ? 'text-orange-600' :
                                                    lead.priority === 'Medium' ? 'text-yellow-600' :
                                                        'text-slate-400'
                                                }`}>
                                                {lead.priority}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-medium text-slate-700">{lead.algorithm_count}</td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-800">{lead.lead_score}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => setSelectedOrg(lead.name)}
                                                className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition"
                                            >
                                                ➤
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        })()}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {filteredLeads.length > itemsPerPage && (
                    <div className="border-t border-slate-200 px-4 py-3 bg-slate-50 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Pagina {currentPage} van {Math.ceil(filteredLeads.length / itemsPerPage)} ({filteredLeads.length} resultaten)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                «
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ‹ Vorige
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredLeads.length / itemsPerPage), currentPage + 1))}
                                disabled={currentPage === Math.ceil(filteredLeads.length / itemsPerPage)}
                                className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Volgende ›
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.ceil(filteredLeads.length / itemsPerPage))}
                                disabled={currentPage === Math.ceil(filteredLeads.length / itemsPerPage)}
                                className="px-3 py-1 text-sm bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                »
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Organization Detail Modal */}
            {
                selectedOrg && (
                    <OrganizationDetail
                        orgName={selectedOrg}
                        onClose={() => setSelectedOrg(null)}
                    />
                )
            }
        </div >
    );
}
