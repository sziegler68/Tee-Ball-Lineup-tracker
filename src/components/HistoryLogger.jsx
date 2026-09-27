import React, { useState } from 'react';
import { PlusCircle, Trash2, Calendar, ChevronDown, ChevronUp, Shield, Swords } from 'lucide-react';
import { FIELDING_POSITIONS, getBattingSlots, getActiveFieldingPositions } from '../utils/fairnessEngine';

const EMPTY_INNING = (num) => ({
  inning: num,
});

export default function HistoryLogger({ players, games, setGames }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [gameName, setGameName] = useState(`Game ${games.length + 1}`);
  const [gameDate, setGameDate] = useState(new Date().toISOString().slice(0, 10));

  // Attendance tracking for past games - default all players present
  const [pastAttendance, setPastAttendance] = useState(() => players.map((p) => p.id));

  // Start with 4 innings by default, but allow add/remove
  const [innings, setInnings] = useState([
    EMPTY_INNING(1),
    EMPTY_INNING(2),
    EMPTY_INNING(3),
    EMPTY_INNING(4),
  ]);

  const [expandedGameId, setExpandedGameId] = useState(null);

  const activeFielding = getActiveFieldingPositions(pastAttendance.length || players.length);
  const activeBatting = getBattingSlots(pastAttendance.length || players.length);

  const handleInningChange = (inningIdx, field, value) => {
    const updated = [...innings];
    updated[inningIdx] = { ...updated[inningIdx], [field]: value };
    setInnings(updated);
  };

  const handleAddInning = () => {
    setInnings([...innings, EMPTY_INNING(innings.length + 1)]);
  };

  const handleRemoveLastInning = () => {
    if (innings.length <= 1) return;
    setInnings(innings.slice(0, -1));
  };

  const handleTogglePastAttendance = (playerId) => {
    setPastAttendance((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSavePastGame = (e) => {
    e.preventDefault();
    const newGame = {
      id: 'g_' + Date.now(),
      name: gameName.trim() || `Game ${games.length + 1}`,
      date: gameDate,
      innings: innings,
      attendance: pastAttendance,
    };
    setGames([...games, newGame]);
    setShowAddForm(false);
    setGameName(`Game ${games.length + 2}`);
    setInnings([
      EMPTY_INNING(1),
      EMPTY_INNING(2),
      EMPTY_INNING(3),
      EMPTY_INNING(4),
    ]);
    setPastAttendance(players.map((p) => p.id));
  };

  const handleDeleteGame = (id) => {
    if (window.confirm('Delete this past game from history?')) {
      setGames(games.filter((g) => g.id !== id));
    }
  };

  const getPlayerName = (id) => {
    const p = players.find((pl) => pl.id === id);
    return p ? p.name : '—';
  };

  return (
    <div class="max-w-2xl mx-auto p-3 sm:p-4 space-y-4">
      {/* Top Banner */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <h2 class="text-lg font-black text-white flex items-center gap-2">
            Past Games History
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Log earlier games so player turns count towards season fairness.
          </p>
        </div>
        <button
          onClick={() => {
            if (!showAddForm) {
              setPastAttendance(players.map((p) => p.id));
            }
            setShowAddForm(!showAddForm);
          }}
          class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition"
        >
          <PlusCircle class="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Add Past Game'}</span>
        </button>
      </div>

      {/* Add Past Game Form */}
      {showAddForm && (
        <form onSubmit={handleSavePastGame} class="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-4 shadow-xl">
          <h3 class="font-bold text-emerald-400 text-sm border-b border-slate-700 pb-2">
            Log Past Played Game Details
          </h3>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs text-slate-400 font-semibold mb-1">Game Name</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                required
              />
            </div>
            <div>
              <label class="block text-xs text-slate-400 font-semibold mb-1">Date Played</label>
              <input
                type="date"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Attendance Checklist */}
          <div class="bg-slate-900/70 border border-slate-700/80 rounded-xl p-3 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Who Attended? ({pastAttendance.length}/{players.length})
              </span>
              <div class="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPastAttendance(players.map((p) => p.id))}
                  class="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPastAttendance([])}
                  class="text-[10px] text-slate-400 hover:text-slate-300 font-bold"
                >
                  None
                </button>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5">
              {players.map((p) => {
                const present = pastAttendance.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleTogglePastAttendance(p.id)}
                    class={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                      present
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                        : 'bg-slate-800 border-slate-700 text-slate-500 line-through'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Innings Entries */}
          <div class="space-y-4 pt-1">
            {innings.map((inn, idx) => (
              <div key={idx} class="bg-slate-900/70 border border-slate-700/80 rounded-xl p-3 space-y-3">
                <span class="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Inning {idx + 1}
                </span>

                {/* Fielding Positions */}
                <div class="space-y-1.5">
                  <span class="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Shield class="w-3 h-3 text-sky-400" /> Fielding Positions
                  </span>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {activeFielding.map((pos) => (
                      <div key={pos.key} class="flex items-center justify-between bg-slate-800 p-1.5 rounded-lg border border-slate-700/60">
                        <span class="text-xs text-slate-300 font-medium">
                          {pos.short} ({pos.label})
                        </span>
                        <select
                          value={inn[pos.key] || (pos.key === 'pitcher' ? inn.pitcher1 || '' : '')}
                          onChange={(e) => handleInningChange(idx, pos.key, e.target.value)}
                          class="bg-slate-900 text-white text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 max-w-[120px]"
                        >
                          <option value="">-- Player --</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Batting Lineup */}
                <div class="space-y-1.5 pt-1 border-t border-slate-800">
                  <span class="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                    <Swords class="w-3 h-3 text-emerald-400" /> Batting Order
                  </span>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {activeBatting.map((slot) => (
                      <div key={slot.key} class="flex items-center justify-between bg-slate-800 p-1.5 rounded-lg border border-slate-700/60">
                        <span class="text-xs text-slate-300 font-medium">
                          {slot.short} ({slot.label})
                        </span>
                        <select
                          value={inn[slot.key] || ''}
                          onChange={(e) => handleInningChange(idx, slot.key, e.target.value)}
                          class="bg-slate-900 text-white text-xs border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 max-w-[120px]"
                        >
                          <option value="">-- Player --</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Add / Remove Inning Buttons */}
            <div class="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddInning}
                class="flex-1 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-500/20 transition"
              >
                <PlusCircle class="w-3.5 h-3.5" />
                <span>Add Inning</span>
              </button>
              {innings.length > 1 && (
                <button
                  type="button"
                  onClick={handleRemoveLastInning}
                  class="py-2 px-4 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-red-500/20 transition"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span>Remove Last</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-98 transition text-sm"
          >
            Save Past Game into History
          </button>
        </form>
      )}

      {/* List of Past Games */}
      <div class="space-y-3">
        {games.length === 0 ? (
          <div class="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-8 text-center text-slate-400 text-sm">
            No past games logged yet. If you have played games earlier this season, click "Add Past Game" to account for them!
          </div>
        ) : (
          games.map((g) => {
            const isExpanded = expandedGameId === g.id;
            return (
              <div key={g.id} class="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg">
                <div class="p-3 sm:p-4 flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <Calendar class="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div>
                      <h3 class="font-bold text-white text-sm">{g.name}</h3>
                      <span class="text-xs text-slate-400">
                        {g.date} • {(g.innings || []).length} Inning{(g.innings || []).length !== 1 ? 's' : ''}
                        {g.attendance && ` • ${g.attendance.length} Players`}
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedGameId(isExpanded ? null : g.id)}
                      class="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Hide' : 'Details'}</span>
                      {isExpanded ? <ChevronUp class="w-3.5 h-3.5" /> : <ChevronDown class="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteGame(g.id)}
                      class="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div class="border-t border-slate-700 bg-slate-900/60 p-3 sm:p-4 space-y-3 text-xs">
                    {/* Attendance */}
                    {g.attendance && (
                      <div class="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60 space-y-1.5">
                        <span class="font-bold text-emerald-400">
                          Attendance ({g.attendance.length}/{players.length})
                        </span>
                        <div class="flex flex-wrap gap-1.5">
                          {players.map((p) => {
                            const attended = g.attendance.includes(p.id);
                            return (
                              <span
                                key={p.id}
                                class={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                  attended
                                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                                    : 'bg-slate-900 border-slate-700 text-slate-500 line-through'
                                }`}
                              >
                                {p.name}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(g.innings || []).map((inn, idx) => {
                      // Check for new vs legacy keys
                      const isLegacy = inn.firstBat || inn.pitcher1;

                      return (
                        <div key={idx} class="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 space-y-2">
                          <span class="font-bold text-amber-400 block">Inning {idx + 1}</span>

                          {/* Fielding */}
                          <div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Fielding Positions
                            </span>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-slate-300">
                              {FIELDING_POSITIONS.filter((pos) => inn[pos.key] || (pos.key === 'pitcher' && inn.pitcher1)).map((pos) => {
                                const pid = inn[pos.key] || (pos.key === 'pitcher' ? inn.pitcher1 : '');
                                return (
                                  <div key={pos.key} class="bg-slate-900/80 px-2 py-1 rounded border border-slate-700/40">
                                    <span class="text-slate-400 font-bold">{pos.short}:</span>{' '}
                                    <span class="font-semibold text-white">{getPlayerName(pid)}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Batting */}
                          <div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Batting Order
                            </span>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-slate-300">
                              {isLegacy ? (
                                <>
                                  {inn.firstBat && (
                                    <div class="bg-slate-900/80 px-2 py-1 rounded border border-slate-700/40">
                                      <span class="text-slate-400 font-bold">1st:</span>{' '}
                                      <span class="font-semibold text-white">{getPlayerName(inn.firstBat)}</span>
                                    </div>
                                  )}
                                  {inn.lastBat && (
                                    <div class="bg-slate-900/80 px-2 py-1 rounded border border-slate-700/40">
                                      <span class="text-slate-400 font-bold">Last:</span>{' '}
                                      <span class="font-semibold text-white">{getPlayerName(inn.lastBat)}</span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                getBattingSlots(10).filter((s) => inn[s.key]).map((slot) => (
                                  <div key={slot.key} class="bg-slate-900/80 px-2 py-1 rounded border border-slate-700/40">
                                    <span class="text-slate-400 font-bold">{slot.short}:</span>{' '}
                                    <span class="font-semibold text-white">{getPlayerName(inn[slot.key])}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
