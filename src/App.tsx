import React, { useEffect, useState } from 'react';
import { Navigation } from './components/Navigation';
import { ReportModal } from './components/ReportModal';
import { DashboardPage } from './pages/DashboardPage';
import { QuickCheckPage } from './pages/QuickCheckPage';
import { EvaluationLabPage } from './pages/EvaluationLabPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ScenariosPage } from './pages/ScenariosPage';
import { BatchPage } from './pages/BatchPage';
import { ConnectionsPage } from './pages/ConnectionsPage';
import { MethodologyPage } from './pages/MethodologyPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AccountPage } from './pages/AccountPage';
import { TutorPage } from './pages/TutorPage';
import { BenchmarkScenario, ComprehensiveEvaluationReport, GroqConnectionStatus } from './types';

const REPORTS_STORAGE_KEY = 'artha_bench_reports';
const LEGACY_REPORTS_STORAGE_KEY = 'fintrust_reports';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [demoMode, setDemoMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<GroqConnectionStatus | undefined>(undefined);
  const [reportsHistory, setReportsHistory] = useState<ComprehensiveEvaluationReport[]>(() => {
    try {
      const saved = localStorage.getItem(REPORTS_STORAGE_KEY) || localStorage.getItem(LEGACY_REPORTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedReport, setSelectedReport] = useState<ComprehensiveEvaluationReport | null>(null);
  const [tutorInitialQuestion, setTutorInitialQuestion] = useState('');

  // Health check on mount
  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setConnectionStatus(data.groq);
      }
    } catch (e) {
      console.warn('Health check failed.');
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  // Sync reports to local storage
  useEffect(() => {
    try {
      localStorage.setItem(REPORTS_STORAGE_KEY, JSON.stringify(reportsHistory));
    } catch (e) {
      console.error('Failed to save history to local storage');
    }
  }, [reportsHistory]);

  const handleEvaluationComplete = (report: ComprehensiveEvaluationReport) => {
    setReportsHistory((prev) => [report, ...prev.filter((r) => r.id !== report.id)]);
    setSelectedReport(report);
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your local evaluation history?')) {
      setReportsHistory([]);
      localStorage.removeItem(REPORTS_STORAGE_KEY);
      localStorage.removeItem(LEGACY_REPORTS_STORAGE_KEY);
    }
  };

  const handleSelectScenario = (scen: BenchmarkScenario) => {
    setCurrentTab('quick-check');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      <div>
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          connectionStatus={connectionStatus}
          demoMode={demoMode}
          onToggleDemoMode={() => setDemoMode(!demoMode)}
        />

        <main className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
          {currentTab === 'dashboard' && (
            <DashboardPage onSelectTab={setCurrentTab} connectionStatus={connectionStatus} />
          )}
          {currentTab === 'quick-check' && (
            <QuickCheckPage
              onEvaluationComplete={handleEvaluationComplete}
              demoMode={demoMode}
              onAskTutor={(question) => {
                setTutorInitialQuestion(question);
                setCurrentTab('tutor');
              }}
            />
          )}
          {currentTab === 'tutor' && (
            <TutorPage
              connectionStatus={connectionStatus}
              initialQuestion={tutorInitialQuestion}
              onInitialQuestionConsumed={() => setTutorInitialQuestion('')}
              demoMode={demoMode}
            />
          )}
          {currentTab === 'lab' && <EvaluationLabPage onEvaluationComplete={handleEvaluationComplete} />}
          {currentTab === 'compare' && <ComparisonPage />}
          {currentTab === 'scenarios' && <ScenariosPage onSelectScenario={handleSelectScenario} />}
          {currentTab === 'batch' && <BatchPage />}
          {currentTab === 'connections' && (
            <ConnectionsPage connectionStatus={connectionStatus} onRefreshConnection={checkHealth} />
          )}
          {currentTab === 'methodology' && <MethodologyPage />}
          {currentTab === 'history' && (
            <HistoryPage
              reports={reportsHistory}
              onSelectReport={setSelectedReport}
              onClearHistory={handleClearHistory}
            />
          )}
          {currentTab === 'settings' && (
            <SettingsPage
              demoMode={demoMode}
              onToggleDemoMode={() => setDemoMode(!demoMode)}
              onClearHistory={handleClearHistory}
              connectionStatus={connectionStatus}
            />
          )}
          {currentTab === 'account' && <AccountPage reports={reportsHistory} />}
        </main>
      </div>

      {/* Report Modal */}
      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />

      {/* Footer */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 px-4 lg:px-8 py-6 mt-12 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-zinc-300">Artha Bench</span> — AI Financial Reliability Benchmark & Evaluation Framework
            <p className="mt-1 text-[11px] text-zinc-600">Created & Maintained by Shreyash Singh • Built for research & AI reliability evaluation.</p>
          </div>
          <div className="text-right text-[11px] text-zinc-600">
            <span>Research Disclaimer: Not certified financial, investment, tax, or legal advice.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
