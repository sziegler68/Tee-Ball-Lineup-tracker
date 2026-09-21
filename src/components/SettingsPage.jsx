import React from 'react';
import { Settings as SettingsIcon, Shield, Swords } from 'lucide-react';
import { ALL_POSITIONS, getDefaultEnabledKeys } from '../utils/fairnessEngine';

export default function SettingsPage({ enabledPositions, setEnabledPositions }) {
  const offensePositions = ALL_POSITIONS.filter((p) => p.category === 'offense');
  const defensePositions = ALL_POSITIONS.filter((p) => p.category === 'defense');
  const defaultKeys = getDefaultEnabledKeys();

  const handleToggle = (key) => {
    if (enabledPositions.includes(key)) {
      // Don't allow disabling all positions
      if (enabledPositions.length <= 1) return;
      setEnabledPositions(enabledPositions.filter((k) => k !== key));
    } else {
      setEnabledPositions([...enabledPositions, key]);
    }
  };

  const handleResetDefaults = () => {
    setEnabledPositions(getDefaultEnabledKeys());
  };

  const handleEnableAll = () => {
    setEnabledPositions(ALL_POSITIONS.map((p) => p.key));
  };

  const renderPositionToggle = (pos) => {
    const isEnabled = enabledPositions.includes(pos.key);
    const isDefault = defaultKeys.includes(pos.key);

    return (
      <div
        key={pos.key}
        class={`flex items-center justify-between p-3 rounded-xl border transition ${
          isEnabled
            ? 'bg-emerald-950/30 border-emerald-500/30'
            : 'bg-slate-900/40 border-slate-700/50'
        }`}
      >
        <div class="flex items-center gap-2.5">
          <span class="text-lg">{pos.icon}</span>
          <div>
            <span class={`text-sm font-semibold ${isEnabled ? 'text-white' : 'text-slate-400'}`}>
              {pos.label}
            </span>
            {isDefault && (
              <span class="ml-2 text-[10px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                Default
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => handleToggle(pos.key)}
          class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
          }`}
        >
          <span
            class={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <div class="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <SettingsIcon class="w-4 h-4" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">Position Settings</h2>
              <p class="text-xs text-slate-400">Choose which positions to track for this team.</p>
            </div>
          </div>
        </div>

        <p class="text-xs text-slate-400 pt-1">
          Toggle positions on or off. Only enabled positions appear in Live Game, Past Games, and Fairness Stats.
          Turning a position off hides it from the UI but preserves any existing data — so you can re-enable it anytime.
        </p>

        {/* Quick Actions */}
        <div class="flex gap-2 pt-2">
          <button
            onClick={handleResetDefaults}
            class="flex-1 py-2 px-3 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 transition"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleEnableAll}
            class="flex-1 py-2 px-3 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 text-xs font-bold rounded-xl border border-violet-500/30 transition"
          >
            Enable All
          </button>
        </div>
      </div>

      {/* Offense Section */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
        <div class="p-4 bg-slate-900/60 border-b border-slate-700 flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Swords class="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 class="font-bold text-white text-sm">Offense — Batting Lineup</h3>
            <p class="text-[11px] text-slate-400">
              Track which players bat in each lineup slot per inning.
              {' '}
              <span class="text-amber-400 font-semibold">
                {offensePositions.filter((p) => enabledPositions.includes(p.key)).length}/{offensePositions.length} enabled
              </span>
            </p>
          </div>
        </div>
        <div class="p-3 space-y-2">
          {offensePositions.map(renderPositionToggle)}
        </div>
      </div>

      {/* Defense Section */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
        <div class="p-4 bg-slate-900/60 border-b border-slate-700 flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Shield class="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 class="font-bold text-white text-sm">Defense — Field Positions</h3>
            <p class="text-[11px] text-slate-400">
              Track which players play each defensive position per inning.
              {' '}
              <span class="text-sky-400 font-semibold">
                {defensePositions.filter((p) => enabledPositions.includes(p.key)).length}/{defensePositions.length} enabled
              </span>
            </p>
          </div>
        </div>
        <div class="p-3 space-y-2">
          {defensePositions.map(renderPositionToggle)}
        </div>
      </div>
    </div>
  );
}
