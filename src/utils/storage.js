const STORAGE_KEY = 'teeball_lineup_tracker_v1';

export const DEFAULT_INITIAL_STATE = {
  players: [
    { id: 'p1', name: 'Alex', active: true },
    { id: 'p2', name: 'Ben', active: true },
    { id: 'p3', name: 'Charlie', active: true },
    { id: 'p4', name: 'Daisy', active: true },
    { id: 'p5', name: 'Ethan', active: true },
    { id: 'p6', name: 'Fiona', active: true },
    { id: 'p7', name: 'George', active: true },
    { id: 'p8', name: 'Hannah', active: true },
  ],
  games: [],
  currentGame: null,
};

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INITIAL_STATE;
    const parsed = JSON.parse(raw);
    return {
      players: parsed.players || DEFAULT_INITIAL_STATE.players,
      games: parsed.games || [],
      currentGame: parsed.currentGame || null,
    };
  } catch (err) {
    console.error('Failed to load local state:', err);
    return DEFAULT_INITIAL_STATE;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      players: parsed.players,
      games: Array.isArray(parsed.games) ? parsed.games : [],
      currentGame: parsed.currentGame || null,
    };
  } catch (err) {
    throw new Error('Could not parse backup JSON. Please check the file/text.');
  }
}
