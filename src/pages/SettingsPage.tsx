import React from 'react';
import { BentoCard } from '../components/BentoCard';
import { Key, Moon, Shield, Sliders, Trash2 } from 'lucide-react';
import { GroqConnectionStatus } from '../types';

interface SettingsPageProps {
  demoMode: boolean;
  onToggleDemoMode: () => void;
  onClearHistory: () => void;
  connectionStatus?: GroqConnectionStatus;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  demoMode,
  onToggleDemoMode,
  onClearHistory,
  connectionStatus,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-6 h-6 text-indigo-400" />
          <span>System & Preferences Settings</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Configure benchmark runtime preferences and data retention</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Runtime Mode Card */}
        <BentoCard className="space-y-4">
          <h3 className="font-bold text-sm text-white border-b border-zinc-800 pb-2">Execution Environment</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Live Groq vs Offline Demo Mode</p>
              <p className="text-[11px] text-zinc-400">Toggle between live server calls and labelled offline fixtures</p>
            </div>
            <button
              onClick={onToggleDemoMode}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                demoMode
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-indigo-600 border-indigo-500 text-white'
              }`}
            >
              {demoMode ? 'Demo Fixtures' : connectionStatus?.verified ? 'Live Groq Active' : 'Live Groq Not Verified'}
            </button>
          </div>
        </BentoCard>

        {/* API Key Security Disclaimer */}
        <BentoCard className="space-y-4">
          <h3 className="font-bold text-sm text-white border-b border-zinc-800 pb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <span>API Key Security Policy</span>
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Artha Bench does <strong>NOT</strong> provide a frontend input field for secret keys. All Groq API keys are read server-side via environment variable <code className="text-indigo-400 bg-zinc-950 px-1.5 py-0.5 rounded font-mono">GROQ_API_KEY</code>.
          </p>
        </BentoCard>

        {/* Local Storage & Reset */}
        <BentoCard className="space-y-4 md:col-span-2">
          <h3 className="font-bold text-sm text-white border-b border-zinc-800 pb-2">Data Retention & Privacy</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Clear Browser Local Evaluation History</p>
              <p className="text-[11px] text-zinc-400">Permanently delete saved reports stored in local browser cache</p>
            </div>
            <button
              onClick={onClearHistory}
              className="px-4 py-2 bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Saved History</span>
            </button>
          </div>
        </BentoCard>
      </div>
    </div>
  );
};
