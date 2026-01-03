'use client';

import { useState, useEffect } from 'react';
import { StepDetail } from './StepDetail';

// Define the complete GTM roadmap structure - focused on Algoritmeregister
const roadmapData = {
  phases: [
    {
      id: 'phase-1',
      title: 'Algoritmeregister Analyse',
      emoji: '📊',
      color: 'blue',
      description: 'Data uit Algoritmeregister verrijken en leads kwalificeren',
      steps: [
        { id: '1-1', title: 'Algoritmeregister CSV importeren', description: 'Maandelijkse export van algoritmes.overheid.nl (1.306 algoritmes)' },
        { id: '1-2', title: 'Hot leads identificeren', description: 'Organisaties met impactvolle algoritmes maar geen IAMA' },
        { id: '1-3', title: 'Compliance gaps analyseren', description: 'Ontbrekende wettelijke basis, risicoanalyses, impacttoetsen' },
        { id: '1-4', title: 'Recente activiteit checken', description: 'Organisaties met nieuwe algoritmes in laatste 3 maanden' },
        { id: '1-5', title: 'Contactgegevens verzamelen', description: 'Email en DPO/CIO vinden via register en LinkedIn' },
        { id: '1-6', title: 'Lead prioriteit bepalen', description: 'Top 30 hot leads voor eerste outreach' },
      ],
    },
    {
      id: 'phase-2',
      title: 'Gepersonaliseerde Outreach',
      emoji: '📧',
      color: 'purple',
      description: 'Contact maken met specifieke waarde propositie',
      steps: [
        { id: '2-1', title: 'Organisatie-specifieke info voorbereiden', description: 'Aantal algoritmes, impactvolle systemen, gaps noteren' },
        { id: '2-2', title: 'Email template per lead customizen', description: '"Wij zagen dat jullie X impactvolle algoritmes hebben..."' },
        { id: '2-3', title: 'Eerste batch versturen (10 leads)', description: 'Gepersonaliseerde emails naar hot leads' },
        { id: '2-4', title: 'LinkedIn connecties leggen', description: 'CIO/DPO van top leads toevoegen' },
        { id: '2-5', title: 'Follow-up na 5 dagen', description: 'Reminder met extra inzicht uit hun register' },
        { id: '2-6', title: 'Responsie tracken', description: 'Opens, replies, meeting requests bijhouden' },
      ],
    },
    {
      id: 'phase-3',
      title: 'Demo & Discovery',
      emoji: '💼',
      color: 'emerald',
      description: 'Gesprekken en platform demonstraties',
      steps: [
        { id: '3-1', title: 'Discovery call plannen', description: 'Begrijp hun huidige AI governance situatie' },
        { id: '3-2', title: 'Demo voorbereiden met hun data', description: 'Hun algoritmes importeren als voorbeeld' },
        { id: '3-3', title: 'Live demo geven', description: 'Laat zien hoe Algoritmehub hun compliance vereenvoudigt' },
        { id: '3-4', title: 'Compliance roadmap schetsen', description: 'Tijdlijn naar EU AI Act compliance' },
        { id: '3-5', title: 'Requirements documenteren', description: 'SSO, BIO, AVG, specifieke wensen' },
        { id: '3-6', title: 'Pilot voorstel maken', description: '3 maanden proefperiode met success criteria' },
      ],
    },
    {
      id: 'phase-4',
      title: 'Pilot Deal',
      emoji: '🚀',
      color: 'amber',
      description: 'Pilot overeenkomst sluiten',
      steps: [
        { id: '4-1', title: 'Pilot voorstel versturen', description: 'Met pricing, scope en timeline' },
        { id: '4-2', title: 'Juridische review', description: 'Verwerkersovereenkomst opstellen' },
        { id: '4-3', title: 'Interne goedkeuring helpen', description: 'Materiaal voor hun besluitvorming' },
        { id: '4-4', title: 'Contract ondertekening', description: 'Pilot overeenkomst getekend' },
        { id: '4-5', title: 'Kick-off plannen', description: 'Start datum en eerste acties' },
        { id: '4-6', title: 'Success metrics afspreken', description: 'Wat maakt de pilot succesvol?' },
      ],
    },
    {
      id: 'phase-5',
      title: 'Klant Succes',
      emoji: '✅',
      color: 'green',
      description: 'Eerste klant live en succesvol',
      steps: [
        { id: '5-1', title: 'Account opzetten', description: 'Organisatie, users, SSO configureren' },
        { id: '5-2', title: 'Algoritmes migreren', description: 'Data uit Algoritmeregister importeren' },
        { id: '5-3', title: 'Team training', description: 'Onboarding sessie voor key users' },
        { id: '5-4', title: 'Eerste IAMA voltooien', description: 'Samen één assessment doorlopen' },
        { id: '5-5', title: 'Pilot evaluatie', description: 'Feedback verzamelen na 6 weken' },
        { id: '5-6', title: 'Case study maken', description: 'Succesverhaal voor marketing' },
      ],
    },
  ],
};


