import React, { useState } from 'react';
import { UserPlus, Trash2, Edit2, Check, X, UserCheck, UserX } from 'lucide-react';

export default function RosterManager({ players, setPlayers }) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const handleAddPlayer = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newPlayer = {
      id: 'p_' + Date.now(),
      name: newName.trim(),
      active: true,
    };
    setPlayers([...players, newPlayer]);
    setNewName('');
  };

  const handleToggleActive = (id) => {
    setPlayers(
      players.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handleDeletePlayer = (id) => {
    if (window.confirm('Remove this player from roster?')) {
      setPlayers(players.filter((p) => p.id !== id));
    }
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setEditingName(player.name);
  };

  const saveEdit = (id) => {
    if (!editingName.trim()) return;
    setPlayers(players.map((p) => (p.id === id ? { ...p, name: editingName.trim() } : p)));
    setEditingId(null);
  };

  const activeCount = players.filter((p) => p.active !== false).length;

  return (
    <div class="max-w-2xl mx-auto p-4 space-y-6">
      {/* Header & Stats Card */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            Team Roster
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Mark players active/absent for today's game.
          </p>
        </div>
        <div class="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-right">
          <span class="text-xl font-black text-emerald-400">{activeCount}</span>
          <span class="text-slate-400 text-xs font-semibold"> / {players.length} Active</span>
        </div>
      </div>

      {/* Add Player Input */}
      <form onSubmit={handleAddPlayer} class="flex gap-2">
        <input
          type="text"
          placeholder="Enter player name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          class="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
        />
        <button
          type="submit"
          class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95 transition"
        >
          <UserPlus class="w-4 h-4" />
          <span>Add</span>
        </button>
      </form>

      {/* Player List */}
      <div class="bg-slate-800 border border-slate-700 rounded-2xl divide-y divide-slate-700/60 overflow-hidden shadow-lg">
        {players.length === 0 ? (
          <div class="p-8 text-center text-slate-400 text-sm">
            No players added yet. Add your players above!
          </div>
        ) : (
          players.map((player) => {
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
                      <span class={`font-medium text-sm ${isActive ? 'text-white' : 'text-slate-400 line-through'}`}>
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
