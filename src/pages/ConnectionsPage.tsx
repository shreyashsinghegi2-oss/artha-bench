import React, { useState } from 'react';
import { BentoCard } from '../components/BentoCard';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  GraduationCap,
  Key,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { GroqConnectionStatus } from '../types';

interface ConnectionsPageProps {
  connectionStatus?: GroqConnectionStatus;
  onRefreshConnection: () => void;
}

export const ConnectionsPage: React.FC<ConnectionsPageProps> = ({
  connectionStatus,
  onRefreshConnection,
}) => {
  const [verifying, setVerifying] = useState(false);
  const [testResult, setTestResult] = useState<GroqConnectionStatus | null>(null);

  const handleVerify = async () => {
    setVerifying(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/providers/groq/verify', { method: 'POST' });
      const data: GroqConnectionStatus = await res.json();
      setTestResult(data);
      onRefreshConnection();
    } catch (err: any) {
      setTestResult({
        configured: false,
        verified: false,
        state: 'error',
        primaryModel: 'openai/gpt-oss-120b',
        secondaryModel: 'openai/gpt-oss-20b',
        searchModel: 'groq/compound-mini',
        message: err.message || 'Verification HTTP request failed.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const status = testResult || connectionStatus;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-indigo-400" />
            <span>AI Connections & Infrastructure Health</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Server-side verification of Groq API endpoints and deterministic financial engines
          </p>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
        >
          {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>{verifying ? 'Verifying Credentials...' : 'Test Groq Connection'}</span>
        </button>
      </div>

      {/* Main Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        {/* Financial Tutor */}
        <BentoCard className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl">
              <GraduationCap className="w-6 h-6 text-violet-400" />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
              status?.components?.find((item) => item.role === 'tutor')?.verified
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
            }`}>
              {status?.components?.find((item) => item.role === 'tutor')?.verified ? 'Verified' : 'Not verified'}
            </span>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-400 font-bold uppercase">Financial Tutor Model</p>
            <p className="text-base font-bold text-white mt-0.5 break-words">{status?.tutorModel || 'openai/gpt-oss-120b'}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Adaptive financial education</p>
          </div>
        </BentoCard>
        {/* Primary Evaluator */}
        <BentoCard className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
              <Zap className="w-6 h-6 text-indigo-400" />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                status?.verified
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
              }`}
            >
              {status?.verified ? 'Connected' : 'Offline / Demo'}
            </span>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-400 font-bold uppercase">Primary Evaluator Model</p>
            <p className="text-lg font-bold text-white mt-0.5">{status?.primaryModel || 'openai/gpt-oss-120b'}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Groq Server-side REST API</p>
          </div>
        </BentoCard>

        {/* Secondary Cross-Check */}
        <BentoCard className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-purple-400" />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                status?.verified
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
              }`}
            >
              {status?.verified ? 'Connected' : 'Offline / Demo'}
            </span>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-400 font-bold uppercase">Cross-Check Model</p>
            <p className="text-lg font-bold text-white mt-0.5">{status?.secondaryModel || 'openai/gpt-oss-20b'}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Independent Consensus Audit</p>
          </div>
        </BentoCard>

        {/* Search Model */}
        <BentoCard className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl">
              <Globe className="w-6 h-6 text-cyan-400" />
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                status?.verified
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
              }`}
            >
              {status?.verified ? 'Connected' : 'Offline / Demo'}
            </span>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-400 font-bold uppercase">Evidence Search Model</p>
            <p className="text-lg font-bold text-white mt-0.5">{status?.searchModel || 'groq/compound-mini'}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Statutory Regulatory Lookup</p>
          </div>
        </BentoCard>

        {/* Deterministic Math Engine */}
        <BentoCard className="flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              Ready
            </span>
          </div>
          <div className="mt-6">
            <p className="text-xs text-zinc-400 font-bold uppercase">Deterministic Math Engine</p>
            <p className="text-lg font-bold text-white mt-0.5">Decimal.js v2.0</p>
            <p className="text-[11px] text-zinc-500 mt-1">Local Server Arithmetic</p>
          </div>
        </BentoCard>
      </div>

      {status?.components && status.components.length > 0 && (
        <BentoCard>
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Per-model verification diagnostics</h2>
              <p className="text-[11px] text-zinc-500 mt-1">Each evaluator receives a minimal non-streaming chat test; search availability is checked against the model list.</p>
            </div>
            {status.verifiedAt && <span className="text-[10px] text-zinc-600">Verified {new Date(status.verifiedAt).toLocaleString()}</span>}
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {status.components.map((component) => (
              <div key={component.role} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase text-zinc-500">{component.role}</span>
                  <span className={`text-[10px] font-semibold ${component.verified ? 'text-emerald-400' : 'text-amber-400'}`}>{component.state.replaceAll('_', ' ')}</span>
                </div>
                <p className="text-xs font-semibold text-zinc-200 mt-2 break-words">{component.model}</p>
                {component.latencyMs !== undefined && <p className="text-[10px] text-zinc-600 mt-1">{component.latencyMs} ms</p>}
              </div>
            ))}
          </div>
          {status.requestId && <p className="mt-3 text-[10px] font-mono text-zinc-600">Request ID: {status.requestId}</p>}
        </BentoCard>
      )}

      {/* Secret Configuration Instructions */}
      <BentoCard className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
          <Key className="w-4 h-4" />
          <span>Server Environment Secret Configuration</span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Artha Bench reads the secret strictly on the server from <code className="text-indigo-300 bg-zinc-950 px-2 py-0.5 rounded font-mono">process.env.GROQ_API_KEY</code>. No API key is ever exposed to the client or embedded in browser code.
        </p>

        <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-2 text-xs font-mono">
          <p className="text-zinc-500"># Configure in AI Studio Settings -&gt; Secrets panel:</p>
          <p className="text-indigo-400">GROQ_API_KEY = &lt;YOUR_ROTATED_GROQ_KEY&gt;</p>
        </div>

        {status && (
          <div className={`p-4 rounded-2xl border text-xs font-sans ${
            status.verified
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
          }`}>
            <p className="font-bold">Verification Status Message:</p>
            <p className="mt-1">{status.message || 'No verification message recorded.'}</p>
          </div>
        )}
      </BentoCard>
    </div>
  );
};
