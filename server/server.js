// server/server.js
// Backend server for Code2027 - Handles session tracking for multi-device support

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Session tracking
const activeSessions = new Map();
const SESSION_TIMEOUT = 10000; // 10 seconds

/**
 * Clean up stale sessions that haven't sent a heartbeat recently
 */
function cleanupStaleSessions() {
  const now = Date.now();
  activeSessions.forEach((data, playerId) => {
    if (now - data.lastSeen > SESSION_TIMEOUT) {
      console.log(`🧹 Removing stale session for player: ${playerId}`);
      activeSessions.delete(playerId);
    }
  });
}

/**
 * Heartbeat endpoint - players send periodic updates about their device type
 * POST /api/heartbeat
 * Body: { playerId: string, deviceType: 'mobile' | 'desktop', sessionId: string }
 */
app.post('/api/heartbeat', (req, res) => {
  const { playerId, deviceType, sessionId } = req.body;

  if (!playerId || !deviceType) {
    return res.status(400).json({ error: 'Missing required fields: playerId and deviceType' });
  }

  activeSessions.set(playerId, {
    lastSeen: Date.now(),
    deviceType,
    sessionId: sessionId || `session_${Date.now()}_${Math.random()}`
  });

  console.log(`💓 Heartbeat from ${playerId} (${deviceType})`);
  cleanupStaleSessions();

  res.json({ success: true });
});

/**
 * Get all active sessions
 * GET /api/sessions
 * Returns: { [playerId]: { deviceType: string, lastSeen: number } }
 */
app.get('/api/sessions', (req, res) => {
  cleanupStaleSessions();

  const sessions = {};
  activeSessions.forEach((data, playerId) => {
    sessions[playerId] = {
      deviceType: data.deviceType,
      lastSeen: data.lastSeen
    };
  });

  console.log(`📊 Active sessions: ${Object.keys(sessions).length}`);
  res.json(sessions);
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    activeSessions: activeSessions.size,
    timestamp: Date.now()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Code2027 Backend Server running on port ${PORT}`);
  console.log(`📡 Session tracking enabled (timeout: ${SESSION_TIMEOUT}ms)`);
});
