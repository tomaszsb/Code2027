# Smart Layout Adaptation Feature

## Overview

The Smart Layout Adaptation feature enables a multi-device gaming experience where the UI automatically adapts based on which devices players are using.

## How It Works

### Desktop View
- Shows **Project Progress** (top panel)
- Shows **Player Panels** for all players EXCEPT those on mobile devices
- Shows **Game Board** (center/right panel)

### Mobile View
- Shows **ONLY the player panel** for that specific player
- Hides progress tracker and game board for focused mobile experience
- Access via URL parameter: `?playerId=PLAYER_ID`

### Session Tracking
- Backend server tracks active sessions via heartbeat mechanism
- Heartbeats sent every 3 seconds from each client
- Sessions expire after 10 seconds of inactivity
- Desktop automatically hides panels for players on mobile devices

## Setup Instructions

### 1. Start the Backend Server

```bash
npm run server
```

This starts the session tracking server on port 3001.

### 2. Start the Frontend

```bash
npm run dev
```

This starts the Vite development server on port 3000.

### 3. Testing Multi-Device

**Desktop Setup:**
- Open in browser: `http://localhost:3000`
- You'll see all player panels (initially)

**Mobile Setup (for each player):**
- Get the player ID from the game (e.g., "player1", "player2")
- Open in mobile browser: `http://localhost:3000?playerId=PLAYER_ID`
- Mobile will show ONLY that player's panel

**Expected Behavior:**
- Desktop will automatically hide panels for players viewing on mobile
- When a mobile player closes their browser, their panel reappears on desktop after ~10 seconds

## Architecture

### Backend (`server/server.js`)
- Express server with CORS enabled
- Session tracking via Map data structure
- Endpoints:
  - `POST /api/heartbeat` - Receive heartbeat from clients
  - `GET /api/sessions` - Get all active sessions
  - `GET /api/health` - Health check

### Frontend

**Device Detection (`src/utils/deviceDetection.ts`):**
- Detects device type based on user agent and screen size
- Provides backend URL helper function

**Heartbeat Sender (`src/App.tsx`):**
- Sends heartbeat every 3 seconds
- Reports device type and player ID
- Non-blocking (failures don't affect gameplay)

**Conditional Rendering (`src/components/layout/GameLayout.tsx`):**
- Fetches active sessions every 5 seconds
- Conditionally renders panels based on device types
- Supports two view modes:
  - **Desktop Mode**: Shows all panels except mobile players
  - **Mobile Mode**: Shows only specified player panel

## Configuration

### Environment Variables

You can customize the backend URL:

```bash
REACT_APP_BACKEND_URL=http://your-backend-url:3001
```

### Session Timeout

Default: 10 seconds (configurable in `server/server.js`)

```javascript
const SESSION_TIMEOUT = 10000; // milliseconds
```

### Heartbeat Interval

Default: 3 seconds (configurable in `src/App.tsx`)

```javascript
const interval = setInterval(sendHeartbeat, 3000); // milliseconds
```

## Testing Checklist

- [ ] Desktop only: Full UI visible (Progress + All Player Panels + Board)
- [ ] Desktop + 1 phone: Desktop hides that player's panel
- [ ] Desktop + 2 phones: Desktop hides both panels, shows only Progress + Board
- [ ] Close phone browser: Desktop shows panel again after ~10 seconds
- [ ] Mobile view: Shows only player panel, no progress or board

## Troubleshooting

**Issue: Desktop not hiding mobile panels**
- Check if backend server is running (`npm run server`)
- Check browser console for heartbeat/session fetch errors
- Verify player IDs match between devices

**Issue: Mobile showing full UI**
- Ensure URL includes `?playerId=PLAYER_ID` parameter
- Check that player ID exists in game

**Issue: Panels not reappearing after mobile closes**
- Wait 10 seconds for session timeout
- Check backend console for session cleanup logs

## Future Enhancements

- WebSocket support for real-time session updates
- Persistent session storage (Redis/database)
- Player authentication and security
- QR code generation for easy mobile access
- Custom device type detection rules
