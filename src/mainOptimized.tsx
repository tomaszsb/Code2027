// src/mainOptimized.tsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppOptimized } from './AppOptimized';
import { PerformanceMonitor } from './utils/PerformanceMonitor';

/**
 * Optimized main entry point with performance monitoring and faster startup
 */
function main(): void {
  PerformanceMonitor.startMeasurement('main-execution');

  const container = document.getElementById('root');

  if (!container) {
    throw new Error('Root element not found. Make sure there is a div with id="root" in your HTML.');
  }

  PerformanceMonitor.startMeasurement('react-root-creation');
  const root = createRoot(container);
  PerformanceMonitor.endMeasurement('react-root-creation');

  PerformanceMonitor.startMeasurement('react-initial-render');
  root.render(<AppOptimized />);

  // Schedule performance measurement after React has had a chance to render
  setTimeout(() => {
    PerformanceMonitor.endMeasurement('react-initial-render');
    PerformanceMonitor.endMeasurement('main-execution');
  }, 0);
}

// Pre-warm critical modules
if (typeof window !== 'undefined') {
  // Preload critical modules in background
  setTimeout(() => {
    import('./services/DataServiceOptimized');
    import('./context/ServiceProviderOptimized');
  }, 0);
}

// Initialize the application
main();