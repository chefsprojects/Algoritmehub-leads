'use client';

import { useState, useMemo } from 'react';
import tenderData from '@/tenders.json';

interface Tender {
    'ID publicatie': number;
    'Publicatiedatum': string;
    'Naam Aanbestedende dienst': string;
    'Naam aanbesteding': string;
    'Korte beschrijving opdracht': string;
    'Geraamde waarde in EUR': number | null;
    'URL TenderNed': string;
    category: 'AI' | 'Governance' | 'ICT';
    year: number;
}

const data = tenderData as { stats: any; tenders: Tender[] };

export function TenderExplorer() {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [orgFilter, setOrgFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 25;

    // Get unique values for filters
    const years = useMemo(() =>
        [...new Set(data.tenders.map(t => t.year))].sort((a, b) => b - a),
        []
    );

    const organizations = useMemo(() =>
        [...new Set(data.tenders.map(t => t['Naam Aanbestedende dienst']))]
            .filter(Boolean)
            .sort(),
        []
    );

    // Filter tenders
    const filteredTenders = useMemo(() => {
        let result = [...data.tenders];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(t =>
                t['Naam aanbesteding']?.toLowerCase().includes(term) ||
                t['Korte beschrijving opdracht']?.toLowerCase().includes(term) ||
                t['Naam Aanbestedende dienst']?.toLowerCase().includes(term)
            );
        }

        if (categoryFilter) {
            result = result.filter(t => t.category === categoryFilter);
        }

        if (yearFilter) {
            result = result.filter(t => t.year === parseInt(yearFilter));
        }

        if (orgFilter) {
            result = result.filter(t => t['Naam Aanbestedende dienst'] === orgFilter);
        }

        return result;
    }, [searchTerm, categoryFilter, yearFilter, orgFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredTenders.length / itemsPerPage);
    const paginatedTenders = filteredTenders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchTerm, categoryFilter, yearFilter, orgFilter]);

    const formatCurrency = (value: number | null) => {
        if (!value) return '-';
        return new Intl.NumberFormat('nl-NL', {
            style: 'currency',
            currency: 'EUR',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const categoryColors: Record<string, string> = {
        'AI': 'bg-purple-100 text-purple-700',
        'Governance': 'bg-blue-100 text-blue-700',
        'ICT': 'bg-emerald-100 text-emerald-700'
    };

    return (
        <div className="space-y-4">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">{data.stats.ai.toLocaleString()}</div>
                    <div className="text-xs text-purple-600/70">AI Tenders</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">{data.stats.governance.toLocaleString()}</div>
                    <div className="text-xs text-blue-600/70">Governance</div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-emerald-600">{data.stats.ict.toLocaleString()}</div>
                    <div className="text-xs text-emerald-600/70">ICT</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-slate-600">{data.stats.organizations.toLocaleString()}</div>
                    <div className="text-xs text-slate-600/70">Organisaties</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Search */}
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Zoek op naam, beschrijving of organisatie..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Alle categorieën</option>
                        <option value="AI">AI</option>
                        <option value="Governance">Governance</option>
                        <option value="ICT">ICT</option>
                    </select>

                    {/* Year Filter */}
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Alle jaren</option>
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Organization Filter */}
                <select
                    value={orgFilter}
                    onChange={(e) => setOrgFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="">Alle organisaties ({organizations.length})</option>
                    {organizations.map(org => (
                        <option key={org} value={org}>{org}</option>
                    ))}
                </select>

                {/* Result count */}
                <div className="text-sm text-slate-500">
                    {filteredTenders.length.toLocaleString()} resultaten gevonden
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-4 py-3 font-medium text-slate-600 w-24">Datum</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600 w-20">Cat.</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600">Aanbesteding</th>
                                <th className="text-left px-4 py-3 font-medium text-slate-600 w-48">Organisatie</th>
                                <th className="text-right px-4 py-3 font-medium text-slate-600 w-28">Waarde</th>
                                <th className="text-center px-4 py-3 font-medium text-slate-600 w-16">Link</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedTenders.map((tender, index) => (
                                <tr key={tender['ID publicatie'] || index} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                        {formatDate(tender['Publicatiedatum'])}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[tender.category]}`}>
                                            {tender.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-800 line-clamp-2">
                                            {tender['Naam aanbesteding']}
                                        </div>
                                        {tender['Korte beschrijving opdracht'] && (
                                            <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {tender['Korte beschrijving opdracht']}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 text-xs">
                                        {tender['Naam Aanbestedende dienst']}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                                        {formatCurrency(tender['Geraamde waarde in EUR'])}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {tender['URL TenderNed'] && (
                                            <a
                                                href={tender['URL TenderNed']}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                        <div className="text-sm text-slate-500">
                            Pagina {currentPage} van {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentPage === 1
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                Vorige
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${currentPage === totalPages
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                            >
                                Volgende
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
