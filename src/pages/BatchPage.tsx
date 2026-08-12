import React, { useState } from 'react';
import { BentoCard } from '../components/BentoCard';
import {
  BarChart3,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Play,
  RotateCcw,
  StopCircle,
  Terminal,
} from 'lucide-react';
import { BatchJob } from '../types';

export const BatchPage: React.FC = () => {
  const [concurrency, setConcurrency] = useState(2);
  const [retryCount, setRetryCount] = useState(1);
  const [running, setRunning] = useState(false);
  const [currentJob, setCurrentJob] = useState<BatchJob | null>(null);

  const handleStartBatch = async () => {
    setRunning(true);
    try {
      const res = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concurrency, retryCount }),
      });
      if (!res.ok) throw new Error('Failed to start batch job.');
      const job: BatchJob = await res.json();
      setCurrentJob(job);

      // Poll status every 1.5 seconds until completed or cancelled
      const pollId = setInterval(async () => {
        const pollRes = await fetch(`/api/batches/${job.id}`);
        if (pollRes.ok) {
          const updated: BatchJob = await pollRes.json();
          setCurrentJob(updated);
          if (updated.status === 'completed' || updated.status === 'cancelled' || updated.status === 'failed') {
            clearInterval(pollId);
            setRunning(false);
          }
        }
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Batch start failed.');
      setRunning(false);
    }
  };

  const handleCancel = async () => {
    if (currentJob) {
      await fetch(`/api/batches/${currentJob.id}/cancel`, { method: 'POST' });
    }
  };

  const handleDownloadJSON = () => {
    if (!currentJob) return;
    const blob = new Blob([JSON.stringify(currentJob, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentJob.id}-trace.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <span>Batch Benchmark Control Center</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Automated scenario suite runner with Expected Calibration Error (ECE) and Attack Success Rate analytics
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <BentoCard className="space-y-4">
          <h3 className="font-bold text-sm text-white border-b border-zinc-800 pb-2">Run Parameters</h3>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">
              Concurrency (1 - 8 threads)
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={concurrency}
              onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
              className="w-full text-indigo-500 accent-indigo-500"
            />
            <span className="text-xs font-mono text-indigo-400 font-bold">{concurrency} Worker Threads</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase mb-1">Max Retries on Error</label>
            <select
              value={retryCount}
              onChange={(e) => setRetryCount(parseInt(e.target.value, 10))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="0">0 Retries</option>
              <option value="1">1 Retry</option>
              <option value="2">2 Retries</option>
              <option value="3">3 Retries</option>
            </select>
          </div>

          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-zinc-400">
              <span>Models:</span>
              <span className="text-white font-mono">gpt-oss-120b + 20b</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Target Suite:</span>
              <span className="text-white font-mono">Curated Benchmark Suite</span>
            </div>
          </div>

          {!running ? (
            <button
              onClick={handleStartBatch}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Batch Runner</span>
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <StopCircle className="w-4 h-4" />
              <span>Cancel Batch Execution</span>
            </button>
          )}
        </BentoCard>

        {/* Realtime Progress & Analytics */}
        <div className="lg:col-span-2 space-y-5">
          {currentJob ? (
            <div className="space-y-5">
              {/* Progress Card */}
              <BentoCard>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm text-white">Batch Job Progress ({currentJob.id})</span>
                  <span className="text-xs font-mono text-indigo-400">
                    {currentJob.completedItems + currentJob.failedItems} / {currentJob.totalItems} Completed
                  </span>
                </div>
                <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{
                      width: `${
                        ((currentJob.completedItems + currentJob.failedItems) / currentJob.totalItems) * 100
                      }%`,
                    }}
                  />
                </div>
              </BentoCard>

              {/* Metrics Summary Grid if finished */}
              {currentJob.metrics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <BentoCard className="p-4 text-center">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Avg Reliability</p>
                    <p className="text-2xl font-bold text-white mt-1">{currentJob.metrics.averageScore}/100</p>
                  </BentoCard>
                  <BentoCard className="p-4 text-center">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">ECE Score</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{currentJob.metrics.ece}</p>
                  </BentoCard>
                  <BentoCard className="p-4 text-center">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Brier Score</p>
                    <p className="text-2xl font-bold text-indigo-400 mt-1">{currentJob.metrics.brierScore}</p>
                  </BentoCard>
                  <BentoCard className="p-4 text-center">
                    <p className="text-[10px] uppercase font-bold text-zinc-500">Attack Success</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {(currentJob.metrics.attackSuccessRate * 100).toFixed(0)}%
                    </p>
                  </BentoCard>
                </div>
              )}

              {/* Console Logs Stream */}
              <BentoCard className="bg-zinc-950 border-zinc-800 font-mono text-xs p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>Live Execution Logs</span>
                  </div>
                  {currentJob.status === 'completed' && (
                    <button
                      onClick={handleDownloadJSON}
                      className="text-[11px] font-sans font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download JSON Trace</span>
                    </button>
                  )}
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 text-zinc-300 pt-2">
                  {currentJob.logs.map((log, idx) => (
                    <p key={idx} className="leading-relaxed">
                      {log}
                    </p>
                  ))}
                </div>
              </BentoCard>
            </div>
          ) : (
            <BentoCard className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
              <BarChart3 className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-sm font-semibold text-zinc-300">No Active Batch Execution</p>
              <p className="text-xs text-zinc-500 max-w-sm mt-1">
                Configure workers and launch the batch runner to execute automated reliability scenario sweeps.
              </p>
            </BentoCard>
          )}
        </div>
      </div>
    </div>
  );
};
