// src/App.tsx

import React, { useState, useEffect } from 'react';
import { ServiceProvider } from './context/ServiceProvider';
import { GameLayout } from './components/layout/GameLayout';
import { useGameContext } from './context/GameContext';
import { colors } from './styles/theme';
import { getAppScreen } from './utils/getAppScreen';

/**
 * LoadingScreen component displays while the application initializes
 */
function LoadingScreen(): JSX.Element {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: colors.background.secondary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        color: colors.neutral.black
      }}
    >
      <div style={{ marginBottom: '20px', fontSize: '48px' }}>🎲</div>
      <div>Loading Game Data...</div>
      <div style={{ fontSize: '16px', color: colors.text.secondary, marginTop: '10px' }}>
        Please wait while we initialize the game
      </div>
    </div>
  );
}

/**
 * AppContent component handles the loading state and renders the game when ready
 */
function AppContent(): JSX.Element {
  const { dataService, stateService } = useGameContext();
  const [isLoading, setIsLoading] = useState(true);
  const [gameState, setGameState] = useState(stateService.getGameState());
  const [urlPlayerId, setUrlPlayerId] = useState<string | null>(null);

  // Extract playerId from URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const playerIdParam = urlParams.get('playerId');
    if (playerIdParam) {
      setUrlPlayerId(playerIdParam);
      console.log('🎮 Player ID from URL:', playerIdParam);
    }
  }, []);

  // Initialize app data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await dataService.loadData();

        // Fix any existing players who might have incorrect starting spaces
        // This addresses the caching bug where players were created before data loaded
        console.log('🔧 Attempting to fix player starting spaces after data load...');
        stateService.fixPlayerStartingSpaces();

        // If that didn't work, use the aggressive fix
        console.log('🚨 Using aggressive fix to ensure all players are on correct starting space...');
        stateService.forceResetAllPlayersToCorrectStartingSpace();

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize application:', error);
        // Keep loading state to prevent rendering with invalid data
      }
    };

    initializeApp();
  }, [dataService, stateService]);

  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = stateService.subscribe((newState) => {
      setGameState(newState);
    });

    // Initialize with current state
    setGameState(stateService.getGameState());

    return unsubscribe;
  }, [stateService]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Determine which screen to show based on game state and URL parameter
  const { screen, playerId } = getAppScreen(gameState, urlPlayerId);

  // Show warning if player ID was provided but not found
  if (urlPlayerId && !playerId && screen === 'SETUP') {
    console.warn(`⚠️ Player ${urlPlayerId} not found in game. Showing setup screen.`);
  }

  return (
    <>
      <GameLayout playerId={playerId} />
    </>
  );
}

/**
 * App component serves as the composition root for the entire application.
 * It wraps the main layout with the ServiceProvider to provide dependency injection
 * throughout the component tree.
 */
export function App(): JSX.Element {
  return (
    <ServiceProvider>
      <AppContent />
    </ServiceProvider>
  );
}