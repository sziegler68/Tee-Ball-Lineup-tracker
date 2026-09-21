import React from 'react';
import { getEnabledPositions, calculatePlayerStats } from '../utils/fairnessEngine';
import { Award, CheckCircle2 } from 'lucide-react';

export default function StatsDashboard({ players, games, currentGame, enabledPositions }) {
  const positions = getEnabledPositions(enabledPositions || []);
  const statsMap = calculatePlayerStats(players, games, currentGame, enabledPositions);
  const playerStatsList = Object.values(statsMap);

  // Check if every player has played each position at least once
  const milestoneMap = {};
  positions.forEach(({ key }) => {
    const unplayedCount = playerStatsList.filter((s) => (s.seasonCounts[key] || 0) === 0).length;
    milestoneMap[key] = unplayedCount === 0;
  });

  // Group positions by category for display
  const offensePositions = positions.filter((p) => p.category === 'offense');
  const defensePositions = positions.filter((p) => p.category === 'defense');

  return (
    <div class="max-w-4xl mx-auto p-4 space-y-6">
      {/* Top Card */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-2">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          Season Fairness & Role Matrix
        </h2>
        <p class="text-xs text-slate-400">
          Total turns played across all recorded games this season (including past history).
          Tracking {positions.length} position{positions.length !== 1 ? 's' : ''}.
        </p>

        {/* Milestone Pills */}
        <div class="flex flex-wrap gap-2 pt-2">
          {positions.map(({ key, label, icon }) => {
            const isCompleted = milestoneMap[key];
            return (
              <div
                key={key}
                class={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <span>{icon}</span>
                <span class="hidden sm:inline">{label}:</span>
                {isCompleted ? (
                  <span class="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 class="w-3 h-3" /> Done
                  </span>
                ) : (
                  <span class="text-amber-400 font-bold">In Progress</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Matrix Table */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-700 uppercase tracking-wider">
              <tr>
                <th class="p-3 sticky left-0 bg-slate-900/90 z-10">Player</th>
                {offensePositions.map(({ key, label }) => (
                  <th key={key} class="p-3 text-center whitespace-nowrap" title={label}>
                    {label.length > 12 ? label.replace(/( to | \(.*\))/g, '').substring(0, 8) : label}
                  </th>
                ))}
                {defensePositions.map(({ key, label }) => (
                  <th key={key} class="p-3 text-center whitespace-nowrap" title={label}>
                    {label.length > 12 ? label.substring(0, 8) : label}
                  </th>
                ))}
                <th class="p-3 text-center font-black text-emerald-400">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-700/60 font-medium">
              {playerStatsList.length === 0 ? (
                <tr>
                  <td colSpan={positions.length + 2} class="p-6 text-center text-slate-400">
                    No players in roster.
                  </td>
                </tr>
              ) : (
                playerStatsList.map((stat) => {
                  const { seasonCounts, name, active } = stat;
                  return (
                    <tr
                      key={stat.id}
                      class={`hover:bg-slate-700/30 transition ${
                        active ? 'text-white' : 'text-slate-500 bg-slate-900/40'
                      }`}
                    >
                      <td class="p-3 font-bold sticky left-0 bg-slate-800 z-10 flex items-center gap-2">
                        <span>{name}</span>
                        {!active && <span class="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">Absent</span>}
                      </td>
                      {offensePositions.map(({ key }) => (
                        <td key={key} class="p-3 text-center">
                          <span class={`inline-block px-2 py-0.5 rounded font-bold ${(seasonCounts[key] || 0) === 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-slate-900 text-slate-300'}`}>
                            {seasonCounts[key] || 0}
                          </span>
                        </td>
                      ))}
                      {defensePositions.map(({ key }) => (
                        <td key={key} class="p-3 text-center">
                          <span class={`inline-block px-2 py-0.5 rounded font-bold ${(seasonCounts[key] || 0) === 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-slate-900 text-slate-300'}`}>
                            {seasonCounts[key] || 0}
                          </span>
                        </td>
                      ))}
                      <td class="p-3 text-center font-black text-emerald-400 text-sm">
                        {seasonCounts.totalKeyRoles || 0}
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
