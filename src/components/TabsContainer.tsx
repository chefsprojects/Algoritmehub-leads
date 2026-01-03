'use client';

import { useState } from 'react';
import { LeadDashboard } from '@/components/LeadDashboard';
import { RoadmapDashboard } from '@/components/RoadmapDashboard';
import { Top20Dashboard } from '@/components/Top20Dashboard';
import { LeadData } from '@/types/lead';

interface TabsContainerProps {
    data: LeadData;
}

export function TabsContainer({ data }: TabsContainerProps) {
    const [activeTab, setActiveTab] = useState<'roadmap' | 'top20' | 'leads'>('top20');

    return (
        <div>
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('roadmap')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2
            ${activeTab === 'roadmap'
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    Roadmap
                </button>
                <button
                    onClick={() => setActiveTab('top20')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2
            ${activeTab === 'top20'
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    <span className="text-lg">🎯</span>
                    Top 20
                </button>
                <button
                    onClick={() => setActiveTab('leads')}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2
            ${activeTab === 'leads'
                            ? 'bg-slate-900 text-white shadow-lg'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    Alle Leads ({data.total_leads})
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'roadmap' && <RoadmapDashboard />}
            {activeTab === 'top20' && <Top20Dashboard />}
            {activeTab === 'leads' && <LeadDashboard data={data} />}
        </div>
    );
}
