'use client';

import { useState } from 'react';
import leadData from '@/data.json';
import organizationsData from '@/organizations.json';

interface AlgorithmOrg {
    name: string;
    algorithm_count: number;
    impactful_count: number;
    high_risk_count: number;
    has_iama: boolean;
    latest_date: string | null;
    first_date: string | null;
    categories: Record<string, number>;
    statuses: Record<string, number>;
    algorithms: any[];
}

const orgData = organizationsData as { organizations: Record<string, AlgorithmOrg> };

// Step content definitions - Algoritmeregister focused
const stepContent: Record<string, {
    title: string;
    description: string;
    status: 'completed' | 'in-progress' | 'pending';
    completedDate?: string;
}> = {
    '1.1': {
        title: 'Algoritmeregister CSV importeren',
        description: 'Maandelijkse export van algoritmes.overheid.nl met alle gepubliceerde algoritmes.',
        status: 'completed',
        completedDate: '2 januari 2026',
    },
    '1.2': {
        title: 'Hot leads identificeren',
        description: 'Organisaties met impactvolle algoritmes maar ontbrekende IAMA.',
        status: 'completed',
        completedDate: '2 januari 2026',
    },
    '1.3': {
        title: 'Compliance gaps analyseren',
        description: 'Ontbrekende wettelijke basis, risicoanalyses, impacttoetsen.',
        status: 'in-progress',
    },
};

interface StepDetailProps {
    stepId: string;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasNext: boolean;
    hasPrev: boolean;
}

