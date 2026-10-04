import { getDefaultEnabledKeys, FIELDING_POSITIONS } from './fairnessEngine';

const STORAGE_KEY = 'teeball_lineup_tracker_v4';

/**
 * Sanitizes game innings by removing ghost batting slots / fielding positions beyond
 * the game's actual attendance count, and removing duplicate batters in the same inning.
 */
export function sanitizeGameInnings(game) {
  if (!game || !game.innings || !Array.isArray(game.innings)) return game;
  const attendanceCount = (game.attendance && Array.isArray(game.attendance))
    ? game.attendance.length
    : null;

  if (!attendanceCount) return game;

  game.innings.forEach((inn) => {
    // 1. Delete orphan batting slots beyond attendance count
    for (let i = attendanceCount + 1; i <= 10; i++) {
      delete inn[`bat${i}`];
    }

    // 2. Clear duplicate batter in same inning
    const seenBatters = new Set();
    for (let i = 1; i <= attendanceCount; i++) {
      const key = `bat${i}`;
      const pid = inn[key];
      if (pid) {
        if (seenBatters.has(pid)) {
          delete inn[key];
        } else {
          seenBatters.add(pid);
        }
      }
    }

    // 3. Delete orphan fielding positions beyond attendance count
    if (FIELDING_POSITIONS && Array.isArray(FIELDING_POSITIONS)) {
      FIELDING_POSITIONS.slice(attendanceCount).forEach((pos) => {
        delete inn[pos.key];
      });
    }
  });

  return game;
}

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
    // Sort players, ensure enabledPositions, and sanitize all games
    for (const teamId of Object.keys(parsed.teams)) {
      const team = parsed.teams[teamId];
      team.players = sortPlayersAlphabetically(team.players || []);
      if (!team.enabledPositions) {
        team.enabledPositions = getDefaultEnabledKeys();
      }
      if (Array.isArray(team.games)) {
        team.games.forEach(sanitizeGameInnings);
      }
      if (team.currentGame) {
        sanitizeGameInnings(team.currentGame);
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
    if (!jsonText || typeof jsonText !== 'string') {
      throw new Error('Please provide backup text.');
    }

    // Strip markdown code fences (e.g. ```json ... ```) if copied from chat
    let cleaned = jsonText.trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Replace smart/curly quotes that mobile devices sometimes insert
    cleaned = cleaned.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");

    const parsed = JSON.parse(cleaned);

    // v4 multi-team format
    if (parsed.teams && parsed.activeTeamId) {
      // Ensure each team has enabledPositions and sanitize games
      for (const teamId of Object.keys(parsed.teams)) {
        if (!parsed.teams[teamId].enabledPositions) {
          parsed.teams[teamId].enabledPositions = getDefaultEnabledKeys();
        }
        if (Array.isArray(parsed.teams[teamId].games)) {
          parsed.teams[teamId].games.forEach(sanitizeGameInnings);
        }
        if (parsed.teams[teamId].currentGame) {
          sanitizeGameInnings(parsed.teams[teamId].currentGame);
        }
      }
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
            enabledPositions: getDefaultEnabledKeys(),
            players: sortPlayersAlphabetically(parsed.players),
            games: Array.isArray(parsed.games) ? parsed.games : [],
            currentGame: parsed.currentGame || null,
          },
        },
      };
    }

    throw new Error('Unrecognized backup format');
  } catch (err) {
    if (err.message === 'Unrecognized backup format') throw err;
    throw new Error('Could not parse backup JSON. Please check the file/text.');
  }
}
