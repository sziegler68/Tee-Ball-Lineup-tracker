/**
 * Key positions tracked:
 * - firstBat: 1st to bat (Leadoff)
 * - lastBat: Last to bat (Anchor)
 * - firstBase: 1st Base
 * - pitcher1: Pitcher 1
 * - pitcher2: Pitcher 2
 */

export const POSITIONS = [
  { key: 'firstBat', label: '1st to Bat', icon: '⚾' },
  { key: 'lastBat', label: 'Last to Bat', icon: '🏁' },
  { key: 'firstBase', label: '1st Base', icon: '🏃' },
  { key: 'pitcher1', label: 'Pitcher 1', icon: '🎯' },
  { key: 'pitcher2', label: 'Pitcher 2', icon: '🎯' },
];

/**
 * Calculates season-wide turn counts for each player across all recorded games.
 * @param {Array} players - Array of player objects { id, name }
 * @param {Array} games - Array of game objects { id, name, date, innings: [...] }
 * @param {Object} currentGame - Optional current active game object
 */
export function calculatePlayerStats(players, games = [], currentGame = null) {
  const stats = {};

  players.forEach((player) => {
    stats[player.id] = {
      id: player.id,
      name: player.name,
      active: player.active !== false,
      seasonCounts: {
        firstBat: 0,
        lastBat: 0,
        firstBase: 0,
        pitcher1: 0,
        pitcher2: 0,
        totalPitcher: 0,
        totalKeyRoles: 0,
      },
      currentGameCounts: {
        firstBat: 0,
        lastBat: 0,
        firstBase: 0,
        pitcher1: 0,
        pitcher2: 0,
        totalKeyRoles: 0,
      },
    };
  });

  const allGames = [...games];
  if (currentGame && currentGame.innings && currentGame.innings.length > 0) {
    allGames.push(currentGame);
  }

  allGames.forEach((game) => {
    const isCurrent = currentGame && game.id === currentGame.id;
    (game.innings || []).forEach((inning) => {
      POSITIONS.forEach(({ key }) => {
        const playerId = inning[key];
        if (playerId && stats[playerId]) {
          stats[playerId].seasonCounts[key] = (stats[playerId].seasonCounts[key] || 0) + 1;
          stats[playerId].seasonCounts.totalKeyRoles += 1;
          if (key === 'pitcher1' || key === 'pitcher2') {
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
 * Generate suggestions for each position for a given inning.
 */
export function generateInningSuggestions(players, games = [], currentGame = null) {
  const activePlayers = players.filter((p) => p.active !== false);
  const stats = calculatePlayerStats(players, games, currentGame);

  const roleMilestones = {};
  const sortedCandidatesByRole = {};

  POSITIONS.forEach(({ key }) => {
    // Check if all active players have done this position at least once in season history
    const havenotDoneInSeason = activePlayers.filter(
      (p) => (stats[p.id]?.seasonCounts[key] || 0) === 0
    );

    const allHaveDoneInSeason = activePlayers.length > 0 && havenotDoneInSeason.length === 0;

    roleMilestones[key] = {
      allHaveDoneInSeason,
      havenotDoneCount: havenotDoneInSeason.length,
    };

    // Sort players for this specific role
    const candidates = [...activePlayers].sort((a, b) => {
      const statA = stats[a.id] || { seasonCounts: { [key]: 0, totalKeyRoles: 0 }, currentGameCounts: { [key]: 0, totalKeyRoles: 0 } };
      const statB = stats[b.id] || { seasonCounts: { [key]: 0, totalKeyRoles: 0 }, currentGameCounts: { [key]: 0, totalKeyRoles: 0 } };

      // 1. Position turns in season (asc)
      const seasonPosDiff = statA.seasonCounts[key] - statB.seasonCounts[key];
      if (seasonPosDiff !== 0) return seasonPosDiff;

      // 2. Position turns in current game (asc)
      const currentPosDiff = statA.currentGameCounts[key] - statB.currentGameCounts[key];
      if (currentPosDiff !== 0) return currentPosDiff;

      // 3. Total key role turns in current game (asc)
      const currentGameTotalDiff = statA.currentGameCounts.totalKeyRoles - statB.currentGameCounts.totalKeyRoles;
      if (currentGameTotalDiff !== 0) return currentGameTotalDiff;

      // 4. Total key role turns in season (asc)
      const seasonTotalDiff = statA.seasonCounts.totalKeyRoles - statB.seasonCounts.totalKeyRoles;
      if (seasonTotalDiff !== 0) return seasonTotalDiff;

      // 5. Name tie-breaker
      return a.name.localeCompare(b.name);
    });

    sortedCandidatesByRole[key] = candidates;
  });

  // Assign 1 unique player per position if possible
  const suggestions = {};
  const assignedPlayerIds = new Set();

  POSITIONS.forEach(({ key }) => {
    const candidates = sortedCandidatesByRole[key];
    const bestUnassigned = candidates.find((p) => !assignedPlayerIds.has(p.id));
    
    if (bestUnassigned) {
      suggestions[key] = bestUnassigned.id;
      assignedPlayerIds.add(bestUnassigned.id);
    } else if (candidates.length > 0) {
      // Fallback if fewer active players than positions
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