// Get flat list of all step IDs for navigation
const allStepIds = roadmapData.phases.flatMap(p => p.steps.map(s => s.id.replace('-', '.')));

const colorClasses: Record<string, { bg: string; border: string; text: string; light: string; progress: string }> = {
  blue: { bg: 'bg-blue-500', border: 'border-blue-200', text: 'text-blue-600', light: 'bg-blue-50', progress: 'bg-blue-500' },
  purple: { bg: 'bg-purple-500', border: 'border-purple-200', text: 'text-purple-600', light: 'bg-purple-50', progress: 'bg-purple-500' },
  emerald: { bg: 'bg-emerald-500', border: 'border-emerald-200', text: 'text-emerald-600', light: 'bg-emerald-50', progress: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-500', border: 'border-amber-200', text: 'text-amber-600', light: 'bg-amber-50', progress: 'bg-amber-500' },
  green: { bg: 'bg-green-500', border: 'border-green-200', text: 'text-green-600', light: 'bg-green-50', progress: 'bg-green-500' },
};

export function RoadmapDashboard() {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['phase-1']));
  const [selectedStep, setSelectedStep] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gtm-roadmap-progress');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  }, []);

  // Save to localStorage when completed steps change
  useEffect(() => {
    localStorage.setItem('gtm-roadmap-progress', JSON.stringify([...completedSteps]));
  }, [completedSteps]);

  const toggleStep = (stepId: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phaseId)) {
        newSet.delete(phaseId);
      } else {
        newSet.add(phaseId);
      }
      return newSet;
    });
  };

  const openStepDetail = (stepId: string) => {
    // Convert step id like "1-1" to "1.1" for the modal
    setSelectedStep(stepId.replace('-', '.'));
  };

  const navigateStep = (direction: 'next' | 'prev') => {
    if (!selectedStep) return;
    const currentIndex = allStepIds.indexOf(selectedStep);
    if (direction === 'next' && currentIndex < allStepIds.length - 1) {
      setSelectedStep(allStepIds[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedStep(allStepIds[currentIndex - 1]);
    }
  };

  const getPhaseProgress = (phase: typeof roadmapData.phases[0]) => {
    const completed = phase.steps.filter(s => completedSteps.has(s.id)).length;
    return { completed, total: phase.steps.length, percent: Math.round((completed / phase.steps.length) * 100) };
  };

  const getTotalProgress = () => {
    const totalSteps = roadmapData.phases.reduce((sum, p) => sum + p.steps.length, 0);
    return { completed: completedSteps.size, total: totalSteps, percent: Math.round((completedSteps.size / totalSteps) * 100) };
  };

  const totalProgress = getTotalProgress();

  return (
    <div className="space-y-6">
      {/* Header with overall progress */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Go-to-Market Roadmap</h2>
            <p className="text-slate-500 text-sm mt-1">Van lead naar eerste pilot klant</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{totalProgress.percent}%</div>
            <div className="text-sm text-slate-500">{totalProgress.completed}/{totalProgress.total} stappen</div>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${totalProgress.percent}%` }}
          />
        </div>

        {/* Phase indicators */}
        <div className="flex mt-4 gap-2">
          {roadmapData.phases.map((phase) => {
            const progress = getPhaseProgress(phase);
            const isComplete = progress.percent === 100;
            const colors = colorClasses[phase.color];

            return (
              <div
                key={phase.id}
                className={`flex-1 text-center py-2 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer
                  ${isComplete ? colors.bg + ' text-white' : colors.light + ' ' + colors.text}
                  hover:opacity-80`}
                onClick={() => togglePhase(phase.id)}
              >
                <span className="mr-1">{phase.emoji}</span>
                <span className="hidden sm:inline">{phase.title}</span>
                <span className="sm:hidden">{progress.completed}/{progress.total}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase cards */}
      <div className="space-y-4">
        {roadmapData.phases.map((phase, phaseIndex) => {
          const progress = getPhaseProgress(phase);
          const colors = colorClasses[phase.color];
          const isExpanded = expandedPhases.has(phase.id);
          const isComplete = progress.percent === 100;
          const prevPhaseComplete = phaseIndex === 0 || getPhaseProgress(roadmapData.phases[phaseIndex - 1]).percent === 100;

          return (
            <div
              key={phase.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300
                ${isComplete ? 'border-green-200 bg-green-50/30' : colors.border}
                ${!prevPhaseComplete && !isComplete ? 'opacity-60' : ''}`}
            >
              {/* Phase header */}
              <div
                className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => togglePhase(phase.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.light} flex items-center justify-center text-xl`}>
                      {isComplete ? '✅' : phase.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Fase {phaseIndex + 1}</span>
                        {isComplete && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Compleet</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-slate-900">{phase.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-700">{progress.completed}/{progress.total}</div>
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colors.progress}`}
                          style={{ width: `${progress.percent}%` }}
                        />
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-2 ml-13">{phase.description}</p>
              </div>

              {/* Steps list */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {phase.steps.map((step, stepIndex) => {
                    const isStepComplete = completedSteps.has(step.id);

                    return (
                      <div
                        key={step.id}
                        className={`flex items-start gap-3 p-4 border-b border-slate-50 last:border-b-0 
                          hover:bg-slate-50/50 transition-colors cursor-pointer
                          ${isStepComplete ? 'bg-slate-50/30' : ''}`}
                        onClick={() => toggleStep(step.id)}
                      >
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all
                          ${isStepComplete
                            ? 'bg-emerald-500 border-emerald-500'
                            : 'border-slate-300 hover:border-slate-400'}`}
                        >
                          {isStepComplete && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium transition-all ${isStepComplete ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {step.title}
                          </div>
                          <div className={`text-sm mt-0.5 ${isStepComplete ? 'text-slate-400' : 'text-slate-500'}`}>
                            {step.description}
                          </div>
                        </div>

                        {/* View details button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openStepDetail(step.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          Details
                        </button>

                        {/* Step number */}
                        <div className="text-xs text-slate-400 font-mono">
                          {phaseIndex + 1}.{stepIndex + 1}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Motivational footer */}
      <div className="text-center py-6">
        {totalProgress.percent === 100 ? (
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-medium">
            🎉 Gefeliciteerd! Je eerste pilot klant is binnen!
          </div>
        ) : totalProgress.percent >= 50 ? (
          <div className="text-slate-500">
            Je bent op de helft! Nog <span className="font-semibold text-slate-700">{totalProgress.total - totalProgress.completed}</span> stappen te gaan.
          </div>
        ) : (
          <div className="text-slate-500">
            Elke stap brengt je dichter bij je eerste klant. <span className="font-semibold text-slate-700">Keep going!</span>
          </div>
        )}
      </div>

      {/* StepDetail Modal */}
      {selectedStep && (
        <StepDetail
          stepId={selectedStep}
          onClose={() => setSelectedStep(null)}
          onNext={() => navigateStep('next')}
          onPrev={() => navigateStep('prev')}
          hasNext={allStepIds.indexOf(selectedStep) < allStepIds.length - 1}
          hasPrev={allStepIds.indexOf(selectedStep) > 0}
        />
      )}
    </div>
  );
}
