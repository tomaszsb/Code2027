// src/App.tsx

import React from 'react';
import { ServiceProvider } from './context/ServiceProvider';
import { GameLayout } from './components/layout/GameLayout';

/**
 * App component serves as the composition root for the entire application.
 * It wraps the main layout with the ServiceProvider to provide dependency injection
 * throughout the component tree.
 */
export function App(): JSX.Element {
  return (
    <ServiceProvider>
      <GameLayout />
    </ServiceProvider>
  );
}