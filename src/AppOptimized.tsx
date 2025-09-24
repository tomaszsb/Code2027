// src/AppOptimized.tsx

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { ServiceProviderOptimized } from './context/ServiceProviderOptimized';
import { useGameContext } from './context/GameContext';
import { colors } from './styles/theme';
import { PerformanceMonitor } from './utils/PerformanceMonitor';

// Lazy load heavy components
const GameLayout = lazy(() =>
  import('./components/layout/GameLayout').then(module => ({
    default: module.GameLayout
  }))
);

/**
 * Enhanced LoadingScreen with performance information
 */
function LoadingScreen({ progress }: { progress?: string }): JSX.Element {
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
      {progress && (
        <div style={{ fontSize: '16px', color: colors.text.secondary, marginTop: '10px' }}>
          {progress}
        </div>
      )}
      <div style={{ fontSize: '14px', color: colors.text.muted, marginTop: '15px' }}>
        Optimized for fast loading ⚡
      </div>
    </div>
  );
}

/**
 * Optimized AppContent with progressive loading
 */
function AppContent(): JSX.Element {
  const { dataService, stateService } = useGameContext();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('Initializing...');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        PerformanceMonitor.startMeasurement('app-data-loading');

        setLoadingProgress('Loading critical game data...');
        await dataService.loadData();

        PerformanceMonitor.endMeasurement('app-data-loading');
        PerformanceMonitor.startMeasurement('app-state-setup');

        setLoadingProgress('Setting up game state...');

        // Fix any existing players who might have incorrect starting spaces
        console.log('🔧 Attempting to fix player starting spaces after data load...');
        stateService.fixPlayerStartingSpaces();

        // If that didn't work, use the aggressive fix
        console.log('🚨 Using aggressive fix to ensure all players are on correct starting space...');
        stateService.forceResetAllPlayersToCorrectStartingSpace();

        PerformanceMonitor.endMeasurement('app-state-setup');

        setLoadingProgress('Starting game interface...');

        // Small delay to show final progress message
        setTimeout(() => {
          PerformanceMonitor.endMeasurement('app-initialization');
          console.log(PerformanceMonitor.generateReport());
          setIsLoading(false);
        }, 100);

      } catch (error) {
        console.error('Failed to initialize application:', error);
        setLoadingProgress('Error loading game data. Please refresh.');
        // Keep loading state to prevent rendering with invalid data
      }
    };

    initializeApp();
  }, [dataService, stateService]);

  if (isLoading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return (
    <Suspense fallback={<LoadingScreen progress="Loading game interface..." />}>
      <GameLayout />
    </Suspense>
  );
}

/**
 * Optimized App component with performance monitoring and lazy loading
 */
export function AppOptimized(): JSX.Element {
  PerformanceMonitor.startMeasurement('app-render');

  useEffect(() => {
    PerformanceMonitor.endMeasurement('app-render');
  }, []);

  return (
    <ServiceProviderOptimized>
      <AppContent />
    </ServiceProviderOptimized>
  );
}