import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import RosterManager from './components/RosterManager';
import HistoryLogger from './components/HistoryLogger';
import InningTracker from './components/InningTracker';
import StatsDashboard from './components/StatsDashboard';
import BackupModal from './components/BackupModal';
import { loadState, saveState, sortPlayersAlphabetically } from './utils/storage';

export default function App() {
  const [state, setState] = useState(() => loadState());
  const [activeTab, setActiveTab] = useState('live');
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Auto-save state to localStorage on any change
  useEffect(() => {
    saveState(state);
  }, [state]);

  const setPlayers = (players) => {
    setState((prev) => ({ ...prev, players: sortPlayersAlphabetically(players) }));
  };

  const setTeamName = (teamName) => {
    setState((prev) => ({ ...prev, teamName }));
  };

  const setGames = (games) => {
    setState((prev) => ({ ...prev, games }));
  };

  const setCurrentGame = (currentGame) => {
    setState((prev) => ({ ...prev, currentGame }));
  };

  const handleFinishGame = () => {
    if (!state.currentGame) return;
    const completedGame = {
      ...state.currentGame,
      completedAt: new Date().toISOString(),
    };

    if (window.confirm(`Save and finish ${completedGame.name}? It will be recorded into season history.`)) {
      setState((prev) => ({
        ...prev,
        games: [...prev.games, completedGame],
        currentGame: null,
      }));
      setActiveTab('stats');
    }
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
        teamName={state.teamName}
      />

      <main class="flex-1 pb-12">
        {activeTab === 'live' && (
          <InningTracker
            players={state.players}
            games={state.games}
            currentGame={state.currentGame}
            setCurrentGame={setCurrentGame}
            onFinishGame={handleFinishGame}
          />
        )}

        {activeTab === 'roster' && (
          <RosterManager
            players={state.players}
            setPlayers={setPlayers}
            teamName={state.teamName}
            setTeamName={setTeamName}
          />
        )}

        {activeTab === 'history' && (
          <HistoryLogger
            players={state.players}
            games={state.games}
            setGames={setGames}
          />
        )}

        {activeTab === 'stats' && (
          <StatsDashboard
            players={state.players}
            games={state.games}
            currentGame={state.currentGame}
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
