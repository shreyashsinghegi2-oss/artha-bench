import React, { useState } from 'react';
import { BentoCard } from '../components/BentoCard';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  MessageCircleQuestion,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';
import { ComprehensiveEvaluationReport, CountryCode, CurrencyCode, DifficultyLevel, EvaluatorComponentDiagnostic, RiskLevel, TopicCategory } from '../types';
import { BENCHMARK_SCENARIOS } from '../data/scenarios';

interface QuickCheckPageProps {
  onEvaluationComplete: (report: ComprehensiveEvaluationReport) => void;
  demoMode: boolean;
  onAskTutor: (question: string) => void;
}

export const QuickCheckPage: React.FC<QuickCheckPageProps> = ({ onEvaluationComplete, demoMode, onAskTutor }) => {
  const [question, setQuestion] = useState(
    'I earn ₹1,00,000 net per month and have a ₹25,000 high-interest credit card debt. How should I allocate my budget according to 50/30/20?'
  );
  const [submittedAnswer, setSubmittedAnswer] = useState(
    'Allocate ₹50,000 to Needs, ₹30,000 to Wants, and ₹20,000 to Savings. Pay your ₹25,000 debt out of the ₹20,000 savings portion over two months.'
  );
  const [country, setCountry] = useState<CountryCode>('IN');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [topic, setTopic] = useState<TopicCategory>('budgeting');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('beginner');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('low');

  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [progressStage, setProgressStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errorRequestId, setErrorRequestId] = useState<string | null>(null);
  const [diagnostics, setDiagnostics] = useState<EvaluatorComponentDiagnostic[]>([]);
  const [generatedBy, setGeneratedBy] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<ComprehensiveEvaluationReport | null>(null);

  const handlePresetSelect = (id: string) => {
    const scen = BENCHMARK_SCENARIOS.find((s) => s.id === id);
    if (scen) {
      setQuestion(scen.question);
      setSubmittedAnswer(scen.sampleAnswer || '');
      setCountry(scen.country);
      setCurrency(scen.currency);
      setTopic(scen.topic);
      setDifficulty(scen.difficulty);
      setRiskLevel(scen.riskLevel);
      setActiveReport(null);
    }
  };

  const handleGenerateAnswer = async () => {
    setGenerateLoading(true);
    setError(null);
    setGeneratedBy(null);
    try {
      const res = await fetch('/api/generate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, country, currency, topic, difficulty, riskLevel }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate answer.');
      }
      const data = await res.json();
      const textAnswer = `Summary: ${data.summary}\n\nCalculation / Reasoning:\n${data.calculationOrReasoning}\n\nAssumptions:\n- ${data.assumptions.join('\n- ')}\n\nRisks:\n- ${data.risks.join('\n- ')}\n\nConclusion:\n${data.finalEducationalConclusion}`;
      setSubmittedAnswer(textAnswer);
      setGeneratedBy(`${data.provider || 'Groq'} · ${data.model || 'openai/gpt-oss-120b'}`);
    } catch (err: any) {
      setError(err.message || 'Error generating test answer.');
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!question.trim()) {
      setError('Please provide a financial question.');
      return;
    }

    setLoading(true);
    setError(null);
    setErrorRequestId(null);
    setDiagnostics([]);
    setActiveReport(null);

    const stages = [
      'Validating input parameters...',
      'Executing deterministic math engine formulas...',
      'Researching authoritative regulatory evidence...',
      'Querying Groq Primary Evaluator (gpt-oss-120b)...',
      'Querying Groq Secondary Evaluator (gpt-oss-20b)...',
      'Aggregating scores & applying hard safety caps...',
    ];

    let stageIdx = 0;
    setProgressStage(stages[0]);
    const interval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setProgressStage(stages[stageIdx]);
      }
    }, 800);

    try {
      const res = await fetch('/api/evaluate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          submittedAnswer: submittedAnswer || 'No explicit answer provided; evaluating question safety and generating educational model.',
          country,
          currency,
          topic,
          difficulty,
          riskLevel,
        }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const componentStates: EvaluatorComponentDiagnostic[] = errData?.error?.components || [];
        setDiagnostics(componentStates);
        setErrorRequestId(errData?.error?.requestId || null);
        const state = componentStates[0]?.state || errData?.error?.state;
        const safeMessages: Record<string, string> = {
          not_configured: 'Groq secret is not configured. Add GROQ_API_KEY in Settings → Secrets.',
          invalid_credentials: 'Groq rejected the server credential. Rotate the key and update the secret.',
          rate_limited: 'Groq rate limit reached. Wait briefly and retry.',
          invalid_request: 'The evaluator request format was rejected. Open diagnostics with the request ID.',
          invalid_response: 'An evaluator returned an invalid structured response. See component diagnostics.',
          timeout: 'Groq did not respond before the timeout.',
          model_unavailable: 'The configured model is not available to this Groq project.',
          provider_unavailable: 'Groq is temporarily unavailable. Retry shortly.',
        };
        throw new Error(safeMessages[state] || errData?.error?.message || 'Evaluation failed.');
      }

      const report: ComprehensiveEvaluationReport = await res.json();
      setActiveReport(report);
      onEvaluationComplete(report);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'An error occurred while evaluating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-indigo-400 fill-indigo-400" />
            <span>Quick Check Evaluation</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Instantly evaluate an AI answer against deterministic math & dual Groq model consensus
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-zinc-500 whitespace-nowrap">Presets:</span>
          {BENCHMARK_SCENARIOS.slice(0, 4).map((s) => (
            <button
              key={s.id}
              onClick={() => handlePresetSelect(s.id)}
              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
            >
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Inputs (2 Columns) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Question Box */}
          <BentoCard>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Financial Question to Evaluate
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. What is the monthly EMI for a loan of $50,000 at 8% for 5 years?"
            />
          </BentoCard>

          {/* Submitted Answer Box */}
          <BentoCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                AI-Generated Answer to Benchmark
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateAnswer}
                  disabled={generateLoading || !question.trim()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                >
                  {generateLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate Educational Test Answer</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAskTutor(question)}
                  disabled={!question.trim()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
                >
                  <MessageCircleQuestion className="w-3.5 h-3.5" />
                  <span>Ask Financial Tutor</span>
                </button>
              </div>
            </div>
            <textarea
              value={submittedAnswer}
              onChange={(e) => setSubmittedAnswer(e.target.value)}
              rows={6}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Paste the AI answer here or click 'Generate Test Answer' above..."
            />
            {generatedBy && <p className="mt-2 text-[10px] text-zinc-500">Educational test answer generated by <span className="font-semibold text-indigo-300">{generatedBy}</span>. It has not been evaluated yet.</p>}
          </BentoCard>
        </div>

        {/* Right Metadata Controls (1 Column) */}
        <div className="space-y-5">
          <BentoCard className="space-y-4">
            <h3 className="font-bold text-sm text-white border-b border-zinc-800 pb-2">Evaluation Parameters</h3>

            {/* Country & Currency */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value as CountryCode)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="IN">India (IN)</option>
                  <option value="US">United States (US)</option>
                  <option value="UK">United Kingdom (UK)</option>
                  <option value="EU">European Union (EU)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="AU">Australia (AU)</option>
                  <option value="SG">Singapore (SG)</option>
                  <option value="JP">Japan (JP)</option>
                  <option value="GLOBAL">Global</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="SGD">SGD ($)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>

            {/* Category Topic */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Financial Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value as TopicCategory)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white focus:outline-none"
              >
                <option value="budgeting">Budgeting & Expenses</option>
                <option value="compound_interest">Compound Interest / Savings</option>
                <option value="loan_emi">Loan EMI & Debt</option>
                <option value="taxation">Taxation & Regulatory</option>
                <option value="emergency_fund">Emergency Fund</option>
                <option value="investment_risk">Investment Risk & Returns</option>
                <option value="prompt_injection">Prompt Injection Safety</option>
              </select>
            </div>

            {/* Difficulty & Risk */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Risk Level</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                >
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                  <option value="critical">Critical Risk</option>
                </select>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleEvaluate}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-white" />}
              <span>{loading ? 'Evaluating...' : 'Run Reliability Evaluation'}</span>
            </button>
          </BentoCard>
        </div>
      </div>

      {/* Progress or Error Banner */}
      {loading && (
        <BentoCard className="border-indigo-500/40 bg-indigo-950/20 flex items-center gap-4 py-4">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Evaluation Pipeline Active</p>
            <p className="text-sm font-semibold text-white mt-0.5">{progressStage}</p>
          </div>
        </BentoCard>
      )}

      {error && (
        <BentoCard className="border-rose-500/40 bg-rose-950/20 flex items-center gap-4 py-4">
          <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-rose-300 uppercase tracking-wider">Evaluation Error</p>
            <p className="text-sm text-zinc-200 mt-0.5">{error}</p>
            {errorRequestId && <p className="text-[10px] font-mono text-zinc-500 mt-2">Request ID: {errorRequestId}</p>}
            {diagnostics.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {diagnostics.map((component) => (
                  <span key={component.role} className="rounded-lg border border-rose-500/20 bg-zinc-950/60 px-2.5 py-1.5 text-[10px] text-zinc-400">
                    {component.role}: {component.model} · <span className="text-rose-300">{component.state.replaceAll('_', ' ')}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </BentoCard>
      )}

      {/* Active Evaluation Output Display */}
      {activeReport && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Evaluation Results Summary</h2>
            <span className="text-xs text-zinc-500">Run ID: {activeReport.runId}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Score Card */}
            <BentoCard className="flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Reliability Score</span>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-5xl font-extrabold tracking-tight text-white">{activeReport.overallScore}</span>
                <span className="text-lg font-bold text-zinc-500">/ 100</span>
              </div>
              <div className="mt-4">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                    activeReport.overallScore >= 90
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      : activeReport.overallScore >= 75
                      ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-400'
                      : activeReport.overallScore >= 60
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                  }`}
                >
                  {activeReport.reliabilityLevel} Level
                </span>
              </div>
            </BentoCard>

            {/* Model Consensus & Agreement */}
            <BentoCard className="flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dual Model Consensus</span>
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-400">Primary (gpt-oss-120b):</span>
                  <span className="font-bold text-white">{activeReport.primaryModelOutput?.overallReliabilityScore ?? 'N/A'}/100</span>
                </div>
                <div className="flex justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-zinc-400">Secondary (gpt-oss-20b):</span>
                  <span className="font-bold text-white">{activeReport.secondaryModelOutput?.overallReliabilityScore ?? 'N/A'}/100</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-400">Agreement Level:</span>
                  <span className="font-bold text-indigo-400">{activeReport.agreementLevel}</span>
                </div>
              </div>
            </BentoCard>

            {/* Deterministic Math Check */}
            <BentoCard className="flex flex-col justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Deterministic Math Engine</span>
              <div className="mt-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mb-2 ${
                    activeReport.deterministicReport.overallMatch
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                  }`}
                >
                  {activeReport.deterministicReport.overallMatch ? 'Passed Math Verification' : 'Math Mismatch Detected'}
                </span>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  {activeReport.deterministicReport.notes[0]}
                </p>
              </div>
            </BentoCard>
          </div>

          {/* Corrected Educational Answer Section */}
          {activeReport.correctedEducationalAnswer && (
            <BentoCard className="border-indigo-500/30">
              <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Corrected Educational Answer (No Advice Boundary)</span>
              </h3>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {activeReport.correctedEducationalAnswer}
              </p>
            </BentoCard>
          )}
        </div>
      )}
    </div>
  );
};
