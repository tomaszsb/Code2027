# Smart Layout Adaptation - Implementation Request

> **⚠️ SUPERSEDED**: This document describes the original heartbeat-based implementation that was completed on November 18, 2025 but then **redesigned on November 19, 2025** due to flickering issues.
>
> **Current Implementation**: See `SMART_LAYOUT_ADAPTATION.md` for the active implementation using one-time device detection stored in player state (no heartbeats/polling).
>
> **Status**: ✅ Feature complete with redesigned architecture
>
> **Archived for historical reference only**

---

## Context
The multi-device sync is working perfectly! Users can now connect multiple phones via QR codes and the game state syncs flawlessly across all devices.

**Current Issue**: All devices show the full UI (Progress + Player Panels + Board), which doesn't make sense for the usage pattern:
- Desktop users want to see the **game board and progress**, not individual player panels when those players are on phones
- Mobile users want to see **only their player panel**, not the board/progress (screen real estate)

## Goal: Smart Layout Adaptation

Implement context-aware UI that detects which devices are being used and adapts the layout accordingly:

### Layout Rules:
1. **Single-Screen Mode** (only desktop, no phones):
   - Desktop shows: `[Progress] + [All Player Panels] + [Game Board]` ← Current behavior

2. **Multi-Device Mode** (desktop + phones):
   - **Desktop**: Shows `[Progress] + [Game Board]`, HIDES player panels for any player active on a mobile device
   - **Mobile** (viewing as specific player): Shows `[Player Panel ONLY]`, HIDES Progress and Game Board

## Technical Implementation

### Phase 1: Backend Session Tracking

**File**: `server/server.js`

Add session tracking data structure:
```javascript
// Session tracking
const activeSessions = new Map();
// Structure: playerId → { lastSeen: timestamp, deviceType: 'desktop' | 'mobile', sessionId: string }

const SESSION_TIMEOUT = 10000; // 10 seconds
```

Add new endpoint for heartbeat:
```javascript
app.post('/api/heartbeat', (req, res) => {
  const { playerId, deviceType, sessionId } = req.body;

  if (!playerId || !deviceType) {
    return res.status(400).json({ error: 'Missing playerId or deviceType' });
  }

  // Update session
  activeSessions.set(playerId, {
    lastSeen: Date.now(),
    deviceType: deviceType,
    sessionId: sessionId || `session_${Date.now()}_${Math.random()}`
  });

  // Clean up stale sessions
  cleanupStaleSessions();

  res.json({ success: true });
});

// Get active sessions
app.get('/api/sessions', (req, res) => {
  cleanupStaleSessions();

  const sessions = {};
  activeSessions.forEach((data, playerId) => {
    sessions[playerId] = {
      deviceType: data.deviceType,
      lastSeen: data.lastSeen
    };
  });

  res.json(sessions);
});

function cleanupStaleSessions() {
  const now = Date.now();
  const stalePlayerIds = [];

  activeSessions.forEach((data, playerId) => {
    if (now - data.lastSeen > SESSION_TIMEOUT) {
      stalePlayerIds.push(playerId);
    }
  });

  stalePlayerIds.forEach(id => activeSessions.delete(id));

  if (stalePlayerIds.length > 0) {
    console.log(`🧹 Cleaned up ${stalePlayerIds.length} stale sessions`);
  }
}
```

### Phase 2: Device Type Detection Utility

**New File**: `src/utils/deviceDetection.ts`

```typescript
export type DeviceType = 'mobile' | 'desktop';

export function detectDeviceType(): DeviceType {
  // Check for mobile user agent
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

  // Mobile detection
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }

  // Check for touch screen (tablets, touch laptops)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth < 768;

  if (hasTouch && isSmallScreen) {
    return 'mobile';
  }

  return 'desktop';
}
```

### Phase 3: Frontend Heartbeat Sender

**File**: `src/App.tsx`

Add heartbeat logic alongside the existing polling:

```typescript
import { detectDeviceType } from './utils/deviceDetection';

// Inside App component, add new useEffect for heartbeat
useEffect(() => {
  const deviceType = detectDeviceType();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Determine playerId for heartbeat
  const urlParams = getURLParams();
  const playerId = urlParams.get('playerId');

  // Only send heartbeat if we have a playerId (either from URL or current player)
  const getPlayerIdForHeartbeat = (): string | null => {
    if (playerId) return playerId;

    const gameState = stateService.getGameState();
    if (gameState.currentPlayerId) return gameState.currentPlayerId;

    return null;
  };

  const sendHeartbeat = async () => {
    const activePlayerId = getPlayerIdForHeartbeat();
    if (!activePlayerId) return;

    try {
      const backendURL = getBackendURL();
      await fetch(`${backendURL}/api/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: activePlayerId,
          deviceType,
          sessionId
        })
      });
    } catch (error) {
      // Heartbeat failed, non-critical
    }
  };

  // Send initial heartbeat
  sendHeartbeat();

  // Send heartbeat every 3 seconds
  const heartbeatInterval = setInterval(sendHeartbeat, 3000);

  return () => clearInterval(heartbeatInterval);
}, [stateService]);
```

### Phase 4: Conditional Rendering in GameLayout

**File**: `src/components/GameLayout.tsx`

Fetch session data and use it to conditionally render components:

```typescript
import { useState, useEffect } from 'react';
import { getBackendURL } from '../utils/networkDetection';