export function StepDetail({ stepId, onClose, onNext, onPrev, hasNext, hasPrev }: StepDetailProps) {
    const step = stepContent[stepId];
    const [activeTab, setActiveTab] = useState<'summary' | 'leads' | 'gaps'>('summary');

    // Get Algoritmeregister stats
    const getAlgoritmeStats = () => {
        const leads = leadData.leads as any[];
        const hotLeads = leads.filter(l => l.priority === 'Hot');
        const warmLeads = leads.filter(l => l.priority === 'Warm');
        const withImpactful = leads.filter(l => (l.impactful_count || 0) > 0);
        const missingIama = leads.filter(l => !l.has_iama && (l.impactful_count || 0) > 0);
        const recentLeads = leads.filter(l => {
            if (!l.latest_date) return false;
            const date = new Date(l.latest_date);
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            return date >= threeMonthsAgo;
        });

        return {
            totalAlgorithms: leadData.total_algorithms || 0,
            totalOrgs: leads.length,
            hotLeads: hotLeads.length,
            warmLeads: warmLeads.length,
            withImpactful: withImpactful.length,
            missingIama: missingIama.length,
            recentLeads: recentLeads.length,
            topHotLeads: hotLeads.slice(0, 10),
            topMissingIama: missingIama.sort((a, b) => (b.impactful_count || 0) - (a.impactful_count || 0)).slice(0, 10),
        };
    };

    const stats = getAlgoritmeStats();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium opacity-80">Stap {stepId}</span>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <h2 className="text-2xl font-bold">{step?.title || `Stap ${stepId}`}</h2>
                    <p className="mt-2 opacity-90">{step?.description}</p>

                    {step?.status === 'completed' && step.completedDate && (
                        <div className="mt-4 inline-flex items-center gap-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Afgerond op {step.completedDate}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Step 1.1 - Algoritmeregister Import */}
                    {stepId === '1.1' && (
                        <div className="space-y-6">
                            {/* Key Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-blue-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-blue-600">{stats.totalAlgorithms.toLocaleString()}</div>
                                    <div className="text-sm text-blue-600/70 mt-1">Algoritmes geïmporteerd</div>
                                </div>
                                <div className="bg-indigo-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-indigo-600">{stats.totalOrgs}</div>
                                    <div className="text-sm text-indigo-600/70 mt-1">Organisaties</div>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-orange-600">{stats.withImpactful}</div>
                                    <div className="text-sm text-orange-600/70 mt-1">Met impactvolle algos</div>
                                </div>
                                <div className="bg-red-50 rounded-xl p-4 text-center">
                                    <div className="text-3xl font-bold text-red-600">{stats.hotLeads}</div>
                                    <div className="text-sm text-red-600/70 mt-1">Hot Leads</div>
                                </div>
                            </div>

                            {/* Data Source Info */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-semibold text-slate-800 mb-2">📊 Data Bron</h3>
                                <p className="text-slate-600 text-sm">
                                    <strong>Algoritmeregister</strong> (algoritmes.overheid.nl) - Export van 2 januari 2026.
                                    Bevat alle gepubliceerde algoritmes van Nederlandse overheidsorganisaties met details
                                    over doel, status, categorie, impacttoetsen en wettelijke basis.
                                </p>
                            </div>

                            {/* What was done */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                <h3 className="font-semibold text-green-800 mb-2">✅ Wat is gedaan</h3>
                                <ul className="text-green-700 text-sm space-y-1">
                                    <li>• Algoritmeregister CSV gedownload ({stats.totalAlgorithms.toLocaleString()} algoritmes)</li>
                                    <li>• Python script gemaakt voor analyse (update-algoritmeregister.py)</li>
                                    <li>• Lead scoring berekend op basis van impactvolle algoritmes</li>
                                    <li>• {stats.hotLeads} hot leads en {stats.warmLeads} warm leads geïdentificeerd</li>
                                    <li>• Dashboard bijgewerkt met nieuwe Priority en Impactvol kolommen</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Step 1.2 - Hot Leads */}
                    {stepId === '1.2' && (
                        <div className="space-y-6">
                            {/* Tab Navigation */}
                            <div className="flex gap-2 border-b border-slate-200 pb-0">
                                <button
                                    onClick={() => setActiveTab('summary')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${activeTab === 'summary'
                                        ? 'bg-white border border-b-0 border-slate-200 text-indigo-600 -mb-px'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    📊 Overzicht
                                </button>
                                <button
                                    onClick={() => setActiveTab('leads')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${activeTab === 'leads'
                                        ? 'bg-white border border-b-0 border-slate-200 text-indigo-600 -mb-px'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    🔥 Top Hot Leads ({stats.hotLeads})
                                </button>
                                <button
                                    onClick={() => setActiveTab('gaps')}
                                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${activeTab === 'gaps'
                                        ? 'bg-white border border-b-0 border-slate-200 text-indigo-600 -mb-px'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    ⚠️ Zonder IAMA ({stats.missingIama})
                                </button>
                            </div>

                            {activeTab === 'summary' && (
                                <>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-red-50 rounded-xl p-4 text-center">
                                            <div className="text-4xl font-bold text-red-600">{stats.hotLeads}</div>
                                            <div className="text-sm text-red-600/70 mt-1">Hot Leads (score ≥70)</div>
                                        </div>
                                        <div className="bg-orange-50 rounded-xl p-4 text-center">
                                            <div className="text-4xl font-bold text-orange-600">{stats.warmLeads}</div>
                                            <div className="text-sm text-orange-600/70 mt-1">Warm Leads (50-69)</div>
                                        </div>
                                        <div className="bg-amber-50 rounded-xl p-4 text-center">
                                            <div className="text-4xl font-bold text-amber-600">{stats.missingIama}</div>
                                            <div className="text-sm text-amber-600/70 mt-1">Impactvol maar geen IAMA</div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                        <h3 className="font-semibold text-indigo-800 mb-2">💡 Hot Lead Criteria</h3>
                                        <ul className="text-indigo-700 text-sm space-y-1">
                                            <li>• ≥5 impactvolle algoritmes = +30 punten</li>
                                            <li>• ≥10 algoritmes totaal = +30 punten</li>
                                            <li>• Geen IAMA maar wel impactvolle algoritmes = +10 punten</li>
                                            <li>• Recente publicaties (2025) = +10 punten</li>
                                        </ul>
                                    </div>
                                </>
                            )}

                            {activeTab === 'leads' && (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-medium text-slate-600">#</th>
                                                <th className="text-left px-4 py-3 font-medium text-slate-600">Organisatie</th>
                                                <th className="text-center px-4 py-3 font-medium text-slate-600">Algoritmes</th>
                                                <th className="text-center px-4 py-3 font-medium text-slate-600">Impactvol</th>
                                                <th className="text-center px-4 py-3 font-medium text-slate-600">Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.topHotLeads.map((lead: any, i: number) => (
                                                <tr key={lead.name} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-medium text-slate-400">{i + 1}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{lead.name}</td>
                                                    <td className="px-4 py-3 text-center font-medium">{lead.algorithm_count}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                                                            {lead.impactful_count || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-bold">
                                                            {lead.lead_score}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'gaps' && (
                                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                                    <div className="bg-amber-50 p-3 border-b border-amber-200">
                                        <p className="text-sm text-amber-800">
                                            <strong>Kans:</strong> Deze organisaties hebben impactvolle algoritmes maar geen IAMA gedocumenteerd.
                                        </p>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 border-b border-slate-200">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-medium text-slate-600">#</th>
                                                <th className="text-left px-4 py-3 font-medium text-slate-600">Organisatie</th>
                                                <th className="text-center px-4 py-3 font-medium text-slate-600">Impactvol</th>
                                                <th className="text-center px-4 py-3 font-medium text-slate-600">IAMA</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.topMissingIama.map((lead: any, i: number) => (
                                                <tr key={lead.name} className="border-b border-slate-100 hover:bg-slate-50">
                                                    <td className="px-4 py-3 font-medium text-slate-400">{i + 1}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800">{lead.name}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded font-medium">
                                                            {lead.impactful_count || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-red-500">✗ Ontbreekt</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Default for other steps */}
                    {!['1.1', '1.2'].includes(stepId) && (
                        <div className="text-center py-12 text-slate-500">
                            <div className="text-6xl mb-4">🚧</div>
                            <p className="text-lg">Deze stap moet nog worden uitgevoerd</p>
                            <p className="text-sm mt-2">Vink de vorige stappen af om verder te gaan</p>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="border-t border-slate-200 p-4 flex items-center justify-between bg-slate-50">
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${hasPrev
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Vorige
                    </button>

                    <span className="text-sm text-slate-500">Stap {stepId}</span>

                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${hasNext
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        Volgende
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
