import React from 'react';
import { BentoCard } from '../components/BentoCard';
import { Award, BarChart3, Lock, ShieldCheck, User } from 'lucide-react';
import { ComprehensiveEvaluationReport } from '../types';

interface AccountPageProps {
  reports: ComprehensiveEvaluationReport[];
}

export const AccountPage: React.FC<AccountPageProps> = ({ reports }) => {
  const totalCount = reports.length;
  const avgScore =
    totalCount > 0 ? Math.round(reports.reduce((acc, r) => acc + r.overallScore, 0) / totalCount) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-400" />
          <span>User Profile & Research Workspace</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Manage researcher credentials, consent, and evaluation statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* User Card */}
        <BentoCard className="md:col-span-1 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg">
              RA
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Research Analyst</h3>
              <p className="text-xs text-zinc-400">Researcher / Reviewer</p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Verified Access
              </span>
            </div>
          </div>
        </BentoCard>

        {/* Stats 1 */}
        <BentoCard className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Total Evaluations Executed</span>
          <div className="text-4xl font-extrabold text-white my-2">{totalCount}</div>
          <p className="text-xs text-zinc-500">Recorded in this session/browser</p>
        </BentoCard>

        {/* Stats 2 */}
        <BentoCard className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Average Reliability Score</span>
          <div className="text-4xl font-extrabold text-indigo-400 my-2">{avgScore} / 100</div>
          <p className="text-xs text-zinc-500">Across all evaluated AI responses</p>
        </BentoCard>
      </div>

      <BentoCard className="space-y-3">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Data Privacy & Consent Status</span>
        </h3>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Artha Bench adheres strictly to privacy-first benchmark research policies. Personal financial data, income details, or user identity strings are never logged to public servers or shared with external third parties.
        </p>
      </BentoCard>
    </div>
  );
};
