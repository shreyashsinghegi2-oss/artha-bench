import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from 'recharts';
import { ComprehensiveEvaluationReport } from '../types';

interface ReportModalProps {
  report: ComprehensiveEvaluationReport | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const radarData = [
    { subject: 'Numerical', score: report.metricScores.numericalAccuracy.score },
    { subject: 'Safety', score: report.metricScores.safetyAndRiskAwareness.score },
    { subject: 'Reasoning', score: report.metricScores.reasoningConsistency.score },
    { subject: 'Localization', score: report.metricScores.localizationAccuracy.score },
    { subject: 'Assumptions', score: report.metricScores.assumptionTransparency.score },
    { subject: 'Explainability', score: report.metricScores.explainability.score },
    { subject: 'Completeness', score: report.metricScores.completeness.score },
  ];

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Artha-Bench-Report-${report.id}.json`;
    a.click();
  };

  const handleExportCSV = () => {
    const csvRows = [
      ['Metric', 'Score', 'Status', 'Explanation'],
      ['Overall Score', report.overallScore, report.reliabilityLevel, 'Aggregated Score'],
      ...Object.entries(report.metricScores).map(([m, data]) => [
        m,
        data.score,
        data.status,
        `"${data.explanation.replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = csvRows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Artha-Bench-Report-${report.id}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 text-zinc-100 shadow-2xl relative animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-white">Artha Bench Evaluation Report</span>
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Code: {report.verificationCode}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Run ID: {report.runId} • {new Date(report.timestamp).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white flex flex-col justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Overall Score</span>
            <div className="text-5xl font-extrabold my-2">{report.overallScore} <span className="text-lg font-normal text-indigo-200">/ 100</span></div>
            <span className="text-xs font-bold uppercase px-3 py-1 bg-white/20 rounded-full w-fit">
              {report.reliabilityLevel} Level
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-xs space-y-2">
            <span className="font-bold uppercase text-zinc-400">Consensus Audit</span>
            <div className="flex justify-between border-b border-zinc-800 pb-1">
              <span className="text-zinc-400">Primary Model:</span>
              <span className="font-bold text-white">{report.providerMetadata.primaryModel}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800 pb-1">
              <span className="text-zinc-400">Secondary Model:</span>
              <span className="font-bold text-white">{report.providerMetadata.secondaryModel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Agreement Level:</span>
              <span className="font-bold text-indigo-400">{report.agreementLevel}</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between text-xs space-y-2">
            <span className="font-bold uppercase text-zinc-400">Deterministic Engine</span>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>{report.deterministicReport.overallMatch ? 'Math Formulas Verified' : 'Math Error Flagged'}</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {report.deterministicReport.notes[0]}
            </p>
          </div>
        </div>

        {/* Radar Chart & Metric Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-64 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#27272a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#71717a', fontSize: 8 }} />
                <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 text-xs">
            {Object.entries(report.metricScores).map(([mKey, metric]) => (
              <div key={mKey} className="flex items-center justify-between p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl">
                <span className="capitalize font-semibold text-zinc-300">{mKey.replace(/([A-Z])/g, ' $1')}</span>
                <span className={`font-mono font-bold ${metric.score >= 80 ? 'text-emerald-400' : metric.score >= 60 ? 'text-indigo-400' : 'text-rose-400'}`}>
                  {metric.score} / 100
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Corrected Educational Answer */}
        {report.correctedEducationalAnswer && (
          <div className="p-5 bg-zinc-950 border border-indigo-500/30 rounded-2xl space-y-2">
            <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Corrected Educational Model Answer</span>
            </h4>
            <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {report.correctedEducationalAnswer}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-800 pt-4">
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
