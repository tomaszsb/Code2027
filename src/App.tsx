// src/App.tsx

import React, { useState, useEffect } from 'react';
import { ServiceProvider } from './context/ServiceProvider';
import { GameLayout } from './components/layout/GameLayout';
import { useGameContext } from './context/GameContext';
import { colors } from './styles/theme';
import { getAppScreen, getURLParams } from './utils/getAppScreen';
import { getBackendURL } from './utils/networkDetection';

/**
 * LoadingScreen component displays while the application initializes
 */
function LoadingScreen({ message }: { message?: string }): JSX.Element {
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
      <div>{message || 'Loading Game Data...'}</div>
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

  // Subscribe to game state changes
  useEffect(() => {
    const unsubscribe = stateService.subscribe((newState) => {
      setGameState(newState);
    });
    return unsubscribe;
  }, [stateService]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await dataService.loadData();

        // Try to load state from server first (multi-device sync)
        console.log('🌐 Attempting to load state from server...');
        const stateLoaded = await stateService.loadStateFromServer();

        if (!stateLoaded) {
          console.log('📱 No server state found, using local state');

          // Fix any existing players who might have incorrect starting spaces
          // This addresses the caching bug where players were created before data loaded
          console.log('🔧 Attempting to fix player starting spaces after data load...');
          stateService.fixPlayerStartingSpaces();

          // If that didn't work, use the aggressive fix
          console.log('🚨 Using aggressive fix to ensure all players are on correct starting space...');
          stateService.forceResetAllPlayersToCorrectStartingSpace();
        } else {
          console.log('✅ State loaded from server successfully');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize application:', error);
        // Keep loading state to prevent rendering with invalid data
      }
    };

    initializeApp();
  }, [dataService, stateService]);

  // Poll server for state updates every 2 seconds (multi-device sync)
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const backendURL = getBackendURL();
        const response = await fetch(`${backendURL}/api/gamestate`);

        if (response.ok) {
          const { state, stateVersion } = await response.json();

          // Update local state if server has state
          // Note: We use replaceState to avoid triggering another sync (would cause loop)
          if (state) {
            stateService.replaceState(state);
          }
        }
      } catch (error) {
        // Server not available - continue with local state
        // Silently fail to avoid console spam
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [stateService]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Read URL parameters to determine routing
  const urlParams = getURLParams();
  const playerIds = gameState.players.map(p => p.id);
  const routeInfo = getAppScreen(urlParams, gameState.gamePhase, playerIds);

  console.log('🔍 Routing info:', routeInfo);

  // Render based on routing logic
  // If playerId is specified in URL and valid, show player-specific view
  if (routeInfo.playerId && routeInfo.isValidPlayer) {
    return (
      <>
        <GameLayout viewPlayerId={routeInfo.playerId} />
      </>
    );
  }

  // Show warning if invalid player ID in URL
  if (routeInfo.playerId && !routeInfo.isValidPlayer) {
    console.warn(`Invalid player ID in URL: ${routeInfo.playerId}`);
  }

  // Default: show normal game view (no player locking)
  return (
    <>
      <GameLayout />
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