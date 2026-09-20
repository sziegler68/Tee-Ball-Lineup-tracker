const STORAGE_KEY = 'teeball_lineup_tracker_v2';

export const DEFAULT_INITIAL_STATE = {
  teamName: 'My Tee-Ball Team',
  players: [
    { id: 'p1', name: 'Aiden', active: true },
    { id: 'p2', name: 'Ajax', active: true },
    { id: 'p3', name: 'Byron', active: true },
    { id: 'p4', name: 'Camden', active: true },
    { id: 'p5', name: 'Damien', active: true },
    { id: 'p6', name: 'Hudson', active: true },
    { id: 'p7', name: 'Nathan', active: true },
    { id: 'p8', name: 'SJ', active: true },
    { id: 'p9', name: 'Ziggy', active: true },
  ],
  games: [],
  currentGame: null,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Migrate from v1 if present, otherwise use default
      const v1 = localStorage.getItem('teeball_lineup_tracker_v1');
      if (v1) {
        try {
          const parsed = JSON.parse(v1);
          if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
            return {
              teamName: parsed.teamName || 'My Tee-Ball Team',
              players: sortPlayersAlphabetically(parsed.players),
              games: parsed.games || [],
              currentGame: parsed.currentGame || null,
            };
          }
        } catch (e) {}
      }
      return DEFAULT_INITIAL_STATE;
    }
    const parsed = JSON.parse(raw);
    return {
      teamName: parsed.teamName || 'My Tee-Ball Team',
      players: sortPlayersAlphabetically(parsed.players || DEFAULT_INITIAL_STATE.players),
      games: parsed.games || [],
      currentGame: parsed.currentGame || null,
    };
  } catch (err) {
    console.error('Failed to load local state:', err);
    return DEFAULT_INITIAL_STATE;
  }
}

export function sortPlayersAlphabetically(playersList) {
  return [...playersList].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function saveState(state) {
  try {
    const sortedState = {
      ...state,
      players: sortPlayersAlphabetically(state.players || []),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedState));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function exportBackup(state) {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `teeball-season-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseBackupText(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);
    if (!parsed || !Array.isArray(parsed.players)) {
      throw new Error('Invalid backup format: missing players array');
    }
    return {
      teamName: parsed.teamName || 'My Tee-Ball Team',
      players: sortPlayersAlphabetically(parsed.players),
      games: Array.isArray(parsed.games) ? parsed.games : [],
      currentGame: parsed.currentGame || null,
    };
  } catch (err) {
    throw new Error('Could not parse backup JSON. Please check the file/text.');
  }
}
