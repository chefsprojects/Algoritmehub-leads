import { TabsContainer } from '@/components/TabsContainer';
// Use updated Algoritmeregister data from 2026-01-02
import leadData from '@/data.json';
import { LeadData } from '@/types/lead';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-900">Algoritmehub</span>
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
              Sales Pipeline
            </span>
          </div>
          <div className="text-sm text-slate-500">
            Bijgewerkt: {new Date((leadData as LeadData).generated_date).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TabsContainer data={leadData as LeadData} />
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-500 text-sm">
        <p>© 2025 Algoritmehub (EmbedAI B.V.) — Sales Pipeline Dashboard</p>
        <p className="text-xs text-slate-400 mt-1">Data bron: Algoritmeregister.overheid.nl</p>
      </footer>
    </div>
  );
}
