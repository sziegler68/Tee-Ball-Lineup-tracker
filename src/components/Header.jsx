import React from 'react';
import { Users, Calendar, PlayCircle, BarChart3, Download, ShieldCheck, Settings } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, onOpenBackup, teamName }) {
  const tabs = [
    { id: 'live', label: 'Live Game', icon: PlayCircle },
    { id: 'roster', label: 'Roster', icon: Users },
    { id: 'history', label: 'Past Games', icon: Calendar },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header class="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-md">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <div class="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/20">
            ⚾
          </div>
          <div>
            <h1 class="font-black text-base sm:text-lg text-white leading-tight flex items-center gap-1.5">
              {teamName || 'Tee-Ball FairPlay'}
            </h1>
            <p class="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck class="w-3 h-3 inline" /> Auto-Saved & PWA Ready
            </p>
          </div>
        </div>

        <button
          onClick={onOpenBackup}
          class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-700"
        >
          <Download class="w-3.5 h-3.5 text-emerald-400" />
          <span>Backup</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div class="max-w-4xl mx-auto px-1 flex border-t border-slate-800/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={`flex-1 py-2 px-1 flex flex-col items-center gap-0.5 border-b-2 font-medium text-[10px] sm:text-xs transition ${
                isActive
                  ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon class={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
