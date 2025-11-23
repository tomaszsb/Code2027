# Smart Layout Adaptation Feature

## Overview

The Smart Layout Adaptation feature enables a multi-device gaming experience where the UI automatically adapts based on which devices players are using. Device type is detected once when a player connects and stored permanently in their player state.

## How It Works

### Desktop View
- Shows **Project Progress** (top panel)
- Shows **Player Panels** for players using desktop
- Hides player panels for players using mobile devices
- Shows **Game Board** (center/right panel)

### Mobile View
- Shows **ONLY the player panel** for that specific player
- Hides progress tracker and game board for focused mobile experience
- Access via URL parameter: `?playerId=PLAYER_ID` (typically via QR code)

### Device Detection (Simplified Approach)
- **One-time detection**: When a player first connects via QR code URL, their device type is detected
- **Permanent storage**: Device type stored in `player.deviceType` field in game state
- **No polling**: Desktop reads device type directly from player state (no heartbeats or sessions needed)
- **State synchronization**: Multi-device state sync (existing feature) handles updating all clients

## Setup Instructions

### 1. Start the Backend Server

```bash
npm run server
```

This starts the state synchronization server on port 3001.

### 2. Start the Frontend

```bash
npm run dev -- --host
```

This starts the Vite development server on port 3000, accessible on your network.

### 3. Testing Multi-Device

**Desktop Setup:**
- Open in browser: `http://192.168.X.X:3000` (use your network IP)
- Add players and start game
- QR codes will appear for each player

**Mobile Setup (for each player):**
- Scan the QR code for a specific player
- Opens URL like: `http://192.168.X.X:3000?playerId=PLAYER_ID`
- Device type auto-detected and stored in player state
- Mobile shows ONLY that player's panel

**Expected Behavior:**
- Desktop automatically hides panels for players who connected via mobile
- Panel visibility persists (no flickering or timeout issues)
- All devices stay synchronized via state sync

## Architecture

### Backend (`server/server.js`)
- Express server with CORS enabled
- Multi-device state synchronization with version tracking
- Endpoints:
  - `GET /api/gamestate` - Get current game state
  - `POST /api/gamestate` - Update game state
  - `DELETE /api/gamestate` - Clear game state
  - `GET /api/health` - Health check

**Note**: Session tracking endpoints (`/api/heartbeat`, `/api/sessions`) exist but are no longer used.

### Frontend

**Device Detection (`src/utils/deviceDetection.ts`):**
- Detects device type based on user agent and screen size
- Returns 'mobile' or 'desktop'
- Detection happens once when player connects via URL

**One-Time Device Storage (`src/App.tsx`):**
- Checks for `?playerId=XXX` in URL on load
- If present, detects device type and stores in player state
- Uses `stateService.updatePlayer(playerId, { deviceType })`
- State sync propagates update to all connected devices

**Conditional Rendering (`src/components/layout/GameLayout.tsx`):**
- Reads `player.deviceType` directly from player state
- Conditionally renders panels based on stored device types
- Supports two view modes:
  - **Desktop Mode**: Shows panels for desktop players only
  - **Mobile Mode** (`viewPlayerId` set): Shows only specified player panel

**Player Data Type (`src/types/DataTypes.ts`):**
```typescript
export interface Player {
  // ... other fields
  deviceType?: 'mobile' | 'desktop'; // Device type detected when player first connects
}
```

## Configuration

### State Sync Interval

Default: 2 seconds (configured in `src/App.tsx`)

```javascript
const pollInterval = setInterval(async () => {
  // Fetch latest state from server
}, 2000);
```

## Testing Checklist

- [ ] Desktop only: Full UI visible (Progress + All Player Panels + Board)
- [ ] Desktop + 1 phone via QR: Desktop hides that player's panel permanently
- [ ] Desktop + 2 phones via QR: Desktop hides both panels, shows only Progress + Board
- [ ] Refresh desktop: Panels stay hidden (deviceType persisted in state)
- [ ] Mobile view: Shows only player panel, no progress or board
- [ ] Clear game data: Resets all device types
- [ ] No flickering: Panels don't appear/disappear continuously

## Troubleshooting

**Issue: Desktop not hiding mobile panels**
- Check if backend server is running (`npm run server`)
- Check browser console for state sync errors
- Verify `player.deviceType === 'mobile'` in game state
- Check that state sync is working (modify data on one device, verify it appears on other)

**Issue: Mobile showing full UI**
- Ensure URL includes `?playerId=PLAYER_ID` parameter
- Check that player ID exists in game
- Verify `player.deviceType` is being set (check console logs)

**Issue: Panels reappearing after some time**
- This should NOT happen with the new implementation
- If it does, check for errors in state synchronization
- Verify `player.deviceType` is not being cleared

**Issue: Port forwarding (Windows + WSL2)**
- Need to forward ports 3000 and 3001 from Windows to WSL2
- Use PowerShell (Admin): `netsh interface portproxy add v4tov4 listenport=3000 connectaddress=172.22.X.X connectport=3000`
- Replace with your WSL2 IP (get via `ip addr show eth0` in WSL2)

## Architecture Evolution

### Previous Approach (Deprecated)
- Continuous heartbeat polling every 3 seconds
- Backend session tracking with 10-second timeout
- **Problem**: Caused flickering as sessions expired and were recreated
- **Removed**: Heartbeat loop, session polling, timeout logic

### Current Approach (Implemented)
- One-time device detection on initial connection
- Device type stored permanently in player state
- **Advantages**:
  - No polling overhead
  - No flickering issues
  - Simpler architecture
  - State persists across refreshes
  - Leverages existing state sync infrastructure

## Future Enhancements

- ✅ QR code generation for easy mobile access (implemented)
- ✅ Multi-device state synchronization (implemented)
- ✅ Smart layout adaptation (implemented)
- Player authentication and security
- Persistent storage (database instead of in-memory)
- WebSocket support for real-time updates (instead of polling)
- Device preference override (let players choose desktop/mobile view)
