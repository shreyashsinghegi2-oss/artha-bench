import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Cpu,
  GraduationCap,
  Layers,
  Menu,
  Scale,
  ShieldCheck,
  Sliders,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import { GroqConnectionStatus } from '../types';

interface NavigationProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  connectionStatus?: GroqConnectionStatus;
  demoMode: boolean;
  onToggleDemoMode: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  connectionStatus,
  demoMode,
  onToggleDemoMode,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: Layers },
    { id: 'quick-check', label: 'Quick Check', icon: Zap },
    { id: 'tutor', label: 'Financial Tutor', icon: GraduationCap },
    { id: 'lab', label: 'Evaluation Lab', icon: Activity },
    { id: 'compare', label: 'Comparison', icon: Scale },
    { id: 'scenarios', label: 'Scenarios', icon: BookOpen },
    { id: 'batch', label: 'Batch Benchmark', icon: BarChart3 },
    { id: 'connections', label: 'AI Connections', icon: Cpu },
    { id: 'history', label: 'Reports & History', icon: ShieldCheck },
    { id: 'methodology', label: 'Methodology', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Header */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 p-0.5 shadow-md shadow-indigo-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">Artha Bench</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.0 Groq
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block">AI Financial Reliability Evaluation Framework</p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden xl:flex items-center gap-1 bg-zinc-900/90 border border-zinc-800 p-1.5 rounded-2xl">
          {navItems.slice(0, 9).map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Indicators & Action Controls */}
        <div className="flex items-center gap-3">
          {/* Groq Live Connection Badge */}
          <button
            onClick={() => onSelectTab('connections')}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              connectionStatus?.verified
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : connectionStatus?.configured
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                connectionStatus?.verified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold">
              {connectionStatus?.verified
                ? 'Groq Connected'
                : connectionStatus?.configured
                ? 'Groq Key Issue'
                : connectionStatus
                ? 'Groq Not Configured'
                : 'Checking Groq'}
            </span>
          </button>

          {/* Mode Switcher */}
          <button
            onClick={onToggleDemoMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              demoMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            }`}
          >
            {demoMode ? 'Demo Mode' : connectionStatus?.verified ? 'Live Groq' : 'Live Not Ready'}
          </button>

          {/* Settings & Account Buttons */}
          <div className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('settings')}
              className={`p-2 rounded-xl border transition-all ${
                currentTab === 'settings'
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="Settings"
            >
              <Sliders className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectTab('account')}
              className={`p-2 rounded-xl border transition-all ${
                currentTab === 'account'
                  ? 'bg-zinc-800 border-zinc-700 text-white'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
              }`}
              title="User Account"
            >
              <User className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden mt-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