interface SessionData {
  [playerId: string]: {
    deviceType: 'mobile' | 'desktop';
    lastSeen: number;
  };
}

export function GameLayout({ viewPlayerId }: GameLayoutProps): JSX.Element {
  const [activeSessions, setActiveSessions] = useState<SessionData>({});

  // Fetch active sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const backendURL = getBackendURL();
        const response = await fetch(`${backendURL}/api/sessions`);
        if (response.ok) {
          const sessions = await response.json();
          setActiveSessions(sessions);
        }
      } catch (error) {
        // Sessions fetch failed, non-critical
      }
    };

    // Fetch immediately
    fetchSessions();

    // Fetch every 5 seconds
    const interval = setInterval(fetchSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  // Determine which player panels to show
  const shouldShowPlayerPanel = (playerId: string): boolean => {
    // If viewing as specific player (mobile mode), don't show any panels in main area
    if (viewPlayerId) return false;

    // Check if this player is active on a mobile device
    const session = activeSessions[playerId];
    if (session && session.deviceType === 'mobile') {
      return false; // Hide this panel, they're viewing on phone
    }

    return true; // Show panel on desktop
  };

  // Determine if we should show Progress/Board
  const showProgressAndBoard = !viewPlayerId; // Hide on mobile player view

  // Rest of component...
  return (
    <div className="game-layout">
      {/* Mobile Player View: Only show player panel */}
      {viewPlayerId && (
        <div className="mobile-player-view">
          {/* Render only the specific player's panel */}
          <PlayerPanel
            player={players.find(p => p.id === viewPlayerId)!}
            gameServices={gameServices}
          />
        </div>
      )}

      {/* Desktop View: Conditional rendering based on sessions */}
      {!viewPlayerId && (
        <>
          {showProgressAndBoard && <ProjectProgress gameServices={gameServices} />}

          <div className="player-panels-container">
            {players.map(player =>
              shouldShowPlayerPanel(player.id) && (
                <PlayerPanel
                  key={player.id}
                  player={player}
                  gameServices={gameServices}
                />
              )
            )}
          </div>

          {showProgressAndBoard && <GameBoard gameServices={gameServices} />}
        </>
      )}
    </div>
  );
}
```

## Implementation Order

1. ✅ **Backend**: Add session tracking + heartbeat endpoint to `server/server.js`
2. ✅ **Utility**: Create `src/utils/deviceDetection.ts`
3. ✅ **Heartbeat**: Add heartbeat sender to `src/App.tsx`
4. ✅ **Layout**: Modify `src/components/GameLayout.tsx` for conditional rendering
5. ✅ **Test**: Verify with desktop + 2 phones

## Testing Checklist

- [ ] Desktop only: Shows full UI (Progress + All Panels + Board)
- [ ] Desktop + 1 phone: Desktop hides that player's panel, phone shows only player panel
- [ ] Desktop + 2 phones: Desktop hides both panels, each phone shows only their panel
- [ ] Sessions expire after 10s of inactivity (close phone browser, desktop should show panel again)

## Notes

- **Non-breaking**: If backend unavailable, falls back to showing all panels (current behavior)
- **Performance**: Heartbeat every 3s, session fetch every 5s (minimal overhead)
- **Security**: Session data is ephemeral, no sensitive info stored
- **Branch**: Work on `claude/server-state-sync-015vguQHiYncpGAGktxqnaPQ`

## Current Project State

- ✅ QR code generation working
- ✅ Multi-device state sync working (500ms debounce, version checking)
- ✅ React hooks violation fixed
- ✅ Backend running on port 3001
- ✅ Frontend on port 3000
- ⚠️ User needs to add port forwarding for 3001 (they have it for 3000 already)

**User Configuration Needed** (they're working on this):
```powershell
netsh interface portproxy add v4tov4 listenport=3001 listenaddress=0.0.0.0 connectport=3001 connectaddress=172.22.135.53
```

Good luck! This is the final piece to make the multi-device experience truly excellent. 🚀
