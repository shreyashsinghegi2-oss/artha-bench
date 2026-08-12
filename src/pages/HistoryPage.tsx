import React, { useState } from 'react';
import { BentoCard } from '../components/BentoCard';
import { Download, FileText, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { ComprehensiveEvaluationReport } from '../types';

interface HistoryPageProps {
  reports: ComprehensiveEvaluationReport[];
  onSelectReport: (report: ComprehensiveEvaluationReport) => void;
  onClearHistory: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  reports,
  onSelectReport,
  onClearHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = reports.filter(
    (r) =>
      r.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.verificationCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Saved Reports & Evaluation History</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Archived benchmark evaluation runs with traceable SHA-256 report verification codes
          </p>
        </div>

        {reports.length > 0 && (
          <button
            onClick={onClearHistory}
            className="px-4 py-2 bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local History</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search question, report ID, or verification code..."
          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Reports List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((r) => (
            <BentoCard key={r.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-all">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
                  <span>ID: {r.id}</span>
                  <span>•</span>
                  <span>Code: {r.verificationCode}</span>
                  <span>•</span>
                  <span>{new Date(r.timestamp).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-white text-sm line-clamp-1">{r.question}</h3>
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.overallScore >= 90
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                        : r.overallScore >= 75
                        ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-400'
                        : r.overallScore >= 60
                        ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                        : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                    }`}
                  >
                    Score: {r.overallScore}/100 ({r.reliabilityLevel})
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {r.metadata.country} | {r.metadata.currency}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onSelectReport(r)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Full Report</span>
              </button>
            </BentoCard>
          ))}
        </div>
      ) : (
        <BentoCard className="p-12 text-center text-zinc-500">
          <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-sm font-semibold text-zinc-300">No Evaluation Reports Found</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Run Quick Check or Evaluation Lab to generate and save your financial AI benchmark evaluation reports.
          </p>
        </BentoCard>
      )}
    </div>
  );
};
