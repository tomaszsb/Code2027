// server/index.ts

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameManager } from './GameManager';
import { setupSocketHandlers } from './websocket/handlers';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
} from './types/ServerTypes';

// Configuration
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server with types
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true
  }
});

// Create game manager
const gameManager = new GameManager();

// Set up WebSocket handlers
setupSocketHandlers(io, gameManager);

// REST API endpoints

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * Get server statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = gameManager.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get stats'
    });
  }
});

/**
 * Get all active games (admin endpoint)
 */
app.get('/api/games', (req, res) => {
  try {
    const games = gameManager.getActiveGames();
    res.json({
      success: true,
      games
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get games'
    });
  }
});

/**
 * Get specific game info
 */
app.get('/api/games/:gameId', (req, res) => {
  try {
    const { gameId } = req.params;
    const metadata = gameManager.getGameMetadata(gameId);

    if (!metadata) {
      res.status(404).json({
        success: false,
        error: 'Game not found'
      });
      return;
    }

    const gameState = gameManager.getGameState(gameId);

    res.json({
      success: true,
      metadata,
      gameState
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get game info'
    });
  }
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

/**
 * Error handler
 */
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔═══════════════════════════════════════════════════╗');
  console.log('║                                                   ║');
  console.log('║        🎮  Code2027 Game Server v2.0  🎮         ║');
  console.log('║                                                   ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log('║                                                   ║');
  console.log(`║  ✅ Server running on port ${PORT}                  ║`);
  console.log(`║  🌐 CORS enabled for: ${CORS_ORIGIN.padEnd(25)} ║`);
  console.log('║  🔌 WebSocket ready for connections               ║');
  console.log('║  📊 Multi-game support active                     ║');
  console.log('║                                                   ║');
  console.log('╠═══════════════════════════════════════════════════╣');
  console.log('║  Endpoints:                                       ║');
  console.log('║  • GET  /health           - Health check          ║');
  console.log('║  • GET  /api/stats        - Server statistics     ║');
  console.log('║  • GET  /api/games        - Active games list     ║');
  console.log('║  • GET  /api/games/:id    - Game details          ║');
  console.log('║                                                   ║');
  console.log('║  WebSocket Events:                                ║');
  console.log('║  • game:create    - Create new game               ║');
  console.log('║  • game:join      - Join existing game            ║');
  console.log('║  • game:leave     - Leave game                    ║');
  console.log('║  • game:start     - Start game                    ║');
  console.log('║  • game:action    - Send player action            ║');
  console.log('║  • game:reconnect - Reconnect to game             ║');
  console.log('║                                                   ║');
  console.log('╚═══════════════════════════════════════════════════╝');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⚠️  SIGTERM signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️  SIGINT signal received: closing HTTP server');
  httpServer.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
});

export { app, httpServer, io, gameManager };
