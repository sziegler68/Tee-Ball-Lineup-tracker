/**
 * Master list of all trackable positions, grouped by category.
 * Each position has a unique key, label, icon, category, and whether it's on by default.
 */

export const ALL_POSITIONS = [
  // --- Offense ---
  { key: 'firstBat',  label: '1st to Bat (Leadoff)', icon: '⚾', category: 'offense', defaultOn: true },
  { key: 'bat2',      label: '2nd Batter',           icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'bat3',      label: '3rd Batter',           icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'bat4',      label: '4th Batter',           icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'bat5',      label: '5th Batter',           icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'bat6',      label: '6th Batter',           icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'bat7',      label: '7th Batter',           icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'bat8',      label: '8th Batter',           icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'bat9',      label: '9th Batter',           icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'bat10',     label: '10th Batter',          icon: '⚾', category: 'offense', defaultOn: false },
  { key: 'lastBat',   label: 'Last to Bat (Anchor)', icon: '🏁', category: 'offense', defaultOn: true },

  // --- Defense ---
  { key: 'pitcher1',   label: 'Pitcher 1',   icon: '🎯', category: 'defense', defaultOn: true },
  { key: 'pitcher2',   label: 'Pitcher 2',   icon: '🎯', category: 'defense', defaultOn: true },
  { key: 'catcher',    label: 'Catcher',     icon: '🧤', category: 'defense', defaultOn: false },
  { key: 'firstBase',  label: '1st Base',    icon: '🏃', category: 'defense', defaultOn: true },
  { key: 'secondBase', label: '2nd Base',    icon: '🏃', category: 'defense', defaultOn: false },
  { key: 'thirdBase',  label: '3rd Base',    icon: '🏃', category: 'defense', defaultOn: false },
  { key: 'shortstop',  label: 'Shortstop',   icon: '🏃', category: 'defense', defaultOn: false },
  { key: 'leftField',  label: 'Left Field',  icon: '🌿', category: 'defense', defaultOn: false },
  { key: 'centerField',label: 'Center Field',icon: '🌿', category: 'defense', defaultOn: false },
  { key: 'rightField', label: 'Right Field', icon: '🌿', category: 'defense', defaultOn: false },
];

/** Returns the default enabled position keys */
export function getDefaultEnabledKeys() {
  return ALL_POSITIONS.filter((p) => p.defaultOn).map((p) => p.key);
}

/** Filters ALL_POSITIONS to only include positions whose keys are in enabledKeys */
export function getEnabledPositions(enabledKeys) {
  const keySet = new Set(enabledKeys);
  return ALL_POSITIONS.filter((p) => keySet.has(p.key));
}

/** Returns all position keys that count as "pitcher" for combined stats */
const PITCHER_KEYS = new Set(['pitcher1', 'pitcher2']);

/**
 * Calculates season-wide turn counts for each player across all recorded games.
 */
export function calculatePlayerStats(players, games = [], currentGame = null, enabledKeys = null) {
  const positionsToCount = enabledKeys
    ? ALL_POSITIONS.filter((p) => enabledKeys.includes(p.key))
    : ALL_POSITIONS;

  const stats = {};

  players.forEach((player) => {
    const seasonCounts = { totalKeyRoles: 0, totalPitcher: 0 };
    const currentGameCounts = { totalKeyRoles: 0 };
    positionsToCount.forEach(({ key }) => {
      seasonCounts[key] = 0;
      currentGameCounts[key] = 0;
    });

    stats[player.id] = {
      id: player.id,
      name: player.name,
      active: player.active !== false,
      seasonCounts,
      currentGameCounts,
    };
  });

  const allGames = [...games];
  if (currentGame && currentGame.innings && currentGame.innings.length > 0) {
    allGames.push(currentGame);
  }

  allGames.forEach((game) => {
    const isCurrent = currentGame && game.id === currentGame.id;
    (game.innings || []).forEach((inning) => {
      positionsToCount.forEach(({ key }) => {
        const playerId = inning[key];
        if (playerId && stats[playerId]) {
          stats[playerId].seasonCounts[key] = (stats[playerId].seasonCounts[key] || 0) + 1;
          stats[playerId].seasonCounts.totalKeyRoles += 1;
          if (PITCHER_KEYS.has(key)) {
            stats[playerId].seasonCounts.totalPitcher += 1;
          }
          if (isCurrent) {
            stats[playerId].currentGameCounts[key] = (stats[playerId].currentGameCounts[key] || 0) + 1;
            stats[playerId].currentGameCounts.totalKeyRoles += 1;
          }
        }
      });
    });
  });

  return stats;
}

/**
 * Generate suggestions for each enabled position for a given inning.
 */
export function generateInningSuggestions(players, games = [], currentGame = null, enabledKeys = null) {
  const activePlayers = players.filter((p) => p.active !== false);
  const positionsToUse = enabledKeys
    ? ALL_POSITIONS.filter((p) => enabledKeys.includes(p.key))
    : ALL_POSITIONS.filter((p) => p.defaultOn);

  const stats = calculatePlayerStats(players, games, currentGame, enabledKeys);

  const roleMilestones = {};
  const sortedCandidatesByRole = {};

  positionsToUse.forEach(({ key }) => {
    const havenotDoneInSeason = activePlayers.filter(
      (p) => (stats[p.id]?.seasonCounts[key] || 0) === 0
    );
    const allHaveDoneInSeason = activePlayers.length > 0 && havenotDoneInSeason.length === 0;

    roleMilestones[key] = {
      allHaveDoneInSeason,
      havenotDoneCount: havenotDoneInSeason.length,
    };

    const candidates = [...activePlayers].sort((a, b) => {
      const statA = stats[a.id] || { seasonCounts: { [key]: 0, totalKeyRoles: 0 }, currentGameCounts: { [key]: 0, totalKeyRoles: 0 } };
      const statB = stats[b.id] || { seasonCounts: { [key]: 0, totalKeyRoles: 0 }, currentGameCounts: { [key]: 0, totalKeyRoles: 0 } };

      const seasonPosDiff = (statA.seasonCounts[key] || 0) - (statB.seasonCounts[key] || 0);
      if (seasonPosDiff !== 0) return seasonPosDiff;

      const currentPosDiff = (statA.currentGameCounts[key] || 0) - (statB.currentGameCounts[key] || 0);
      if (currentPosDiff !== 0) return currentPosDiff;

      const currentGameTotalDiff = statA.currentGameCounts.totalKeyRoles - statB.currentGameCounts.totalKeyRoles;
      if (currentGameTotalDiff !== 0) return currentGameTotalDiff;

      const seasonTotalDiff = statA.seasonCounts.totalKeyRoles - statB.seasonCounts.totalKeyRoles;
      if (seasonTotalDiff !== 0) return seasonTotalDiff;

      return a.name.localeCompare(b.name);
    });

    sortedCandidatesByRole[key] = candidates;
  });

  const suggestions = {};
  const assignedPlayerIds = new Set();

  positionsToUse.forEach(({ key }) => {
    const candidates = sortedCandidatesByRole[key];
    const bestUnassigned = candidates.find((p) => !assignedPlayerIds.has(p.id));

    if (bestUnassigned) {
      suggestions[key] = bestUnassigned.id;
      assignedPlayerIds.add(bestUnassigned.id);
    } else if (candidates.length > 0) {
      suggestions[key] = candidates[0].id;
    } else {
      suggestions[key] = '';
    }
  });

  return {
    suggestions,
    roleMilestones,
    stats,
  };
}
