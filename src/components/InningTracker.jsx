import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  PlusCircle,
  Trash2,
  Edit2,
  Check,
  X,
  Users,
  Shield,
  Swords,
  ChevronDown,
  Star,
  RefreshCw,
  Home,
  Plane,
  Grid,
} from 'lucide-react';
import {
  FIELDING_POSITIONS,
  getActiveFieldingPositions,
  getBattingSlots,
  generateFullGame,
  updateIncompleteInnings,
  swapPlayerInInning,
  assignFairInning,
  calculateSeasonStats,
} from '../utils/fairnessEngine';

export default function InningTracker({
  players,
  games,
  currentGame,
  setCurrentGame,
  onFinishGame,
}) {
  const [activeInningNum, setActiveInningNum] = useState(1);
  const [viewMode, setViewMode] = useState('both'); // 'both' | 'batting' | 'fielding'
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Modals
  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [activePicker, setActivePicker] = useState(null); // { inningIdx, type: 'fielding' | 'batting', posKey, label }

  // New Game Setup State
  const [setupGameName, setSetupGameName] = useState('');
  const [setupHomeAway, setSetupHomeAway] = useState('away'); // 'away' (bat 1st) | 'home' (field 1st)
  const [setupAttendance, setSetupAttendance] = useState([]);

  // Setup game name default when opening modal
  const handleOpenNewGameModal = () => {
    setSetupGameName(`Game ${games.length + 1}`);
    setSetupAttendance(players.filter((p) => p.active !== false).map((p) => p.id));
    setShowNewGameModal(true);
  };

  if (!currentGame && !showNewGameModal) {
    return (
      <div class="max-w-md mx-auto p-6 text-center space-y-4 pt-12">
        <div class="w-16 h-16 mx-auto bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/10">
          ⚾
        </div>
        <h2 class="text-xl font-black text-white">No Active Game</h2>
        <p class="text-sm text-slate-400">
          Your last game is safely stored in season history. Tap below whenever you're ready to start today's game!
        </p>
        <button
          onClick={handleOpenNewGameModal}
          class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 active:scale-98 transition text-sm flex items-center justify-center gap-2"
        >
          <PlusCircle class="w-5 h-5" />
          <span>Start New Game</span>
        </button>
      </div>
    );
  }

  // Active game data
  const attendingIds = currentGame?.attendance || players.filter((p) => p.active !== false).map((p) => p.id);
  const attendingPlayers = players.filter((p) => attendingIds.includes(p.id));
  const activeCount = attendingPlayers.length;

  const fieldingPositions = getActiveFieldingPositions(activeCount);
  const battingSlots = getBattingSlots(activeCount);

  const totalInnings = currentGame?.innings?.length || 4;
  const currentInningIndex = Math.min(activeInningNum - 1, totalInnings - 1);
  const currentInningData = currentGame?.innings?.[currentInningIndex] || {
    inning: activeInningNum,
    battingComplete: false,
    fieldingComplete: false,
  };

  const isAway = currentGame?.homeOrAway !== 'home'; // Away bats first, Home fields first

  // Handle New Game creation
  const handleCreateNewGame = () => {
    if (setupAttendance.length === 0) {
      alert('Please select at least 1 attending player.');
      return;
    }

    const newGame = generateFullGame({
      name: setupGameName.trim() || `Game ${games.length + 1}`,
      homeOrAway: setupHomeAway,
      attendingPlayerIds: setupAttendance,
      allPlayers: players,
      pastGames: games,
      numInnings: 4,
    });

    setCurrentGame(newGame);
    setActiveInningNum(1);
    setShowNewGameModal(false);
  };

  // Handle mid-game attendance update (e.g. late arrival)
  const handleUpdateMidGameAttendance = (newIds) => {
    if (newIds.length === 0) {
      alert('At least 1 player must be attending.');
      return;
    }
    const updated = updateIncompleteInnings({
      currentGame,
      newAttendingPlayerIds: newIds,
      allPlayers: players,
      pastGames: games,
    });
    setCurrentGame(updated);
    setShowAttendanceModal(false);
  };

  // Toggle completion checkboxes
  const handleToggleComplete = (type) => {
    const updatedInnings = [...currentGame.innings];
    const key = type === 'batting' ? 'battingComplete' : 'fieldingComplete';
    updatedInnings[currentInningIndex] = {
      ...updatedInnings[currentInningIndex],
      [key]: !updatedInnings[currentInningIndex][key],
    };
    setCurrentGame({ ...currentGame, innings: updatedInnings });
  };

  // Handle Player Selection with Automatic Swap
  const handleSelectPlayerWithSwap = (targetKey, newPlayerId, isBatting) => {
    const positionsList = isBatting ? battingSlots : fieldingPositions;
    const updatedInning = swapPlayerInInning({
      inning: currentInningData,
      targetKey,
      newPlayerId,
      isBatting,
      positionsList,
    });

    const updatedInnings = [...currentGame.innings];
    updatedInnings[currentInningIndex] = updatedInning;
    setCurrentGame({ ...currentGame, innings: updatedInnings });
    setActivePicker(null);
  };

  // Inning navigation & management
  const handleAddInning = () => {
    const nextNum = totalInnings + 1;
    const baseStats = calculateSeasonStats(players, games, currentGame);
    const newFielding = assignFairInning(fieldingPositions, attendingPlayers, baseStats, currentGame.innings, nextNum);
    const newBatting = assignFairInning(battingSlots, attendingPlayers, baseStats, currentGame.innings, nextNum);

    const newInning = {
      inning: nextNum,
      battingComplete: false,
      fieldingComplete: false,
      ...newFielding,
      ...newBatting,
    };

    setCurrentGame({
      ...currentGame,
      innings: [...currentGame.innings, newInning],
    });
    setActiveInningNum(nextNum);
  };

  const handleRemoveLastInning = () => {
    if (totalInnings <= 1) return;
    if (!window.confirm(`Remove Inning ${totalInnings}?`)) return;
    const updatedInnings = currentGame.innings.slice(0, -1);
    setCurrentGame({ ...currentGame, innings: updatedInnings });
    if (activeInningNum > updatedInnings.length) {
      setActiveInningNum(updatedInnings.length);
    }
  };

  const getPlayerName = (id) => {
    const p = players.find((pl) => pl.id === id);
    return p ? p.name : '—';
  };

  // Re-generate suggestions for current active inning (if coach wants a fresh reshuffle)
  const handleReshuffleCurrentInning = () => {
    if (window.confirm(`Re-shuffle suggestions for Inning ${activeInningNum}?`)) {
      const earlierInnings = currentGame.innings.slice(0, currentInningIndex);
      const baseStats = calculateSeasonStats(players, games, { ...currentGame, innings: earlierInnings });
      const newFielding = assignFairInning(fieldingPositions, attendingPlayers, baseStats, earlierInnings, activeInningNum);
      const newBatting = assignFairInning(battingSlots, attendingPlayers, baseStats, earlierInnings, activeInningNum);

      const updated = [...currentGame.innings];
      updated[currentInningIndex] = {
        ...updated[currentInningIndex],
        ...newFielding,
        ...newBatting,
      };
      setCurrentGame({ ...currentGame, innings: updated });
    }
  };

  // Compute fair-play suggestions for picker modal (highlight who hasn't played this role yet)
  const getSuggestedPlayerForPos = (posKey, isBatting) => {
    const earlierInnings = currentGame.innings.slice(0, currentInningIndex);
    const baseStats = calculateSeasonStats(players, games, { ...currentGame, innings: earlierInnings });
    const positionsList = isBatting ? battingSlots : fieldingPositions;
    const suggestionMap = assignFairInning(positionsList, attendingPlayers, baseStats, earlierInnings, activeInningNum);
    return suggestionMap[posKey];
  };

  /* ========================================================================= */
  /* Render Column (Batting or Fielding)                                      */
  /* ========================================================================= */
  const renderColumn = (type, isPhase1 = false) => {
    const isBatting = type === 'batting';
    const isComplete = isBatting
      ? currentInningData.battingComplete
      : currentInningData.fieldingComplete;

    const items = isBatting ? battingSlots : fieldingPositions;
    const title = isBatting ? 'Batting Lineup' : 'Fielding Positions';
    const icon = isBatting ? '⚾' : '🧤';

    return (
      <div
        class={`flex-1 flex flex-col rounded-2xl border transition overflow-hidden ${
          isComplete
            ? 'bg-slate-900/60 border-emerald-500/40'
            : 'bg-slate-800/90 border-slate-700 shadow-md'
        }`}
      >
        {/* Column Header */}
        <div
          class={`px-3 py-2.5 flex items-center justify-between border-b ${
            isComplete
              ? 'bg-emerald-950/40 border-emerald-500/30'
              : 'bg-slate-900/80 border-slate-700/80'
          }`}
        >
          <div class="flex items-center gap-1.5 min-w-0">
            <span class="text-base">{icon}</span>
            <div class="min-w-0">
              <span class="text-xs font-bold text-white block truncate">{title}</span>
              <span class="text-[10px] text-slate-400 font-semibold block">
                {isPhase1 ? '1st Half' : '2nd Half'} • {items.length} spots
              </span>
            </div>
          </div>

          {/* Complete Checkbox */}
          <button
            onClick={() => handleToggleComplete(type)}
            class={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition border ${
              isComplete
                ? 'bg-emerald-500 border-emerald-400 text-white shadow'
                : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-emerald-500'
            }`}
          >
            <Check class={`w-3.5 h-3.5 ${isComplete ? 'text-white' : 'text-slate-400'}`} />
            <span class="text-[11px]">{isComplete ? 'Done' : 'Complete'}</span>
          </button>
        </div>

        {/* Compact List of Items */}
        <div class="divide-y divide-slate-700/50 p-1 flex-1">
          {items.map((item) => {
            const assignedPlayerId = currentInningData[item.key];
            const playerName = getPlayerName(assignedPlayerId);

            return (
              <button
                key={item.key}
                onClick={() =>
                  setActivePicker({
                    inningIdx: currentInningIndex,
                    type,
                    posKey: item.key,
                    label: item.label,
                    short: item.short,
                    currentId: assignedPlayerId,
                  })
                }
                class="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-slate-700/40 active:bg-slate-700/70 rounded-lg transition group"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <span class="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 flex-shrink-0 w-8 text-center">
                    {item.short}
                  </span>
                  <span class="text-xs font-bold text-white truncate group-hover:text-emerald-300">
                    {playerName}
                  </span>
                </div>
                <ChevronDown class="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 flex-shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div class="max-w-2xl mx-auto p-3 sm:p-4 space-y-3">
      {/* Game Header Bar */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-3 shadow-lg space-y-2">
        <div class="flex items-center justify-between gap-2">
          {/* Game Title & Edit */}
          <div class="min-w-0">
            {isEditingName ? (
              <div class="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  class="bg-slate-900 border border-emerald-500 rounded-lg px-2 py-1 text-sm text-white font-bold focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && tempName.trim()) {
                      setCurrentGame({ ...currentGame, name: tempName.trim() });
                      setIsEditingName(false);
                    }
                  }}
                />
                <button
                  onClick={() => {
                    if (tempName.trim()) {
                      setCurrentGame({ ...currentGame, name: tempName.trim() });
                    }
                    setIsEditingName(false);
                  }}
                  class="p-1 bg-emerald-600 rounded-md text-white"
                >
                  <Check class="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div class="flex items-center gap-1.5">
                <h2 class="text-base font-black text-white truncate">{currentGame?.name}</h2>
                <button
                  onClick={() => {
                    setTempName(currentGame.name);
                    setIsEditingName(true);
                  }}
                  class="text-slate-400 hover:text-white p-0.5 rounded transition"
                  title="Rename Game"
                >
                  <Edit2 class="w-3 h-3" />
                </button>
              </div>
            )}
            <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
              <button
                type="button"
                onClick={() => {
                  const newDesignation = currentGame.homeOrAway === 'home' ? 'away' : 'home';
                  setCurrentGame({ ...currentGame, homeOrAway: newDesignation });
                }}
                class="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border transition bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-200"
                title="Tap to toggle Home / Away"
              >
                {isAway ? (
                  <>
                    <Plane class="w-3 h-3 text-sky-400" />
                    <span>Away (Bat 1st)</span>
                  </>
                ) : (
                  <>
                    <Home class="w-3 h-3 text-amber-400" />
                    <span>Home (Field 1st)</span>
                  </>
                )}
                <span class="text-[9px] text-slate-400 font-normal">↺ Switch</span>
              </button>
              <span>•</span>
              <span>{currentGame?.date}</span>
            </div>
          </div>

          {/* Quick Attendance & New Game Buttons */}
          <div class="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setShowAttendanceModal(true)}
              class="px-2.5 py-1.5 bg-emerald-950/60 border border-emerald-500/40 hover:bg-emerald-900/60 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1.5 transition"
              title="View / Update Game Attendance (Late arrivals)"
            >
              <Users class="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeCount} Kids</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Start a fresh game? Current uncompleted progress will be cleared.')) {
                  setSetupGameName(`Game ${games.length + 1}`);
                  setSetupAttendance(players.filter((p) => p.active !== false).map((p) => p.id));
                  setShowNewGameModal(true);
                }
              }}
              class="p-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
              title="Start New Game"
            >
              <PlusCircle class="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Inning Navigator Bar */}
        <div class="flex items-center justify-between gap-1 pt-1 border-t border-slate-700/60">
          <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {currentGame?.innings?.map((inn, idx) => {
              const num = idx + 1;
              const isActive = activeInningNum === num;
              const bothDone = inn.battingComplete && inn.fieldingComplete;
              const halfDone = inn.battingComplete || inn.fieldingComplete;

              return (
                <button
                  key={num}
                  onClick={() => setActiveInningNum(num)}
                  class={`py-1 px-2.5 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                    isActive
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                      : bothDone
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : halfDone
                      ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span>Inn {num}</span>
                  {bothDone ? (
                    <CheckCircle class="w-3 h-3 text-emerald-400" />
                  ) : halfDone ? (
                    <span class="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  ) : null}
                </button>
              );
            })}

            {/* Add / Remove Inning */}
            <button
              onClick={handleAddInning}
              class="p-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold"
              title="Add Inning"
            >
              <PlusCircle class="w-3.5 h-3.5" />
            </button>
            {totalInnings > 1 && (
              <button
                onClick={handleRemoveLastInning}
                class="p-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-xs font-bold"
                title="Remove Last Inning"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Re-shuffle current inning button */}
          <button
            onClick={handleReshuffleCurrentInning}
            class="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium px-1.5 py-1 rounded hover:bg-slate-700/50"
            title="Re-shuffle fair-play suggestions for this inning"
          >
            <RefreshCw class="w-3 h-3" />
            <span class="hidden sm:inline">Re-shuffle</span>
          </button>
        </div>
      </div>

      {/* Hybrid View Mode Selector Toggle */}
      <div class="flex items-center justify-between bg-slate-800/80 border border-slate-700/80 p-1 rounded-xl">
        <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
          View:
        </span>
        <div class="flex items-center gap-1">
          <button
            onClick={() => setViewMode('both')}
            class={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              viewMode === 'both'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid class="w-3.5 h-3.5" />
            <span>Both (Side-by-Side)</span>
          </button>

          <button
            onClick={() => setViewMode('batting')}
            class={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              viewMode === 'batting'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>⚾ Batting</span>
          </button>

          <button
            onClick={() => setViewMode('fielding')}
            class={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
              viewMode === 'fielding'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🧤 Fielding</span>
          </button>
        </div>
      </div>

      {/* MAIN GAME BOARD (Zero-Scroll Side-by-Side or Focus) */}
      <div class="flex flex-col sm:flex-row gap-2.5 items-stretch">
        {/* If Away: Batting 1st, Fielding 2nd. If Home: Fielding 1st, Batting 2nd */}
        {viewMode === 'both' && (
          <>
            {isAway ? (
              <>
                {renderColumn('batting', true)}
                {renderColumn('fielding', false)}
              </>
            ) : (
              <>
                {renderColumn('fielding', true)}
                {renderColumn('batting', false)}
              </>
            )}
          </>
        )}

        {viewMode === 'batting' && renderColumn('batting', isAway)}
        {viewMode === 'fielding' && renderColumn('fielding', !isAway)}
      </div>

      {/* Finish or Discard Game Actions */}
      <div class="pt-2 space-y-2">
        <button
          onClick={onFinishGame}
          class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm shadow-md"
        >
          <CheckCircle class="w-4 h-4" />
          <span>Save & Complete Game to Season History</span>
        </button>

        <button
          onClick={() => {
            if (window.confirm('Discard this live game without saving? (Your recorded season history will not be affected).')) {
              setCurrentGame(null);
            }
          }}
          class="w-full py-2 text-xs font-semibold text-slate-500 hover:text-red-400 transition text-center"
        >
          Discard / Cancel Current Game
        </button>
      </div>

      {/* ===================================================================== */}
      {/* POPUP: Dropdown / Picker for Swapping Players on the Fly              */}
      {/* ===================================================================== */}
      {activePicker && (
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl relative">
            <div class="flex items-center justify-between border-b border-slate-700 pb-2">
              <div>
                <span class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                  Select Player ({activePicker.short})
                </span>
                <h3 class="text-sm font-bold text-white">{activePicker.label}</h3>
              </div>
              <button
                onClick={() => setActivePicker(null)}
                class="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <p class="text-[11px] text-slate-400">
              Pick a player below. If the selected player is already on another position,{' '}
              <strong class="text-emerald-300">they will automatically swap</strong>!
            </p>

            {/* List of Attending Players */}
            <div class="max-h-64 overflow-y-auto space-y-1 pr-1">
              {attendingPlayers.map((p) => {
                const isBatting = activePicker.type === 'batting';
                const suggestedId = getSuggestedPlayerForPos(activePicker.posKey, isBatting);
                const isSuggested = p.id === suggestedId;
                const isCurrent = p.id === activePicker.currentId;

                // Check if this player is currently assigned elsewhere in this inning
                const currentPositionsList = isBatting ? battingSlots : fieldingPositions;
                const occupyingPos = currentPositionsList.find(
                  (pos) => pos.key !== activePicker.posKey && currentInningData[pos.key] === p.id
                );

                return (
                  <button
                    key={p.id}
                    onClick={() =>
                      handleSelectPlayerWithSwap(activePicker.posKey, p.id, isBatting)
                    }
                    class={`w-full p-2 rounded-xl text-left flex items-center justify-between transition border ${
                      isCurrent
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-600 text-slate-200'
                    }`}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold">{p.name}</span>
                      {isSuggested && (
                        <span class="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <Star class="w-3 h-3 fill-amber-400" /> Suggested
                        </span>
                      )}
                    </div>

                    {occupyingPos && (
                      <span class="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        Swaps from {occupyingPos.short}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Start New Game Setup                                           */}
      {/* ===================================================================== */}
      {showNewGameModal && (
        <div class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-700 pb-3">
              <div class="flex items-center gap-2">
                <span class="text-2xl">⚾</span>
                <div>
                  <h3 class="text-base font-black text-white">Start New Game</h3>
                  <span class="text-xs text-slate-400">Game-day lineup setup</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewGameModal(false)}
                class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                title="Cancel / Close"
              >
                <X class="w-5 h-5" />
              </button>
            </div>

            {/* Game Name */}
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Game Name</label>
              <input
                type="text"
                value={setupGameName}
                onChange={(e) => setSetupGameName(e.target.value)}
                placeholder="e.g. Game 3 vs Tigers"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
              />
            </div>

            {/* Home or Away Selection */}
            <div>
              <label class="block text-xs font-bold text-slate-300 mb-1">Team Designation</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSetupHomeAway('away')}
                  class={`p-3 rounded-xl border text-left transition ${
                    setupHomeAway === 'away'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <div class="flex items-center gap-1.5 font-bold text-sm">
                    <Plane class="w-4 h-4 text-sky-400" />
                    <span>Away Team</span>
                  </div>
                  <span class="text-[11px] text-slate-400 block mt-0.5">Bat 1st, Field 2nd</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSetupHomeAway('home')}
                  class={`p-3 rounded-xl border text-left transition ${
                    setupHomeAway === 'home'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-850'
                  }`}
                >
                  <div class="flex items-center gap-1.5 font-bold text-sm">
                    <Home class="w-4 h-4 text-amber-400" />
                    <span>Home Team</span>
                  </div>
                  <span class="text-[11px] text-slate-400 block mt-0.5">Field 1st, Bat 2nd</span>
                </button>
              </div>
            </div>

            {/* Attendance Toggle Checklist */}
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold text-slate-300">
                  Who is playing today? ({setupAttendance.length}/{players.length})
                </label>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSetupAttendance(players.map((p) => p.id))}
                    class="text-[10px] font-bold text-emerald-400 hover:underline"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSetupAttendance([])}
                    class="text-[10px] font-bold text-slate-400 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {players.map((p) => {
                  const isPresent = setupAttendance.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSetupAttendance((prev) =>
                          prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]
                        );
                      }}
                      class={`p-2 rounded-xl text-xs font-bold flex items-center justify-between border transition ${
                        isPresent
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <span class="truncate">{p.name}</span>
                      <span class="text-xs">{isPresent ? '✓' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions: Cancel & Generate */}
            <div class="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowNewGameModal(false)}
                class="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-xl transition text-sm text-center"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewGame}
                disabled={setupAttendance.length === 0}
                class="flex-[2] py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition text-sm"
              >
                <Sparkles class="w-4 h-4 text-amber-300" />
                <span>Generate Lineup</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: Mid-Game Attendance (Late arrivals / early departures)         */}
      {/* ===================================================================== */}
      {showAttendanceModal && (
        <div class="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-slate-800 border border-slate-700 rounded-2xl max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-700 pb-2">
              <div>
                <h3 class="text-sm font-bold text-white">Game Attendance</h3>
                <span class="text-[11px] text-slate-400">
                  Late arrivals will be added to incomplete innings!
                </span>
              </div>
              <button
                onClick={() => setShowAttendanceModal(false)}
                class="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {players.map((p) => {
                const isPresent = attendingIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      const newIds = isPresent
                        ? attendingIds.filter((id) => id !== p.id)
                        : [...attendingIds, p.id];
                      handleUpdateMidGameAttendance(newIds);
                    }}
                    class={`w-full p-2.5 rounded-xl text-left flex items-center justify-between border transition ${
                      isPresent
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span class="text-xs font-semibold">
                      {isPresent ? 'Present (In Game)' : 'Absent (Tap to add)'}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowAttendanceModal(false)}
              class="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
