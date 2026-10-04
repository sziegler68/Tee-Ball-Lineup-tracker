/**
 * FAIRNESS ENGINE
 * Handles:
 * 1. 10 Priority Fielding Positions (in exact priority order):
 *    1st Base, 2nd Base, 3rd Base, Pitcher, Shortstop,
 *    Left Field, Center Field, Right Field, Pitcher 2, Shortstop 2
 * 2. Batting Lineup Slots (1 to N, where N = number of attending kids, up to 10)
 * 3. 4-Inning Fair-Play Generator (both fielding & batting change every inning)
 * 4. Automatic Swapping on live changes
 * 5. Mid-game late arrival re-generation (preserving completed halves)
 */

export const FIELDING_POSITIONS = [
  { key: 'firstBase',  label: '1st Base',    short: '1B',  icon: '🏃', priority: 1 },
  { key: 'secondBase', label: '2nd Base',    short: '2B',  icon: '🏃', priority: 2 },
  { key: 'thirdBase',  label: '3rd Base',    short: '3B',  icon: '🏃', priority: 3 },
  { key: 'pitcher',    label: 'Pitcher',     short: 'P',   icon: '🎯', priority: 4 },
  { key: 'shortstop',  label: 'Shortstop',   short: 'SS',  icon: '🏃', priority: 5 },
  { key: 'leftField',  label: 'Left Field',  short: 'LF',  icon: '🌿', priority: 6 },
  { key: 'centerField',label: 'Center Field',short: 'CF',  icon: '🌿', priority: 7 },
  { key: 'rightField', label: 'Right Field', short: 'RF',  icon: '🌿', priority: 8 },
  { key: 'pitcher2',   label: 'Pitcher 2',   short: 'P2',  icon: '🎯', priority: 9 },
  { key: 'shortstop2', label: 'Shortstop 2', short: 'SS2', icon: '🏃', priority: 10 },
];

export const MAX_PLAYERS = 10;

export const ALL_POSITIONS = FIELDING_POSITIONS.map((p) => ({
  ...p,
  category: 'defense',
  defaultOn: true,
}));

export function getDefaultEnabledKeys() {
  return FIELDING_POSITIONS.map((p) => p.key);
}

export function getEnabledPositions(keys) {
  if (!keys || keys.length === 0) return FIELDING_POSITIONS;
  const set = new Set(keys);
  return FIELDING_POSITIONS.filter((p) => set.has(p.key));
}

