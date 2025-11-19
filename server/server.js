// server/server.js
// Game State Synchronization Server for Multi-Device Play
// Provides REST API for state persistence across devices

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors()); // Allow all origins for development
app.use(express.json({ limit: '10mb' })); // Support large game states

// In-memory state storage
let gameState = null;
let stateVersion = 0;

// Active session tracking for smart layout adaptation
const activeSessions = new Map();
const SESSION_TIMEOUT = 10000; // 10 seconds

/**
 * GET /health
 * Health check endpoint
 * Returns server status and basic info
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    stateVersion,
    hasState: gameState !== null,
    playerCount: gameState?.players?.length || 0,
    gamePhase: gameState?.gamePhase || 'unknown'
  });
});

/**
 * GET /api/gamestate
 * Retrieve current game state
 * Returns 404 if no state exists
 */
app.get('/api/gamestate', (req, res) => {
  if (!gameState) {
    return res.status(404).json({
      error: 'No game state available',
      stateVersion: 0
    });
  }

  console.log(`📤 GET /api/gamestate - Sending state (v${stateVersion})`);
  console.log(`   Players: ${gameState.players?.length || 0}`);
  console.log(`   Phase: ${gameState.gamePhase || 'UNKNOWN'}`);
  console.log(`   Current Player: ${gameState.currentPlayerId || 'none'}`);

  res.json({
    state: gameState,
    stateVersion
  });
});

/**
 * POST /api/gamestate
 * Update game state
 * Body: { state: GameState, clientVersion?: number }
 * Returns new stateVersion
 */
app.post('/api/gamestate', (req, res) => {
  const { state, clientVersion } = req.body;

  // Validation
  if (!state) {
    return res.status(400).json({
      error: 'State is required',
      received: req.body
    });
  }

  // Version conflict warning (informational only, we use last-write-wins)
  if (clientVersion !== undefined && clientVersion < stateVersion) {
    console.warn(`⚠️  Client version ${clientVersion} behind server ${stateVersion} (will overwrite)`);
  }

  // Update state
  gameState = state;
  stateVersion++;

  // Detailed logging
  console.log(`✅ POST /api/gamestate - State updated (v${stateVersion})`);
  console.log(`   Players: ${state.players?.length || 0}`);
  console.log(`   Phase: ${state.gamePhase || 'UNKNOWN'}`);
  console.log(`   Current Player: ${state.currentPlayerId || 'none'}`);

  if (state.players && state.players.length > 0) {
    console.log(`   Player Details:`);
    state.players.forEach(p => {
      console.log(`     - ${p.name} (${p.id.slice(0, 8)}...): ${p.currentSpace} [${p.visitType}]`);
    });
  }

  res.json({
    success: true,
    stateVersion
  });
});

/**
 * DELETE /api/gamestate
 * Reset/clear game state
 * Useful for testing and starting fresh
 */
app.delete('/api/gamestate', (req, res) => {
  const previousVersion = stateVersion;
  const hadState = gameState !== null;

  gameState = null;
  stateVersion = 0;

  console.log(`🗑️  DELETE /api/gamestate - State reset`);
  console.log(`   Previous version: ${previousVersion}`);
  console.log(`   Had state: ${hadState}`);

  res.json({
    success: true,
    message: 'Game state reset',
    previousVersion,
    hadState
  });
});

/**
 * POST /api/heartbeat
 * Register/update device session for smart layout adaptation
 * Body: { playerId: string, deviceType: 'mobile' | 'desktop', sessionId?: string }
 * Returns: { success: true, sessionId: string }
 */
app.post('/api/heartbeat', (req, res) => {
  const { playerId, deviceType, sessionId } = req.body;

  // Validation
  if (!playerId || !deviceType) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['playerId', 'deviceType']
    });
  }

  if (!['mobile', 'desktop'].includes(deviceType)) {
    return res.status(400).json({
      error: 'Invalid deviceType',
      validValues: ['mobile', 'desktop']
    });
  }

  // Generate session ID if not provided
  const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Update session
  activeSessions.set(playerId, {
    lastSeen: Date.now(),
    deviceType,
    sessionId: finalSessionId
  });

  console.log(`💓 Heartbeat: Player ${playerId.slice(0, 8)}... on ${deviceType}`);

  // Cleanup stale sessions
  cleanupStaleSessions();

  res.json({
    success: true,
    sessionId: finalSessionId
  });
});

/**
 * GET /api/sessions
 * Get all active device sessions
 * Returns: { [playerId]: { deviceType, lastSeen } }
 */
app.get('/api/sessions', (req, res) => {
  // Cleanup before returning
  cleanupStaleSessions();

  // Convert Map to object
  const sessions = {};
  activeSessions.forEach((data, playerId) => {
    sessions[playerId] = {
      deviceType: data.deviceType,
      lastSeen: data.lastSeen
    };
  });

  console.log(`📱 GET /api/sessions - ${activeSessions.size} active session(s)`);

  res.json(sessions);
});

/**
 * Cleanup stale sessions (haven't sent heartbeat in SESSION_TIMEOUT ms)
 */
function cleanupStaleSessions() {
  const now = Date.now();
  const stalePlayerIds = [];

  activeSessions.forEach((data, playerId) => {
    if (now - data.lastSeen > SESSION_TIMEOUT) {
      stalePlayerIds.push(playerId);
    }
  });

  // Remove stale sessions
  stalePlayerIds.forEach(playerId => {
    console.log(`🧹 Cleaned up stale session for player ${playerId.slice(0, 8)}...`);
    activeSessions.delete(playerId);
  });
}

/**
 * GET /api/debug/state
 * Debug endpoint to inspect raw state
 * Returns prettified JSON for troubleshooting
 */
app.get('/api/debug/state', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify({
    stateVersion,
    hasState: gameState !== null,
    state: gameState
  }, null, 2));
});

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    availableEndpoints: [
      'GET /health',
      'GET /api/gamestate',
      'POST /api/gamestate',
      'DELETE /api/gamestate',
      'POST /api/heartbeat',
      'GET /api/sessions',
      'GET /api/debug/state'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Game State Synchronization Server Started');
  console.log('');
  console.log(`   Port: ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  console.log(`   Network: http://0.0.0.0:${PORT}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log(`   GET    /health              - Health check`);
  console.log(`   GET    /api/gamestate       - Get current state`);
  console.log(`   POST   /api/gamestate       - Update state`);
  console.log(`   DELETE /api/gamestate       - Reset state`);
  console.log(`   POST   /api/heartbeat       - Device session heartbeat`);
  console.log(`   GET    /api/sessions        - Get active sessions`);
  console.log(`   GET    /api/debug/state     - Debug state dump`);
  console.log('');
  console.log('🔄 Server ready for multi-device sync');
  console.log('📱 Smart layout adaptation enabled');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('');
  console.log('🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('');
  console.log('🛑 Shutting down server...');
  process.exit(0);
});
