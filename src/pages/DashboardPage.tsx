import React from 'react';
import { BentoCard } from '../components/BentoCard';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Database,
  Lock,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GroqConnectionStatus } from '../types';

interface DashboardPageProps {
  onSelectTab: (tab: string) => void;
  connectionStatus?: GroqConnectionStatus;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectTab, connectionStatus }) => {
  return (
    <div className="space-y-6">
      {/* Bento Grid Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Main Hero Card (2x2 span on large screens) */}
        <BentoCard gradient className="md:col-span-2 md:row-span-2 flex flex-col justify-between p-8 md:p-10 min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-indigo-200 border border-white/10">
                Evaluation & Reliability Benchmark
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Measuring Trust in AI Financial Intelligence
            </h1>
            <p className="mt-4 text-indigo-100/80 text-sm md:text-base leading-relaxed max-w-xl">
              Artha Bench evaluates AI-generated personal finance answers across 7 core reliability dimensions using deterministic math checks, authoritative regulatory evidence, and dual Groq model consensus.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={() => onSelectTab('quick-check')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 hover:bg-zinc-100 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-black/20"
            >
              <Zap className="w-4 h-4 fill-zinc-950" />
              <span>Run Quick Check</span>
            </button>
            <button
              onClick={() => onSelectTab('lab')}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-900/40 hover:bg-indigo-900/60 border border-white/20 rounded-2xl font-bold text-sm text-white transition-all"
            >
              <Activity className="w-4 h-4 text-indigo-300" />
              <span>Open Evaluation Lab</span>
            </button>
            <button
              onClick={() => onSelectTab('tutor')}
              className="flex items-center gap-2 px-6 py-3 bg-violet-900/40 hover:bg-violet-900/60 border border-white/20 rounded-2xl font-bold text-sm text-white transition-all"
            >
              <GraduationCap className="w-4 h-4 text-violet-300" />
              <span>Learn with Financial Tutor</span>
            </button>
          </div>
        </BentoCard>

        {/* Engine Status Bento Card */}
        <BentoCard className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
              <Cpu className="w-6 h-6 text-indigo-400" />
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              connectionStatus?.verified
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
            }`}>
              {connectionStatus?.verified ? 'Active' : connectionStatus ? 'Not Verified' : 'Checking'}
            </span>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Dual Model Groq Engine</p>
            <p className="text-xl font-bold text-white mt-1">gpt-oss-120b</p>
            <p className="text-xs text-zinc-500 mt-1">Cross-check: gpt-oss-20b</p>
          </div>
        </BentoCard>

        {/* Deterministic Math Engine Card */}
        <BentoCard className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              Verified
            </span>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Deterministic Engine</p>
            <p className="text-xl font-bold text-white mt-1">Decimal.js v2.0</p>
            <p className="text-xs text-zinc-500 mt-1">18 Exact Financial Formulas</p>
          </div>
        </BentoCard>

        {/* Maintainer Info Card */}
        <BentoCard className="flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center font-bold text-zinc-950 text-lg shadow-md">
              SS
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Shreyash Singh</h3>
              <p className="text-xs text-zinc-400">Creator & Lead Architect</p>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-4 leading-relaxed">
            Artha Bench is developed to eliminate financial AI hallucinations and enforce rigorous safety standards in personal finance advice.
          </p>
        </BentoCard>

        {/* Disclaimer / No Advice Card */}
        <BentoCard className="flex flex-col justify-between bg-zinc-900/60 border-zinc-800/80">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Research Disclaimer</span>
          </div>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
            Artha Bench is an <strong>evaluation and reliability benchmark</strong>. It does not provide certified financial, investment, legal, insurance, or tax recommendations.
          </p>
        </BentoCard>
      </div>

      {/* 7 Core Reliability Dimensions Bento Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">The 7 Dimensions of Financial AI Reliability</h2>
            <p className="text-xs text-zinc-400">Every response is evaluated against rigorous multi-metric criteria</p>
          </div>
          <button
            onClick={() => onSelectTab('methodology')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Read Methodology</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BentoCard className="p-5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-3">
              25%
            </div>
            <h3 className="font-bold text-sm text-white">Numerical Accuracy</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Verifies exact arithmetic, formula parameters, compounding periods, and interest rates.
            </p>
          </BentoCard>

          <BentoCard className="p-5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 font-bold mb-3">
              20%
            </div>
            <h3 className="font-bold text-sm text-white">Safety & Risk Awareness</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Catches guaranteed stock return promises, unvetted debt schemes, and fraud risks.
            </p>
          </BentoCard>

          <BentoCard className="p-5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold mb-3">
              15%
            </div>
            <h3 className="font-bold text-sm text-white">Reasoning Consistency</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Ensures logic flows coherently from assumptions to final educational conclusions.
            </p>
          </BentoCard>

          <BentoCard className="p-5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold mb-3">
              10%
            </div>
            <h3 className="font-bold text-sm text-white">Localization Accuracy</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Checks regional statutory tax limits (Section 80C, 401k, ISA) and regulator guidelines.
            </p>
          </BentoCard>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <BentoCard
          className="cursor-pointer hover:border-indigo-500/50 transition-all group"
          onClick={() => onSelectTab('scenarios')}
        >
          <div className="flex justify-between items-start">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h3 className="font-bold text-lg text-white mt-4">Scenario Library</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Browse 7+ curated test benchmark scenarios across budgeting, loans, inflation & tax rules.
          </p>
        </BentoCard>

        <BentoCard
          className="cursor-pointer hover:border-indigo-500/50 transition-all group"
          onClick={() => onSelectTab('compare')}
        >
          <div className="flex justify-between items-start">
            <Scale className="w-6 h-6 text-indigo-400" />
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h3 className="font-bold text-lg text-white mt-4">Comparison Mode</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Evaluate two AI answers side-by-side to compare reliability scores, safety warnings & math accuracy.
          </p>
        </BentoCard>

        <BentoCard
          className="cursor-pointer hover:border-indigo-500/50 transition-all group"
          onClick={() => onSelectTab('batch')}
        >
          <div className="flex justify-between items-start">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-indigo-400 transition-colors" />
          </div>
          <h3 className="font-bold text-lg text-white mt-4">Batch Benchmark Center</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Run automated evaluation passes across scenario suites with ECE, Brier score, and attack success analytics.
          </p>
        </BentoCard>
      </div>
    </div>
  );
};
