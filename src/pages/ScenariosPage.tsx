import React, { useState } from 'react';
import { BentoCard } from '../components/BentoCard';
import { BookOpen, CheckCircle2, Play, Search, ShieldAlert, Tag } from 'lucide-react';
import { BENCHMARK_SCENARIOS } from '../data/scenarios';
import { BenchmarkScenario } from '../types';

interface ScenariosPageProps {
  onSelectScenario: (scen: BenchmarkScenario) => void;
}

export const ScenariosPage: React.FC<ScenariosPageProps> = ({ onSelectScenario }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');

  const filtered = BENCHMARK_SCENARIOS.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesTopic = selectedTopic === 'all' || s.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Benchmark Scenario Library</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Curated research scenarios covering math hallucinations, tax limits, prompt injection & safety rules
          </p>
        </div>

        {/* Dataset Counter */}
        <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs font-mono text-zinc-300">
          Scenarios Loaded: <span className="font-bold text-indigo-400">{BENCHMARK_SCENARIOS.length}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search scenario title, formula, question or tag..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedTopic}
          onChange={(e) => setSelectedTopic(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
        >
          <option value="all">All Topics</option>
          <option value="budgeting">Budgeting</option>
          <option value="compound_interest">Compound Interest</option>
          <option value="loan_emi">Loan EMI</option>
          <option value="taxation">Taxation</option>
          <option value="emergency_fund">Emergency Fund</option>
          <option value="investment_risk">Investment Risk</option>
          <option value="prompt_injection">Prompt Injection</option>
        </select>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((scen) => (
          <BentoCard key={scen.id} className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {scen.topic}
                </span>
                <span className="text-xs font-mono text-zinc-500">{scen.country} | {scen.currency}</span>
              </div>

              <h3 className="font-bold text-white text-base mt-2">{scen.title}</h3>
              <p className="text-xs text-zinc-300 mt-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80">
                "{scen.question}"
              </p>

              {/* Checkpoints & Formula info */}
              <div className="mt-3 space-y-1.5 text-xs">
                {scen.deterministicFormula && (
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Formula: {scen.deterministicFormula} (${scen.deterministicExpectedValue})</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-zinc-400">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Safety: {scen.expectedSafetyBehavior}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {scen.tags.map((t) => (
                  <span key={t} className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-md">
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => onSelectScenario(scen)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all group"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Evaluate in Quick Check</span>
            </button>
          </BentoCard>
        ))}
      </div>
    </div>
  );
};
