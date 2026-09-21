import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RosterManager from './components/RosterManager';
import HistoryLogger from './components/HistoryLogger';
import InningTracker from './components/InningTracker';
import StatsDashboard from './components/StatsDashboard';
import BackupModal from './components/BackupModal';
import { loadState, saveState, getActiveTeam, getTeamList, sortPlayersAlphabetically, createNewTeam } from './utils/storage';

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [activeTab, setActiveTab] = useState('live');
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Auto-save to localStorage on any change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const activeTeam = getActiveTeam(state);
  const teamList = getTeamList(state);

  // --- Active team data setters (update nested team object) ---

  const updateActiveTeam = (updater) => {
    setState((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [prev.activeTeamId]: updater(prev.teams[prev.activeTeamId]),
      },
    }));
  };

  const setPlayers = (players) => {
    updateActiveTeam((team) => ({ ...team, players: sortPlayersAlphabetically(players) }));
  };

  const setTeamName = (teamName) => {
    updateActiveTeam((team) => ({ ...team, teamName }));
  };

  const setGames = (games) => {
    updateActiveTeam((team) => ({ ...team, games }));
  };

  const setCurrentGame = (currentGame) => {
    updateActiveTeam((team) => ({ ...team, currentGame }));
  };

  const handleFinishGame = () => {
    if (!activeTeam.currentGame) return;
    const completedGame = {
      ...activeTeam.currentGame,
      completedAt: new Date().toISOString(),
    };

    if (window.confirm(`Save and finish ${completedGame.name}? It will be recorded into season history.`)) {
      updateActiveTeam((team) => ({
        ...team,
        games: [...team.games, completedGame],
        currentGame: null,
      }));
      setActiveTab('stats');
    }
  };

  // --- Multi-team management ---

  const handleSwitchTeam = (teamId) => {
    setState((prev) => ({ ...prev, activeTeamId: teamId }));
  };

  const handleAddTeam = (name) => {
    const newId = 'team_' + Date.now();
    setState((prev) => ({
      ...prev,
      activeTeamId: newId,
      teams: {
        ...prev.teams,
        [newId]: createNewTeam(name),
      },
    }));
  };

  const handleDeleteTeam = (teamId) => {
    setState((prev) => {
      const remaining = { ...prev.teams };
      delete remaining[teamId];
      const remainingIds = Object.keys(remaining);
      if (remainingIds.length === 0) {
        // Don't allow deleting the last team — recreate default
        const newId = 'team_' + Date.now();
        return {
          activeTeamId: newId,
          teams: { [newId]: createNewTeam('My Tee-Ball Team') },
        };
      }
      return {
        ...prev,
        activeTeamId: prev.activeTeamId === teamId ? remainingIds[0] : prev.activeTeamId,
        teams: remaining,
      };
    });
  };

  const handleRenameTeam = (teamId, newName) => {
    setState((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        [teamId]: { ...prev.teams[teamId], teamName: newName },
      },
    }));
  };

  const handleRestoreState = (newState) => {
    setState(newState);
  };

  return (
    <div class="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBackup={() => setIsBackupOpen(true)}
        teamName={activeTeam.teamName}
      />

      <main class="flex-1 pb-12">
        {activeTab === 'live' && (
          <InningTracker
            players={activeTeam.players}
            games={activeTeam.games}
            currentGame={activeTeam.currentGame}
            setCurrentGame={setCurrentGame}
            onFinishGame={handleFinishGame}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            players={activeTeam.players}
            setPlayers={setPlayers}
            teamName={activeTeam.teamName}
            setTeamName={setTeamName}
            teamList={teamList}
            activeTeamId={state.activeTeamId}
            onSwitchTeam={handleSwitchTeam}
            onAddTeam={handleAddTeam}
            onDeleteTeam={handleDeleteTeam}
            onRenameTeam={handleRenameTeam}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLogger
            players={activeTeam.players}
            games={activeTeam.games}
            setGames={setGames}
          />
        )}

        {activeTab === 'stats' && (
          <StatsDashboard
            players={activeTeam.players}
            games={activeTeam.games}
            currentGame={activeTeam.currentGame}
          />
        )}
      </main>

      {/* Backup & Restore Modal */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        state={state}
        onRestoreState={handleRestoreState}
      />
    </div>
  );
}
