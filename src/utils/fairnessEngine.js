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

  const countInning = (inn) => {
    if (!inn) return;

    // Fielding counts
    FIELDING_POSITIONS.forEach((pos) => {
      let pid = inn[pos.key];
      // Legacy mapping: pitcher1 -> pitcher
      if (!pid && pos.key === 'pitcher' && inn.pitcher1) {
        pid = inn.pitcher1;
      }
      if (pid && stats[pid]) {
        stats[pid].fielding[pos.key] = (stats[pid].fielding[pos.key] || 0) + 1;
        stats[pid].totalFielding += 1;
      }
    });

    // Batting counts
    for (let i = 1; i <= MAX_PLAYERS; i++) {
      const slotKey = `bat${i}`;
      let pid = inn[slotKey];
      // Legacy mapping
      if (!pid && i === 1 && inn.firstBat) pid = inn.firstBat;
      if (!pid && i === 4 && inn.lastBat) pid = inn.lastBat; // legacy default lastBat was slot 4

      if (pid && stats[pid]) {
        stats[pid].batting[slotKey] = (stats[pid].batting[slotKey] || 0) + 1;
        stats[pid].totalBatting += 1;
      }
    }
  };

  // Tally completed past games
  (games || []).forEach((g) => {
    (g.innings || []).forEach(countInning);
  });

  // Tally current live game
  if (currentGame && currentGame.innings) {
    currentGame.innings.forEach(countInning);
  }

  return stats;
}

/**
 * Generates an optimal assignment for a set of positions (fielding or batting) for a single inning.
 * Balances:
 * 1. Prior season history (zero-turns get highest priority)
 * 2. Avoids repeating a position that the player already played in the current game
 */
export function assignFairInning(positionsList, attendingPlayers, seasonStats, gameHistoryList) {
  const assigned = {};
  const usedPlayerIds = new Set();

  positionsList.forEach((pos) => {
    const posKey = pos.key;

    // Sort available candidates
    const candidates = attendingPlayers
      .filter((p) => !usedPlayerIds.has(p.id))
      .sort((a, b) => {
        const statsA = seasonStats[a.id] || {};
        const statsB = seasonStats[b.id] || {};

        // 1. Did player play this exact position in earlier innings of this current game? (penalty)
        const timesInThisGameA = gameHistoryList.filter((inn) => inn[posKey] === a.id).length;
        const timesInThisGameB = gameHistoryList.filter((inn) => inn[posKey] === b.id).length;
        if (timesInThisGameA !== timesInThisGameB) {
          return timesInThisGameA - timesInThisGameB;
        }

        // 2. Season-wide turn count for this position (0 turns first!)
        const isBatting = posKey.startsWith('bat');
        const seasonCountA = isBatting
          ? (statsA.batting?.[posKey] || 0)
          : (statsA.fielding?.[posKey] || 0);
        const seasonCountB = isBatting
          ? (statsB.batting?.[posKey] || 0)
          : (statsB.fielding?.[posKey] || 0);

        if (seasonCountA !== seasonCountB) {
          return seasonCountA - seasonCountB;
        }

        // 3. Total turns across all positions (balance overall play)
        const totalA = isBatting ? (statsA.totalBatting || 0) : (statsA.totalFielding || 0);
        const totalB = isBatting ? (statsB.totalBatting || 0) : (statsB.totalFielding || 0);
        if (totalA !== totalB) {
          return totalA - totalB;
        }

        return a.name.localeCompare(b.name);
      });

    if (candidates.length > 0) {
      assigned[posKey] = candidates[0].id;
      usedPlayerIds.add(candidates[0].id);
    } else {
      assigned[posKey] = '';
    }
  });

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
      generatedInnings
    );
    Object.assign(inningObj, fieldingAssignments);

    // Assign Batting
    const battingAssignments = assignFairInning(
      battingSlots,
      attending,
      simulatedStats,
      generatedInnings
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

    // If fielding is already complete, keep it and count it
    if (inn.fieldingComplete) {
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
        updatedInnings
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

    // If batting is already complete, keep it and count it
    if (inn.battingComplete) {
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
        updatedInnings
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
  positionsList.forEach((pos) => {
    if (pos.key !== targetKey && updatedInn[pos.key] === newPlayerId) {
      existingKeyForNewPlayer = pos.key;
    }
  });

  // Assign new player to target
  updatedInn[targetKey] = newPlayerId;

  // If new player was already elsewhere, put the old holder into that spot (SWAP)
  if (existingKeyForNewPlayer) {
    updatedInn[existingKeyForNewPlayer] = currentHolderId || '';
  }

  return updatedInn;
}
