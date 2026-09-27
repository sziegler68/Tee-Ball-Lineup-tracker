import React, { useState } from 'react';
import {
  FIELDING_POSITIONS,
  MAX_PLAYERS,
  calculateSeasonStats,
  getOrdinalSuffix,
} from '../utils/fairnessEngine';
import { Award, CheckCircle2, Shield, Swords } from 'lucide-react';

export default function StatsDashboard({ players, games, currentGame }) {
  const [activeTab, setActiveTab] = useState('fielding'); // 'fielding' | 'batting'

  const statsMap = calculateSeasonStats(players, games, currentGame);
  const playerStatsList = Object.values(statsMap);

  // Batting slots list (1 to 10)
  const battingSlots = [];
  for (let i = 1; i <= MAX_PLAYERS; i++) {
    battingSlots.push({
      key: `bat${i}`,
      label: i === 1 ? '1st (Lead)' : (i === 10 ? '10th (Last)' : `${i}${getOrdinalSuffix(i)}`),
      short: `#${i}`,
    });
  }

  // Milestone calculation: has every active player played this position/slot?
  const activePlayers = playerStatsList.filter((s) => s.active);

  const getMilestone = (key, isBatting) => {
    if (activePlayers.length === 0) return false;
    return activePlayers.every((s) => {
      const count = isBatting ? (s.batting[key] || 0) : (s.fielding[key] || 0);
      return count > 0;
    });
  };

  return (
    <div class="max-w-4xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Top Banner & Tab Switcher */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 class="text-lg font-black text-white flex items-center gap-2">
              Season Fairness & Role Matrix
            </h2>
            <p class="text-xs text-slate-400">
              Turn counts across all recorded games (including past history & active game).
            </p>
          </div>

          {/* Switcher Toggle */}
          <div class="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('fielding')}
              class={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'fielding'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield class="w-3.5 h-3.5" />
              <span>🧤 Fielding ({FIELDING_POSITIONS.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('batting')}
              class={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                activeTab === 'batting'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords class="w-3.5 h-3.5" />
              <span>⚾ Batting ({MAX_PLAYERS})</span>
            </button>
          </div>
        </div>

        {/* Milestone Pills */}
        <div class="flex flex-wrap gap-1.5 pt-1">
          {activeTab === 'fielding' ? (
            FIELDING_POSITIONS.map((pos) => {
              const done = getMilestone(pos.key, false);
              return (
                <div
                  key={pos.key}
                  class={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 border ${
                    done
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900 border-slate-700/80 text-slate-400'
                  }`}
                >
                  <span>{pos.short}:</span>
                  {done ? (
                    <span class="text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 class="w-3 h-3" /> All played!
                    </span>
                  ) : (
                    <span class="text-amber-400 font-bold">Needs turns</span>
                  )}
                </div>
              );
            })
          ) : (
            battingSlots.map((slot) => {
              const done = getMilestone(slot.key, true);
              return (
                <div
                  key={slot.key}
                  class={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 border ${
                    done
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900 border-slate-700/80 text-slate-400'
                  }`}
                >
                  <span>{slot.label}:</span>
                  {done ? (
                    <span class="text-emerald-400 font-bold flex items-center gap-0.5">
                      <CheckCircle2 class="w-3 h-3" /> All
                    </span>
                  ) : (
                    <span class="text-amber-400 font-bold">In progress</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stats Matrix Table */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-700 uppercase tracking-wider">
              <tr>
                <th class="p-3 sticky left-0 bg-slate-900/95 z-10">Player</th>
                {activeTab === 'fielding' ? (
                  FIELDING_POSITIONS.map((pos) => (
                    <th key={pos.key} class="p-3 text-center whitespace-nowrap" title={pos.label}>
                      {pos.short}
                    </th>
                  ))
                ) : (
                  battingSlots.map((slot) => (
                    <th key={slot.key} class="p-3 text-center whitespace-nowrap" title={slot.label}>
                      {slot.label}
                    </th>
                  ))
                )}
                <th class="p-3 text-center font-black text-emerald-400">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/60 font-medium">
              {playerStatsList.length === 0 ? (
                <tr>
                  <td colSpan={12} class="p-6 text-center text-slate-400">
                    No players in roster.
                  </td>
                </tr>
              ) : (
                playerStatsList.map((stat) => {
                  const { name, active, fielding, batting, totalFielding, totalBatting } = stat;
                  const isFielding = activeTab === 'fielding';
                  const total = isFielding ? totalFielding : totalBatting;

                  return (
                    <tr
                      key={stat.id}
                      class={`hover:bg-slate-700/30 transition ${
                        active ? 'text-white' : 'text-slate-500 bg-slate-900/40'
                      }`}
                    >
                      <td class="p-3 font-bold sticky left-0 bg-slate-800/95 z-10 flex items-center gap-1.5 whitespace-nowrap">
                        <span>{name}</span>
                        {!active && (
                          <span class="text-[9px] bg-slate-700 text-slate-400 px-1 py-0.5 rounded">
                            Absent
                          </span>
                        )}
                      </td>

                      {isFielding
                        ? FIELDING_POSITIONS.map((pos) => {
                            const val = fielding[pos.key] || 0;
                            return (
                              <td key={pos.key} class="p-3 text-center">
                                <span
                                  class={`inline-block px-2 py-0.5 rounded font-bold ${
                                    val === 0
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                      : 'bg-slate-900 text-slate-200'
                                  }`}
                                >
                                  {val}
                                </span>
                              </td>
                            );
                          })
                        : battingSlots.map((slot) => {
                            const val = batting[slot.key] || 0;
                            return (
                              <td key={slot.key} class="p-3 text-center">
                                <span
                                  class={`inline-block px-2 py-0.5 rounded font-bold ${
                                    val === 0
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                      : 'bg-slate-900 text-slate-200'
                                  }`}
                                >
                                  {val}
                                </span>
                              </td>
                            );
                          })}

                      <td class="p-3 text-center font-black text-emerald-400 text-sm">
                        {total}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
