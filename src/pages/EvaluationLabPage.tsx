import React, { useState } from 'react';
import { BentoCard } from '../components/BentoCard';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileCode,
  Layers,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { ComprehensiveEvaluationReport, CountryCode, CurrencyCode, DifficultyLevel, RiskLevel, StrictnessLevel, TopicCategory } from '../types';

interface EvaluationLabPageProps {
  onEvaluationComplete: (report: ComprehensiveEvaluationReport) => void;
}

export const EvaluationLabPage: React.FC<EvaluationLabPageProps> = ({ onEvaluationComplete }) => {
  const [question, setQuestion] = useState('What is the maximum tax deduction allowed under Section 80C of the Income Tax Act in India for FY 2025-26?');
  const [submittedAnswer, setSubmittedAnswer] = useState('Under Section 80C, the maximum deduction limit allowed is ₹1,50,000 per financial year.');
  const [country, setCountry] = useState<CountryCode>('IN');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [topic, setTopic] = useState<TopicCategory>('taxation');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('intermediate');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium');
  const [strictness, setStrictness] = useState<StrictnessLevel>('Research');
  const [enableEvidence, setEnableEvidence] = useState(true);
  const [userContext, setUserContext] = useState('Senior IT Professional in 30% tax slab');

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ComprehensiveEvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunLab = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          submittedAnswer,
          country,
          currency,
          topic,
          difficulty,
          riskLevel,
          strictness,
          userContext,
          enableEvidence,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Evaluation Lab run failed.');
      }

      const rep: ComprehensiveEvaluationReport = await res.json();
      setReport(rep);
      onEvaluationComplete(rep);
    } catch (err: any) {
      setError(err.message || 'An error occurred during lab evaluation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-400" />
          <span>Advanced Evaluation Lab</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Deep research evaluation laboratory with custom strictness policies and statutory evidence toggles
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-5 lg:col-span-1">
          <BentoCard className="space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Lab Configurations</span>
            </h3>

            {/* Strictness */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">Evaluation Strictness</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Standard', 'Conservative', 'Research'] as StrictnessLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setStrictness(level)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all border ${
                      strictness === level
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Evidence Research Toggle */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div>
                <p className="text-xs font-bold text-white">Statutory Evidence Research</p>
                <p className="text-[10px] text-zinc-500">Query official government domains (RBI, SEC, IRS, ITD)</p>
              </div>
              <button
                type="button"
                onClick={() => setEnableEvidence(!enableEvidence)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  enableEvidence ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    enableEvidence ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* User Profile Context */}
            <div>
              <label className="block text-xs font-bold uppercase text-zinc-400 mb-1">User Context String</label>
              <input
                type="text"
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100"
                placeholder="e.g. Salaried employee, Age 35, 30% tax bracket"
              />
            </div>

            {/* Read-Only Server Temperatures */}
            <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">Server Temperature:</span>
                <span className="font-mono text-indigo-400 font-bold">0.10 (Deterministic)</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">Primary Evaluator:</span>
                <span className="font-mono text-zinc-300">gpt-oss-120b</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-zinc-500">Cross-Check Model:</span>
                <span className="font-mono text-zinc-300">gpt-oss-20b</span>
              </div>
            </div>

            <button
              onClick={handleRunLab}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              <span>{loading ? 'Executing Lab Run...' : 'Execute Full Research Evaluation'}</span>
            </button>
          </BentoCard>
        </div>

        {/* Input & Output Panels */}
        <div className="lg:col-span-2 space-y-5">
          <BentoCard className="space-y-3">
            <label className="block text-xs font-bold uppercase text-zinc-400">Research Question</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100"
            />
            <label className="block text-xs font-bold uppercase text-zinc-400 pt-2">AI Answer Input</label>
            <textarea
              value={submittedAnswer}
              onChange={(e) => setSubmittedAnswer(e.target.value)}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100"
            />
          </BentoCard>

          {error && (
            <BentoCard className="border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs p-4">
              {error}
            </BentoCard>
          )}

          {/* Results Detailed View */}
          {report && (
            <div className="space-y-5 animate-in fade-in">
              <BentoCard>
                <h3 className="font-bold text-sm text-white mb-3">7 Dimensions Granular Score Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(report.metricScores).map(([key, metric]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize text-zinc-300">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-mono text-indigo-400">{metric.score} / 100</span>
                      </div>
                      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
                        <div
                          className={`h-full rounded-full transition-all ${
                            metric.score >= 80 ? 'bg-emerald-500' : metric.score >= 60 ? 'bg-indigo-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${metric.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-1">{metric.explanation}</p>
                    </div>
                  ))}
                </div>
              </BentoCard>

              {/* Evidence Section */}
              {report.evidenceResult && (
                <BentoCard className="border-indigo-500/30">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-300 mb-2">
                    Retrieved Statutory Regulatory Evidence
                  </h3>
                  <p className="text-xs text-zinc-300 mb-3">{report.evidenceResult.summary}</p>
                  <div className="space-y-2">
                    {report.evidenceResult.sources.map((s, idx) => (
                      <div key={idx} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-indigo-400 hover:underline block"
                        >
                          {s.title}
                        </a>
                        <p className="text-zinc-400 text-[11px] mt-1">{s.snippet}</p>
                        <span className="text-[10px] font-mono text-zinc-600 block mt-1">Domain: {s.authorityDomain}</span>
                      </div>
                    ))}
                  </div>
                </BentoCard>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
