import { getDefaultEnabledKeys } from './fairnessEngine';

const STORAGE_KEY = 'teeball_lineup_tracker_v4';

const DEFAULT_TEAM = {
  teamName: 'My Tee-Ball Team',
  enabledPositions: getDefaultEnabledKeys(),
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

export function createDefaultAppState() {
  const defaultTeamId = 'team_' + Date.now();
  return {
    activeTeamId: defaultTeamId,
    teams: {
      [defaultTeamId]: { ...DEFAULT_TEAM },
    },
  };
}

export function createNewTeam(name) {
  return {
    teamName: name || 'New Team',
    enabledPositions: getDefaultEnabledKeys(),
    players: [],
    games: [],
    currentGame: null,
  };
}

export function sortPlayersAlphabetically(playersList) {
  return [...playersList].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Try migrating from v3 single-team format
      const v3 = localStorage.getItem('teeball_lineup_tracker_v3');
      if (v3) {
        try {
          const parsed = JSON.parse(v3);
          if (parsed && Array.isArray(parsed.players)) {
            const teamId = 'team_migrated';
            return {
              activeTeamId: teamId,
              teams: {
                [teamId]: {
                  teamName: parsed.teamName || 'My Tee-Ball Team',
                  enabledPositions: getDefaultEnabledKeys(),
                  players: sortPlayersAlphabetically(parsed.players),
                  games: parsed.games || [],
                  currentGame: parsed.currentGame || null,
                },
              },
            };
          }
        } catch (e) {}
      }
      return createDefaultAppState();
    }
    const parsed = JSON.parse(raw);
    // Validate structure
    if (!parsed.teams || !parsed.activeTeamId) {
      return createDefaultAppState();
    }
    // Sort players and ensure enabledPositions exists in each team
    for (const teamId of Object.keys(parsed.teams)) {
      const team = parsed.teams[teamId];
      team.players = sortPlayersAlphabetically(team.players || []);
      if (!team.enabledPositions) {
        team.enabledPositions = getDefaultEnabledKeys();
      }
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load local state:', err);
    return createDefaultAppState();
  }
}

export function saveState(state) {
  try {
    // Deep copy and sort players in each team before saving
    const toSave = {
      activeTeamId: state.activeTeamId,
      teams: {},
    };
    for (const [teamId, team] of Object.entries(state.teams)) {
      toSave.teams[teamId] = {
        ...team,
        players: sortPlayersAlphabetically(team.players || []),
      };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

/** Returns the active team data object, or a default if missing */
export function getActiveTeam(state) {
  const team = state.teams[state.activeTeamId];
  if (!team) {
    // Fallback: pick first team
    const firstId = Object.keys(state.teams)[0];
    return firstId ? state.teams[firstId] : DEFAULT_TEAM;
  }
  return team;
}

/** Returns a list of { id, teamName } for the team switcher */
export function getTeamList(state) {
  return Object.entries(state.teams).map(([id, team]) => ({
    id,
    teamName: team.teamName,
  }));
}

export function exportBackup(state) {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `teeball-all-teams-backup-${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function parseBackupText(jsonText) {
  try {
    const parsed = JSON.parse(jsonText);

    // v4 multi-team format
    if (parsed.teams && parsed.activeTeamId) {
      return parsed;
    }

    // v3 single-team format (backward compat)
    if (parsed.players && Array.isArray(parsed.players)) {
      const teamId = 'team_imported';
      return {
        activeTeamId: teamId,
        teams: {
          [teamId]: {
            teamName: parsed.teamName || 'Imported Team',
            players: sortPlayersAlphabetically(parsed.players),
            games: Array.isArray(parsed.games) ? parsed.games : [],
            currentGame: parsed.currentGame || null,
          },
        },
      };
    }

    throw new Error('Unrecognized backup format');
  } catch (err) {
    throw new Error('Could not parse backup JSON. Please check the file/text.');
  }
}
