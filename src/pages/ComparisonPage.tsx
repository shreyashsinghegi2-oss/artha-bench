import React, { useState } from 'react';
import { BentoCard } from '../components/BentoCard';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Scale,
  ShieldAlert,
  Trophy,
} from 'lucide-react';
import { ComprehensiveEvaluationReport, CountryCode, CurrencyCode, DifficultyLevel, RiskLevel, TopicCategory } from '../types';

export const ComparisonPage: React.FC = () => {
  const [question, setQuestion] = useState(
    'If I deposit $10,000 in an account paying 8% per annum compounded annually for 5 years, what will be my exact final balance and interest earned?'
  );
  const [answerA, setAnswerA] = useState(
    'Your final balance after 5 years will be $14,693.28, giving you an interest earned of $4,693.28.'
  );
  const [answerB, setAnswerB] = useState(
    'You will earn exactly $4,000 in simple interest, making your final balance $14,000 after 5 years.'
  );

  const [country, setCountry] = useState<CountryCode>('US');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [topic, setTopic] = useState<TopicCategory>('compound_interest');

  const [loading, setLoading] = useState(false);
  const [reportA, setReportA] = useState<ComprehensiveEvaluationReport | null>(null);
  const [reportB, setReportB] = useState<ComprehensiveEvaluationReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCompare = async () => {
    setLoading(true);
    setError(null);
    setReportA(null);
    setReportB(null);

    try {
      const [resA, resB] = await Promise.all([
        fetch('/api/evaluate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, submittedAnswer: answerA, country, currency, topic }),
        }),
        fetch('/api/evaluate-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, submittedAnswer: answerB, country, currency, topic }),
        }),
      ]);

      if (!resA.ok || !resB.ok) {
        throw new Error('Comparison evaluation failed.');
      }

      const repA: ComprehensiveEvaluationReport = await resA.json();
      const repB: ComprehensiveEvaluationReport = await resB.json();

      setReportA(repA);
      setReportB(repB);
    } catch (err: any) {
      setError(err.message || 'Comparison run failed.');
    } finally {
      setLoading(false);
    }
  };

  const scoreDiff = reportA && reportB ? reportA.overallScore - reportB.overallScore : 0;
  const winner =
    reportA && reportB
      ? Math.abs(scoreDiff) < 5
        ? 'Tie / No Clear Winner'
        : scoreDiff > 0
        ? 'Answer A'
        : 'Answer B'
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Scale className="w-6 h-6 text-indigo-400" />
          <span>Side-by-Side Model Comparison</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Evaluate two distinct AI answers concurrently against exact financial formulas and safety benchmarks
        </p>
      </div>

      <BentoCard className="space-y-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
          Shared Financial Question
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-indigo-400 mb-1">Answer A</label>
            <textarea
              value={answerA}
              onChange={(e) => setAnswerA(e.target.value)}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-purple-400 mb-1">Answer B</label>
            <textarea
              value={answerB}
              onChange={(e) => setAnswerB(e.target.value)}
              rows={4}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100"
            />
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
          <span>{loading ? 'Evaluating Both Answers...' : 'Run Side-by-Side Comparison'}</span>
        </button>
      </BentoCard>

      {error && (
        <BentoCard className="border-rose-500/40 bg-rose-950/20 text-rose-300 text-xs p-4">
          {error}
        </BentoCard>
      )}

      {/* Winner Banner & Comparison Side-by-Side */}
      {reportA && reportB && (
        <div className="space-y-6 animate-in fade-in">
          {/* Winner Banner */}
          <BentoCard gradient className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl">
                <Trophy className="w-8 h-8 text-amber-300" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-indigo-200">
                  Reliability Benchmark Decision
                </span>
                <h2 className="text-2xl font-extrabold text-white">{winner}</h2>
                <p className="text-xs text-indigo-100/80 mt-0.5">
                  Winner determined strictly by mathematical accuracy, safety caps, and logic consistency.
                </p>
              </div>
            </div>
            <div className="text-right hidden sm:block">
              <span className="text-3xl font-extrabold text-white">
                {Math.abs(scoreDiff)} pts
              </span>
              <p className="text-[10px] text-indigo-200 uppercase font-bold">Score Differential</p>
            </div>
          </BentoCard>

          {/* Side by Side Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Answer A Result */}
            <BentoCard className="space-y-4 border-indigo-500/30">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="font-bold text-indigo-400 text-sm">Answer A Report</span>
                <span className="text-2xl font-extrabold text-white">{reportA.overallScore}/100</span>
              </div>
              <div className="text-xs space-y-2">
                <p className="text-zinc-400 font-semibold">Reliability: {reportA.reliabilityLevel}</p>
                <p className="text-zinc-400">Math Engine: {reportA.deterministicReport.overallMatch ? 'Passed' : 'Failed'}</p>
                <p className="text-zinc-400">Numerical Score: {reportA.metricScores.numericalAccuracy.score}/100</p>
              </div>
            </BentoCard>

            {/* Answer B Result */}
            <BentoCard className="space-y-4 border-purple-500/30">
              <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                <span className="font-bold text-purple-400 text-sm">Answer B Report</span>
                <span className="text-2xl font-extrabold text-white">{reportB.overallScore}/100</span>
              </div>
              <div className="text-xs space-y-2">
                <p className="text-zinc-400 font-semibold">Reliability: {reportB.reliabilityLevel}</p>
                <p className="text-zinc-400">Math Engine: {reportB.deterministicReport.overallMatch ? 'Passed' : 'Failed'}</p>
                <p className="text-zinc-400">Numerical Score: {reportB.metricScores.numericalAccuracy.score}/100</p>
              </div>
            </BentoCard>
          </div>
        </div>
      )}
    </div>
  );
};
