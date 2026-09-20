import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, RotateCcw, Award, AlertCircle } from 'lucide-react';
import { POSITIONS, generateInningSuggestions } from '../utils/fairnessEngine';

export default function InningTracker({ players, games, currentGame, setCurrentGame, onFinishGame }) {
  const [activeInningNum, setActiveInningNum] = useState(1);
  const activePlayers = players.filter((p) => p.active !== false);

  // Initialize active game if null
  useEffect(() => {
    if (!currentGame) {
      const newGame = {
        id: 'live_' + Date.now(),
        name: `Game ${games.length + 1}`,
        date: new Date().toISOString().slice(0, 10),
        innings: [
          { inning: 1, firstBat: '', lastBat: '', firstBase: '', pitcher1: '', pitcher2: '' },
          { inning: 2, firstBat: '', lastBat: '', firstBase: '', pitcher1: '', pitcher2: '' },
          { inning: 3, firstBat: '', lastBat: '', firstBase: '', pitcher1: '', pitcher2: '' },
          { inning: 4, firstBat: '', lastBat: '', firstBase: '', pitcher1: '', pitcher2: '' },
        ],
      };
      setCurrentGame(newGame);
    }
  }, [currentGame, games.length, setCurrentGame]);

  if (!currentGame) return null;

  const currentInningIndex = activeInningNum - 1;
  const currentInningData = currentGame.innings[currentInningIndex] || {
    inning: activeInningNum,
    firstBat: '',
    lastBat: '',
    firstBase: '',
    pitcher1: '',
    pitcher2: '',
  };

  // Generate recommendations
  const { suggestions, roleMilestones } = generateInningSuggestions(
    players,
    games,
    currentGame
  );

  const handlePositionSelect = (posKey, playerId) => {
    const updatedInnings = [...currentGame.innings];
    updatedInnings[currentInningIndex] = {
      ...updatedInnings[currentInningIndex],
      [posKey]: playerId,
    };
    setCurrentGame({ ...currentGame, innings: updatedInnings });
  };

  const handleApplyAllSuggestions = () => {
    const updatedInnings = [...currentGame.innings];
    updatedInnings[currentInningIndex] = {
      ...updatedInnings[currentInningIndex],
      ...suggestions,
    };
    setCurrentGame({ ...currentGame, innings: updatedInnings });
  };

  const handleClearInning = () => {
    const updatedInnings = [...currentGame.innings];
    updatedInnings[currentInningIndex] = {
      inning: activeInningNum,
      firstBat: '',
      lastBat: '',
      firstBase: '',
      pitcher1: '',
      pitcher2: '',
    };
    setCurrentGame({ ...currentGame, innings: updatedInnings });
  };

  const getPlayerName = (id) => {
    const p = players.find((pl) => pl.id === id);
    return p ? p.name : '';
  };

  return (
    <div class="max-w-2xl mx-auto p-4 space-y-5">
      {/* Game Title & Inning Tabs */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-3 shadow-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-black text-white flex items-center gap-2">
              {currentGame.name}
            </h2>
            <span class="text-xs text-slate-400">{currentGame.date} • 4 Innings</span>
          </div>
          <div class="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
            {activePlayers.length} Players Present
          </div>
        </div>

        {/* 4 Inning Selector */}
        <div class="grid grid-cols-4 gap-2 pt-1">
          {[1, 2, 3, 4].map((num) => {
            const isActive = activeInningNum === num;
            const innData = currentGame.innings[num - 1];
            const isFilled = innData && innData.firstBat && innData.lastBat && innData.firstBase && innData.pitcher1 && innData.pitcher2;

            return (
              <button
                key={num}
                onClick={() => setActiveInningNum(num)}
                class={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 border ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/30'
                    : isFilled
                    ? 'bg-slate-700/80 border-slate-600 text-emerald-300'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>Inning {num}</span>
                {isFilled && <CheckCircle class="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div class="flex gap-2">
        <button
          onClick={handleApplyAllSuggestions}
          class="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-98 transition text-xs sm:text-sm"
        >
          <Sparkles class="w-4 h-4 text-amber-300" />
          <span>Apply Fair-Play Suggestions</span>
        </button>
        <button
          onClick={handleClearInning}
          class="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-3 rounded-xl border border-slate-700 text-xs transition"
          title="Clear this inning"
        >
          <RotateCcw class="w-4 h-4" />
        </button>
      </div>

      {/* Position Cards */}
      <div class="space-y-3">
        {POSITIONS.map(({ key, label, icon }) => {
          const selectedPlayerId = currentInningData[key] || '';
          const suggestedPlayerId = suggestions[key] || '';
          const milestone = roleMilestones[key] || {};

          return (
            <div
              key={key}
              class="bg-slate-800 border border-slate-700 rounded-2xl p-4 space-y-2.5 shadow-md"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xl">{icon}</span>
                  <h3 class="font-bold text-white text-sm">{label}</h3>
                </div>

                {/* Milestone Badge */}
                {milestone.allHaveDoneInSeason ? (
                  <span class="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Award class="w-3 h-3 text-amber-400" />
                    <span>All played in history!</span>
                  </span>
                ) : (
                  <span class="text-[11px] text-slate-400 font-medium">
                    {milestone.havenotDoneCount} player(s) waiting for 1st turn
                  </span>
                )}
              </div>

              {/* Selector & Suggested chip */}
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select
                  value={selectedPlayerId}
                  onChange={(e) => handlePositionSelect(key, e.target.value)}
                  class={`flex-1 bg-slate-900 border text-sm font-semibold rounded-xl p-3 focus:outline-none transition ${
                    selectedPlayerId
                      ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
                      : 'border-slate-700 text-slate-400'
                  }`}
                >
                  <option value="">-- Choose Player --</option>
                  {activePlayers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.id === suggestedPlayerId ? '⭐ (Suggested)' : ''}
                    </option>
                  ))}
                </select>

                {suggestedPlayerId && (
                  <button
                    onClick={() => handlePositionSelect(key, suggestedPlayerId)}
                    class="bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 px-3 py-2.5 rounded-xl text-left flex items-center gap-2 transition"
                  >
                    <Sparkles class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <div class="text-xs">
                      <span class="text-slate-400 block text-[10px]">App Suggestion</span>
                      <span class="font-bold text-emerald-300">{getPlayerName(suggestedPlayerId)}</span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Complete Game Action */}
      <div class="pt-4 border-t border-slate-800">
        <button
          onClick={onFinishGame}
          class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm shadow-md"
        >
          <CheckCircle class="w-4 h-4" />
          <span>Save & Complete Game</span>
        </button>
      </div>
    </div>
  );
}