export function getOrdinalSuffix(i) {
  const j = i % 10, k = i % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

/**
 * Returns dynamic batting slots for count players (up to 10)
 */
export function getBattingSlots(count) {
  const safeCount = Math.min(Math.max(count || 0, 1), MAX_PLAYERS);
  const slots = [];
  for (let i = 1; i <= safeCount; i++) {
    const isFirst = i === 1;
    const isLast = i === safeCount;
    slots.push({
      key: `bat${i}`,
      slotNumber: i,
      label: isFirst ? '1st Batter (Lead)' : (isLast ? `${i}${getOrdinalSuffix(i)} Batter (Last)` : `${i}${getOrdinalSuffix(i)} Batter`),
      short: `#${i}`,
      icon: isFirst ? '⚾' : (isLast ? '🏁' : '🏏'),
    });
  }
  return slots;
}

/**
 * Returns active fielding positions for count players (first count positions by priority)
 */
export function getActiveFieldingPositions(count) {
  const safeCount = Math.min(Math.max(count || 0, 1), FIELDING_POSITIONS.length);
  return FIELDING_POSITIONS.slice(0, safeCount);
}

/**
 * Calculates season-wide turn counts for each player across recorded games.
 * Supports both new keys (pitcher, bat1..bat10) and legacy keys (pitcher1, firstBat, lastBat).
 */
export function calculateSeasonStats(allPlayers, games = [], currentGame = null) {
  const stats = {};

  allPlayers.forEach((p) => {
    const fielding = {};
    FIELDING_POSITIONS.forEach((pos) => { fielding[pos.key] = 0; });

    const batting = {};
    for (let i = 1; i <= MAX_PLAYERS; i++) { batting[`bat${i}`] = 0; }

    stats[p.id] = {
      id: p.id,
      name: p.name,
      active: p.active !== false,
      fielding,
      batting,
      totalFielding: 0,
      totalBatting: 0,
    };
  });

  const countInning = (inn, game) => {
    if (!inn) return;

    // Use attendance count if available to ignore ghost slots
    const attendanceCount = (game && game.attendance && Array.isArray(game.attendance))
      ? game.attendance.length
      : MAX_PLAYERS;

    // Guard sets so no player is counted twice for the same inning
    const countedBatters = new Set();
    const countedFielders = new Set();

    // Fielding counts (only up to attendanceCount positions)
    const activeFielding = FIELDING_POSITIONS.slice(0, attendanceCount);
    activeFielding.forEach((pos) => {
      let pid = inn[pos.key];
      // Legacy mapping: pitcher1 -> pitcher
      if (!pid && pos.key === 'pitcher' && inn.pitcher1) {
        pid = inn.pitcher1;
      }
      if (pid && stats[pid] && !countedFielders.has(pid)) {
        countedFielders.add(pid);
        stats[pid].fielding[pos.key] = (stats[pid].fielding[pos.key] || 0) + 1;
        stats[pid].totalFielding += 1;
      }
    });

    // Batting counts (only up to attendanceCount slots)
    for (let i = 1; i <= attendanceCount; i++) {
      const slotKey = `bat${i}`;
      let pid = inn[slotKey];
      // Legacy mapping
      if (!pid && i === 1 && inn.firstBat) pid = inn.firstBat;
      if (!pid && i === 4 && inn.lastBat) pid = inn.lastBat; // legacy default lastBat was slot 4

      if (pid && stats[pid] && !countedBatters.has(pid)) {
        countedBatters.add(pid);
        stats[pid].batting[slotKey] = (stats[pid].batting[slotKey] || 0) + 1;
        stats[pid].totalBatting += 1;
      }
    }
  };

  // Tally completed past games
  (games || []).forEach((g) => {
    (g.innings || []).forEach((inn) => countInning(inn, g));
  });

  // Tally current live game
  if (currentGame && currentGame.innings) {
    currentGame.innings.forEach((inn) => countInning(inn, currentGame));
  }

  return stats;
}

/**
 * Kuhn-Munkres (Hungarian) Minimum-Cost Bipartite Matching
 * Solves the global assignment problem in O(N^3) time (~0.1ms for N <= 10).
 * Finds the global assignment of all players to all positions that minimizes the sum of costs,
 * eliminating greedy starvation and alphabetical bias.
 */
function minCostMatching(costMatrix) {
  const n = costMatrix.length;
  const m = costMatrix[0].length;
  const u = new Array(n + 1).fill(0);
  const v = new Array(m + 1).fill(0);
  const p = new Array(m + 1).fill(0);
  const way = new Array(m + 1).fill(0);

  for (let i = 1; i <= n; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(m + 1).fill(Infinity);
    const used = new Array(m + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= m; j++) {
        if (!used[j]) {
          const cur = costMatrix[i0 - 1][j - 1] - u[i0] - v[j];
          if (cur < minv[j]) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j] < delta) {
            delta = minv[j];
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= m; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }
      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  const result = new Array(n);
  for (let j = 1; j <= m; j++) {
    if (p[j] > 0) {
      result[p[j] - 1] = j - 1;
    }
  }
  return result;
}

/**
 * Assigns all positions/slots for an inning using global Minimum-Cost Matching.
 * Balances:
 * 1. Prior season history (0 turns get highest priority)
 * 2. Strict penalty against repeating any position already played in this game
 * 3. Inning-based rotation offset to eliminate any alphabetical tie-breaker bias
 */
export function assignFairInning(positionsList, attendingPlayers, seasonStats, gameHistoryList, inningNum = 1) {
  if (!positionsList || positionsList.length === 0 || !attendingPlayers || attendingPlayers.length === 0) {
    return {};
  }

  const numPlayers = attendingPlayers.length;
  const numPositions = positionsList.length;

  // Build Cost Matrix: rows = players, cols = positions
  const costMatrix = [];

  for (let i = 0; i < numPlayers; i++) {
    const player = attendingPlayers[i];
    const statsP = seasonStats[player.id] || {};
    const row = [];

    for (let j = 0; j < numPositions; j++) {
      const pos = positionsList[j];
      const posKey = pos.key;
      const isBatting = posKey.startsWith('bat');

      // 1. Season-wide turn count for this position
      const seasonCount = isBatting
        ? (statsP.batting?.[posKey] || 0)
        : (statsP.fielding?.[posKey] || 0);

      // 2. Penalty for having played this position in earlier innings of current game
      const timesInThisGame = (gameHistoryList || []).filter((inn) => inn[posKey] === player.id).length;

      // 3. Overall turn balance
      const totalTurns = isBatting ? (statsP.totalBatting || 0) : (statsP.totalFielding || 0);

      // 4. Deterministic rotation tie-breaker (zero alphabetical bias!)
      const rotationFactor = (i * 7 + j * 13 + (inningNum || 1) * 11) % 37;

      const cost =
        seasonCount * 10000 +
        timesInThisGame * 50000 +
        totalTurns * 100 +
        rotationFactor;

      row.push(cost);
    }
    costMatrix.push(row);
  }

  // Solve global matching
  const matching = minCostMatching(costMatrix);

  const assigned = {};
  for (let i = 0; i < numPlayers; i++) {
    const posIdx = matching[i];
    if (posIdx !== undefined && posIdx < numPositions) {
      assigned[positionsList[posIdx].key] = attendingPlayers[i].id;
    }
  }

  return assigned;
}

/**
 * Creates a brand new 4-inning game structure populated with fair play assignments.
 */
export function generateFullGame({
  teamId,
  name,
  date,
  homeOrAway = 'away',
  attendingPlayerIds,
  allPlayers,
  pastGames = [],
  numInnings = 4,
}) {
  const attending = allPlayers.filter((p) => attendingPlayerIds.includes(p.id));
  const activeCount = attending.length;

  const fieldingPositions = getActiveFieldingPositions(activeCount);
  const battingSlots = getBattingSlots(activeCount);

  // We simulate progressive stats across the 4 innings
  const simulatedStats = calculateSeasonStats(allPlayers, pastGames, null);
  const generatedInnings = [];

  for (let innNum = 1; innNum <= numInnings; innNum++) {
    const inningObj = {
      inning: innNum,
      battingComplete: false,
      fieldingComplete: false,
    };

    // Assign Fielding
    const fieldingAssignments = assignFairInning(
      fieldingPositions,
      attending,
      simulatedStats,
      generatedInnings,
      innNum
    );
    Object.assign(inningObj, fieldingAssignments);

    // Assign Batting
    const battingAssignments = assignFairInning(
      battingSlots,
      attending,
      simulatedStats,
      generatedInnings,
      innNum
    );
    Object.assign(inningObj, battingAssignments);

    // Update simulated stats with this inning's assignments so subsequent innings know
    fieldingPositions.forEach((pos) => {
      const pid = inningObj[pos.key];
      if (pid && simulatedStats[pid]) {
        simulatedStats[pid].fielding[pos.key] = (simulatedStats[pid].fielding[pos.key] || 0) + 1;
        simulatedStats[pid].totalFielding += 1;
      }
    });
    battingSlots.forEach((slot) => {
      const pid = inningObj[slot.key];
      if (pid && simulatedStats[pid]) {
        simulatedStats[pid].batting[slot.key] = (simulatedStats[pid].batting[slot.key] || 0) + 1;
        simulatedStats[pid].totalBatting += 1;
      }
    });

    generatedInnings.push(inningObj);
  }

  return {
    id: 'live_' + Date.now(),
    name: name || `Game ${pastGames.length + 1}`,
    date: date || new Date().toISOString().slice(0, 10),
    homeOrAway: homeOrAway, // 'away' (bat first) or 'home' (field first)
    attendance: attendingPlayerIds,
    innings: generatedInnings,
  };
}

/**
 * Regenerates only incomplete innings when a player arrives late (or leaves).
 * Completed innings/halves are preserved untouched.
 */
export function updateIncompleteInnings({
  currentGame,
  newAttendingPlayerIds,
  allPlayers,
  pastGames = [],
}) {
  if (!currentGame || !currentGame.innings) return currentGame;

  const attending = allPlayers.filter((p) => newAttendingPlayerIds.includes(p.id));
  const activeCount = attending.length;

  const fieldingPositions = getActiveFieldingPositions(activeCount);
  const battingSlots = getBattingSlots(activeCount);

  // Calculate stats up through past games plus COMPLETED portions of current game
  const baseStats = calculateSeasonStats(allPlayers, pastGames, null);

  const updatedInnings = [];

  currentGame.innings.forEach((inn, idx) => {
    const updatedInn = { ...inn };

    // If fielding is already complete, keep it and clean any slots beyond active count
    if (inn.fieldingComplete) {
      FIELDING_POSITIONS.slice(activeCount).forEach((pos) => {
        delete updatedInn[pos.key];
      });
      fieldingPositions.forEach((pos) => {
        const pid = inn[pos.key];
        if (pid && baseStats[pid]) {
          baseStats[pid].fielding[pos.key] = (baseStats[pid].fielding[pos.key] || 0) + 1;
          baseStats[pid].totalFielding += 1;
        }
      });
    } else {
      // Re-assign incomplete fielding
      const newFielding = assignFairInning(
        fieldingPositions,
        attending,
        baseStats,
        updatedInnings,
        idx + 1
      );
      // Clean old fielding keys that may no longer be active
      FIELDING_POSITIONS.forEach((pos) => {
        delete updatedInn[pos.key];
      });
      Object.assign(updatedInn, newFielding);

      // Count for next innings
      fieldingPositions.forEach((pos) => {
        const pid = updatedInn[pos.key];
        if (pid && baseStats[pid]) {
          baseStats[pid].fielding[pos.key] = (baseStats[pid].fielding[pos.key] || 0) + 1;
          baseStats[pid].totalFielding += 1;
        }
      });
    }

    // If batting is already complete, keep it and clean any slots beyond active count
    if (inn.battingComplete) {
      for (let i = activeCount + 1; i <= MAX_PLAYERS; i++) {
        delete updatedInn[`bat${i}`];
      }
      battingSlots.forEach((slot) => {
        const pid = inn[slot.key];
        if (pid && baseStats[pid]) {
          baseStats[pid].batting[slot.key] = (baseStats[pid].batting[slot.key] || 0) + 1;
          baseStats[pid].totalBatting += 1;
        }
      });
    } else {
      // Re-assign incomplete batting
      const newBatting = assignFairInning(
        battingSlots,
        attending,
        baseStats,
        updatedInnings,
        idx + 1
      );
      // Clean old batting keys
      for (let i = 1; i <= MAX_PLAYERS; i++) {
        delete updatedInn[`bat${i}`];
      }
      Object.assign(updatedInn, newBatting);

      // Count for next innings
      battingSlots.forEach((slot) => {
        const pid = updatedInn[slot.key];
        if (pid && baseStats[pid]) {
          baseStats[pid].batting[slot.key] = (baseStats[pid].batting[slot.key] || 0) + 1;
          baseStats[pid].totalBatting += 1;
        }
      });
    }

    updatedInnings.push(updatedInn);
  });

  return {
    ...currentGame,
    attendance: newAttendingPlayerIds,
    innings: updatedInnings,
  };
}

/**
 * Automatic Swap helper:
 * When user selects newPlayerId for targetKey in an inning:
 * If newPlayerId was already assigned to another key in that same category (fielding or batting),
 * swap the two players!
 */
export function swapPlayerInInning({
  inning,
  targetKey,
  newPlayerId,
  isBatting = false,
  positionsList,
}) {
  const updatedInn = { ...inning };
  const currentHolderId = updatedInn[targetKey];

  if (currentHolderId === newPlayerId) {
    return updatedInn;
  }

  // Find if newPlayerId is already occupying another position in this inning
  let existingKeyForNewPlayer = null;
  if (isBatting) {
    for (let i = 1; i <= MAX_PLAYERS; i++) {
      const k = `bat${i}`;
      if (k !== targetKey && updatedInn[k] === newPlayerId) {
        existingKeyForNewPlayer = k;
        break;
      }
    }
  } else {
    FIELDING_POSITIONS.forEach((pos) => {
      if (pos.key !== targetKey && updatedInn[pos.key] === newPlayerId) {
        existingKeyForNewPlayer = pos.key;
      }
    });
  }

  // Assign new player to target
  updatedInn[targetKey] = newPlayerId;

  // If new player was already elsewhere, put the old holder into that spot (SWAP)
  if (existingKeyForNewPlayer) {
    updatedInn[existingKeyForNewPlayer] = currentHolderId || '';
  }

  return updatedInn;
}
