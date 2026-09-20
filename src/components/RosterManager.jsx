import React, { useState } from 'react';
import { UserPlus, Trash2, Edit2, Check, X, UserCheck, UserX, Shield, Trophy } from 'lucide-react';
import { sortPlayersAlphabetically } from '../utils/storage';

export default function RosterManager({ players, setPlayers, teamName, setTeamName }) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);
  const [tempTeamName, setTempTeamName] = useState(teamName);

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newPlayer = {
      id: 'p_' + Date.now(),
      name: newName.trim(),
      active: true,
    };
    const updated = sortPlayersAlphabetically([...players, newPlayer]);
    setPlayers(updated);
    setNewName('');
  };

  const handleToggleActive = (id) => {
    const updated = players.map((p) => (p.id === id ? { ...p, active: !p.active } : p));
    setPlayers(sortPlayersAlphabetically(updated));
  };

  const handleDeletePlayer = (id) => {
    if (window.confirm('Remove this player from roster?')) {
      const updated = players.filter((p) => p.id !== id);
      setPlayers(sortPlayersAlphabetically(updated));
    }
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setEditingName(player.name);
  };

  const saveEdit = (id) => {
    if (!editingName.trim()) return;
    const updated = players.map((p) => (p.id === id ? { ...p, name: editingName.trim() } : p));
    setPlayers(sortPlayersAlphabetically(updated));
    setEditingId(null);
  };

  const saveTeamName = () => {
    if (tempTeamName.trim()) {
      setTeamName(tempTeamName.trim());
    }
    setIsEditingTeamName(false);
  };

  const activeCount = players.filter((p) => p.active !== false).length;
  const sortedPlayers = sortPlayersAlphabetically(players);

  return (
    <div class="max-w-2xl mx-auto p-4 space-y-6">
      {/* Team Name Card */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Trophy class="w-4 h-4" />
            </div>
            <div>
              <span class="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Team Profile</span>
              {isEditingTeamName ? (
                <div class="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={tempTeamName}
                    onChange={(e) => setTempTeamName(e.target.value)}
                    class="bg-slate-900 border border-emerald-500 rounded-lg px-3 py-1 text-sm text-white font-bold focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={saveTeamName}
                    class="p-1.5 bg-emerald-600 rounded-lg text-white"
                  >
                    <Check class="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <h2 class="text-lg font-black text-white flex items-center gap-2">
                  {teamName}
                  <button
                    onClick={() => {
                      setTempTeamName(teamName);
                      setIsEditingTeamName(true);
                    }}
                    class="text-slate-400 hover:text-white p-1 rounded-md transition"
                    title="Edit Team Name"
                  >
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                </h2>
              )}
            </div>
          </div>

          <div class="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-right">
            <span class="text-xl font-black text-emerald-400">{activeCount}</span>
            <span class="text-slate-400 text-xs font-semibold"> / {players.length} Active</span>
          </div>
        </div>
      </div>

      {/* Add Player Input */}
      <form onSubmit={handleAddPlayer} class="flex gap-2">
        <input
          type="text"
          placeholder="Enter new player name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
        />
        <button
          type="submit"
          class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition text-sm"
        >
          <UserPlus class="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Player List (Auto Alphabetized) */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700/60 overflow-hidden shadow-lg">
        <div class="p-3 bg-slate-900/60 border-b border-slate-700 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
          <span>Alphabetized Roster ({sortedPlayers.length})</span>
          <span class="text-[10px] text-emerald-400 lowercase font-normal">Sorted A to Z</span>
        </div>

        {sortedPlayers.length === 0 ? (
          <div class="p-8 text-center text-slate-400 text-sm">
            No players added yet. Add your players above!
          </div>
        ) : (
          sortedPlayers.map((player) => {
            const isActive = player.active !== false;
            const isEditing = editingId === player.id;

            return (
              <div
                key={player.id}
                class={`p-3.5 flex items-center justify-between transition ${
                  isActive ? 'bg-slate-800/80' : 'bg-slate-900/60 opacity-60'
                }`}
              >
                {isEditing ? (
                  <div class="flex items-center gap-2 flex-1 mr-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      class="bg-slate-900 border border-emerald-500 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none w-full"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(player.id)}
                      class="p-1.5 bg-emerald-600 rounded-lg text-white"
                    >
                      <Check class="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      class="p-1.5 bg-slate-700 rounded-lg text-slate-300"
                    >
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div class="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleActive(player.id)}
                      class={`p-2 rounded-xl border transition ${
                        isActive
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-700/50 border-slate-700 text-slate-500'
                      }`}
                      title={isActive ? 'Mark Absent' : 'Mark Active'}
                    >
                      {isActive ? <UserCheck class="w-4 h-4" /> : <UserX class="w-4 h-4" />}
                    </button>
                    <div>
                      <span class={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-400 line-through'}`}>
                        {player.name}
                      </span>
                      <span class="block text-[11px] text-slate-400 font-semibold">
                        {isActive ? 'Present for game' : 'Absent today'}
                      </span>
                    </div>
                  </div>
                )}

                {!isEditing && (
                  <div class="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(player)}
                      class="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                    >
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id)}
                      class="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
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
