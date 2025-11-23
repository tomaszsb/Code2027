# Multi-Game Server Architecture Design

**Version:** 1.0
**Date:** November 23, 2025
**Status:** Design Phase
**Branch:** `claude/fix-game-tracking-multi-server-01BgH8uq3xk8fnYkMHXB9E3W`

---

## Executive Summary

This document outlines the architectural changes required to transform Code2027 from a single-instance client-side application into a multi-game server system that supports multiple concurrent games across different devices (phones, tablets, desktops).

**Current State:** Single-page React app with no backend
**Target State:** Full-stack application with Express backend, WebSocket communication, and multi-game support

---

## Problem Statement

### Critical Issue
The current architecture has **no game tracking mechanism**. If multiple phones connect to one server:
- No way to distinguish Game A from Game B
- All game state updates collide
- Players from different games interfere with each other
- Singleton service instances share state globally

### 15+ Additional Issues Identified
1. Singleton service architecture (all games share one instance)
2. State listener contamination
3. No player authentication/authorization
4. Race conditions on simultaneous actions
5. No transaction management
6. No reconnection logic
7. No network layer exists
8. No state synchronization strategy
9. No stale state detection
10. No persistence layer
11. No game lifecycle management
12. No security model
13. No scalability architecture
14. Turn synchronization chaos
15. No offline/network partition handling

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer (React)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Phone A    │  │   Phone B    │  │   Phone C    │       │
│  │  (Player 1)  │  │  (Player 2)  │  │  (Player 3)  │       │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                  │                  │               │
│         └──────────────────┼──────────────────┘               │
│                            │ WebSocket (Socket.IO)            │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                    Server Layer (Node/Express)                │
│                            │                                   │
│  ┌────────────────────────▼────────────────────────┐          │
│  │       WebSocket Server (Socket.IO)              │          │
│  │  - Connection management                        │          │
│  │  - Room-based game isolation                    │          │
│  └────────────────┬────────────────────────────────┘          │
│                   │                                            │
│  ┌────────────────▼────────────────────────────────┐          │
│  │       Game Manager Service                      │          │
│  │  - Create/destroy game instances                │          │
│  │  - Route actions to correct game                │          │
│  │  - Lifecycle management                         │          │
│  └────────────────┬────────────────────────────────┘          │
│                   │                                            │
│  ┌────────────────▼────────────────────────────────┐          │
│  │    Game Instance Factory                        │          │
│  │  - Creates isolated service containers          │          │
│  │  - One instance per game                        │          │
│  │  gameId → ServiceContainer mapping              │          │
│  └────────────────┬────────────────────────────────┘          │
│                   │                                            │
│  ┌────────────────▼────────────────────────────────┐          │
│  │  Game Instance (per game)                       │          │
│  │  - StateService (isolated state)                │          │
│  │  - TurnService, CardService, etc.               │          │
│  │  - All services scoped to this game             │          │
│  └────────────────┬────────────────────────────────┘          │
│                   │                                            │
└───────────────────┼────────────────────────────────────────────┘
                    │
┌───────────────────▼────────────────────────────────────────────┐
│                   Persistence Layer                            │
│  ┌──────────────────┐         ┌──────────────────┐            │
│  │   PostgreSQL     │         │      Redis       │            │
│  │  - Game state    │         │  - Sessions      │            │
│  │  - Players       │         │  - Active games  │            │
│  │  - History       │         │  - Pub/Sub       │            │
│  └──────────────────┘         └──────────────────┘            │
└────────────────────────────────────────────────────────────────┘
```

---

## Core Design Decisions

### 1. Game Identity System

**Decision:** Add `gameId` (UUID) to all game-related structures

**Changes Required:**
```typescript
// GameState interface (StateTypes.ts)
export interface GameState {
  gameId: string;              // NEW: Unique game identifier
  sessionToken: string;        // NEW: Server-assigned session
  version: number;             // NEW: For optimistic locking
  lastModified: Date;          // NEW: For stale state detection

  // Existing fields
  players: Player[];
  currentPlayerId: string | null;
  gamePhase: GamePhase;
  // ... rest of existing fields
}

// Player interface (DataTypes.ts)
export interface Player {
  id: string;                  // Existing: Player ID within game
  gameId: string;              // NEW: Which game this player belongs to
  sessionId: string;           // NEW: Player's session token
  deviceId?: string;           // NEW: Optional device identifier

  // Existing fields
  name: string;
  currentSpace: string;
  // ... rest of existing fields
}
```

### 2. Service Architecture: Factory Pattern

**Decision:** Replace singleton services with game-scoped instances

**Before (Current):**
```typescript
// ServiceProvider.tsx - ONE instance for entire app
const stateService = new StateService(dataService);
const turnService = new TurnService(...);
```

**After (Multi-Game):**
```typescript
// GameInstanceFactory.ts
class GameInstanceFactory {
  createGameInstance(gameId: string): IServiceContainer {
    const dataService = new DataService();
    const stateService = new StateService(dataService, gameId);
    const turnService = new TurnService(...);
    // ... create all services with gameId context
    return {
      gameId,
      dataService,
      stateService,
      // ... all services
    };
  }
}

// GameManager.ts
class GameManager {
  private games: Map<string, IServiceContainer> = new Map();

  createGame(): string {
    const gameId = generateUUID();
    const services = this.factory.createGameInstance(gameId);
    this.games.set(gameId, services);
    return gameId;
  }

  getGame(gameId: string): IServiceContainer | null {
    return this.games.get(gameId) || null;
  }
}
```

### 3. Network Protocol: WebSocket with Socket.IO

**Decision:** Use Socket.IO for real-time bidirectional communication

**Event Types:**
```typescript
// Client → Server events
interface ClientEvents {
  'game:create': () => void;
  'game:join': (gameId: string, playerName: string) => void;
  'game:action': (gameId: string, action: PlayerAction) => void;
  'game:leave': (gameId: string) => void;
}

// Server → Client events
interface ServerEvents {
  'game:created': (gameId: string, sessionToken: string) => void;
  'game:joined': (gameData: GameState) => void;
  'game:state': (gameState: GameState) => void;
  'game:error': (error: string) => void;
  'player:joined': (player: Player) => void;
  'player:left': (playerId: string) => void;
}

// Player action structure
interface PlayerAction {
  type: 'ROLL_DICE' | 'MOVE' | 'DRAW_CARD' | 'END_TURN' | ...;
  playerId: string;
  sessionToken: string;        // For authentication
  data?: any;
  timestamp: Date;
}
```

### 4. State Synchronization Strategy

**Decision:** Server-authoritative with optimistic updates

**Flow:**
1. Client performs action optimistically (instant UI update)
2. Send action to server with current state version
3. Server validates action against authoritative state
4. Server applies action if valid
5. Server broadcasts new state to all clients in game room
6. Clients reconcile (accept server state or rollback)

**Conflict Resolution:**
```typescript
interface StateUpdate {
  gameId: string;
  version: number;              // State version number
  previousVersion: number;      // Expected previous version
  changes: GameState;
  timestamp: Date;
}

// Server logic
function applyAction(gameId: string, action: PlayerAction): StateUpdate {
  const game = gameManager.getGame(gameId);
  const currentVersion = game.stateService.getVersion();

  // Optimistic locking check
  if (action.expectedVersion !== currentVersion) {
    throw new ConflictError('Stale state - refresh required');
  }

  // Apply action
  const newState = game.playerActionService.processAction(action);

  // Increment version
  game.stateService.setVersion(currentVersion + 1);

  return {
    gameId,
    version: currentVersion + 1,
    previousVersion: currentVersion,
    changes: newState,
    timestamp: new Date()
  };
}
```

### 5. Authentication & Authorization

**Decision:** Session-based auth with JWT tokens

**Player Session Flow:**
```
1. Client requests to join game
   ↓
2. Server generates JWT session token
   - Payload: { gameId, playerId, deviceId, expiresAt }
   - Secret: Server-side secret key
   ↓
3. Client stores token (localStorage)
   ↓
4. All subsequent actions include token
   ↓
5. Server validates token before processing action
   - Check signature
   - Check expiration
   - Check player is in this game
   - Check it's player's turn (if applicable)
```

**Authorization Checks:**
```typescript
function authorizeAction(
  gameId: string,
  action: PlayerAction,
  sessionToken: string
): void {
  // Verify token
  const decoded = jwt.verify(sessionToken, SECRET_KEY);

  // Check game membership
  if (decoded.gameId !== gameId) {
    throw new UnauthorizedError('Token not valid for this game');
  }

  // Check player ownership
  if (decoded.playerId !== action.playerId) {
    throw new UnauthorizedError('Cannot act for another player');
  }

  // Check turn order
  const game = gameManager.getGame(gameId);
  const currentPlayer = game.stateService.getCurrentPlayerId();

  if (currentPlayer !== action.playerId) {
    throw new UnauthorizedError('Not your turn');
  }
}
```

### 6. Persistence Strategy

**Decision:** Hybrid PostgreSQL + Redis

**PostgreSQL (Durable Storage):**
- Game records (id, created_at, status, winner)
- Player records (id, game_id, name, device_id)
- Game state snapshots (serialized GameState)
- Action log (audit trail of all actions)

**Redis (Fast Access):**
- Active game sessions (gameId → serialized GameState)
- Player sessions (sessionToken → player info)
- Real-time game state (hot data)
- Pub/Sub for multi-server coordination (future)

**Schema:**
```sql
-- PostgreSQL tables
CREATE TABLE games (
  id UUID PRIMARY KEY,
  status VARCHAR(20) NOT NULL,  -- 'setup', 'active', 'completed'
  created_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  winner_id UUID,
  state JSONB NOT NULL
);

CREATE TABLE players (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  name VARCHAR(100) NOT NULL,
  device_id VARCHAR(255),
  session_token VARCHAR(500),
  joined_at TIMESTAMP NOT NULL,
  left_at TIMESTAMP
);

CREATE TABLE game_actions (
  id SERIAL PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  player_id UUID REFERENCES players(id),
  action_type VARCHAR(50) NOT NULL,
  action_data JSONB,
  state_version INTEGER NOT NULL,
  timestamp TIMESTAMP NOT NULL
);

CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_actions_game ON game_actions(game_id);
```

### 7. Reconnection & Session Recovery

**Decision:** Stateful sessions with recovery tokens

**Disconnect Scenarios:**
```typescript
// Scenario A: Temporary network loss
// - Session token still valid
// - Player can reconnect with same token
// - Server resends current game state

socket.on('disconnect', () => {
  // Client: Store session token in localStorage
  localStorage.setItem('gameSession', sessionToken);
});

socket.on('connect', () => {
  // Client: Attempt recovery
  const savedToken = localStorage.getItem('gameSession');
  if (savedToken) {
    socket.emit('game:reconnect', savedToken);
  }
});

// Server: Handle reconnection
socket.on('game:reconnect', (sessionToken) => {
  const session = validateSession(sessionToken);
  if (session && !session.expired) {
    // Rejoin game room
    socket.join(`game:${session.gameId}`);

    // Resend current state
    const game = gameManager.getGame(session.gameId);
    socket.emit('game:state', game.stateService.getGameState());
  } else {
    socket.emit('game:error', 'Session expired');
  }
});
```

### 8. Transaction Management

**Decision:** Service-level transactions with rollback

**Implementation:**
```typescript
class StateService {
  private currentState: GameState;
  private stateHistory: GameState[] = [];  // For rollback

  beginTransaction(): string {
    const txId = generateUUID();
    // Save snapshot for potential rollback
    this.stateHistory.push(deepClone(this.currentState));
    return txId;
  }

  commit(txId: string): void {
    // Transaction successful - clear rollback point
    this.stateHistory.pop();
    this.notifyListeners();
  }

  rollback(txId: string): void {
    // Restore previous state
    const previousState = this.stateHistory.pop();
    if (previousState) {
      this.currentState = previousState;
      this.notifyListeners();
    }
  }
}

// Usage in PlayerActionService
async processAction(action: PlayerAction): Promise<GameState> {
  const txId = this.stateService.beginTransaction();

  try {
    // Multi-step operation
    await this.resourceService.deductMoney(playerId, 100);
    await this.cardService.drawCard(playerId, 'W');
    await this.movementService.movePlayer(playerId, 'NEW-SPACE');

    // All steps succeeded
    this.stateService.commit(txId);
    return this.stateService.getGameState();

  } catch (error) {
    // Any step failed - rollback all
    this.stateService.rollback(txId);
    throw error;
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
**Goal:** Add game tracking without breaking existing functionality

**Tasks:**
1. ✅ Add `gameId`, `version`, `sessionToken` to `GameState`
2. ✅ Add `gameId`, `sessionId` to `Player`
3. ✅ Update `StateService` constructor to accept `gameId`
4. ✅ Create `GameInstanceFactory` class
5. ✅ Update all service constructors to propagate `gameId`
6. ✅ Add version tracking to state updates
7. ✅ Run tests - fix any breaking changes

**Success Criteria:**
- All 617 tests still pass
- GameState has gameId field
- Services are multi-instance ready

### Phase 2: Server Infrastructure (Week 2)
**Goal:** Build basic server with Socket.IO

**Tasks:**
1. Create `/server` directory
2. Set up Express server (`server/index.ts`)
3. Add Socket.IO integration
4. Create `GameManager` service
5. Implement game creation/joining
6. Basic WebSocket event handlers
7. Health check endpoint

**Success Criteria:**
- Server runs on port 3001
- Can create games via WebSocket
- Can join games and receive state

### Phase 3: Authentication & Authorization (Week 2)
**Goal:** Secure game sessions

**Tasks:**
1. Install `jsonwebtoken` package
2. Create JWT generation/validation utilities
3. Add session management to GameManager
4. Implement authorization checks
5. Add session recovery logic

**Success Criteria:**
- Players get session tokens on join
- Actions require valid tokens
- Unauthorized actions rejected

### Phase 4: State Synchronization (Week 3)
**Goal:** Real-time state sync across clients

**Tasks:**
1. Implement optimistic locking
2. Create conflict resolution logic
3. Add state broadcast to game rooms
4. Client-side state reconciliation
5. Handle concurrent action edge cases

**Success Criteria:**
- Multiple clients see same state
- Race conditions detected/resolved
- No state corruption

### Phase 5: Persistence (Week 3)
**Goal:** Save/load games from database

**Tasks:**
1. Set up PostgreSQL database
2. Set up Redis cache
3. Create database schema
4. Implement save game logic
5. Implement load game logic
6. Add periodic auto-save

**Success Criteria:**
- Games survive server restart
- Can load previous games
- Action history persisted

### Phase 6: Reliability (Week 4)
**Goal:** Handle failures gracefully

**Tasks:**
1. Add reconnection logic
2. Session recovery implementation
3. Transaction rollback support
4. Error handling improvements
5. Stale state detection
6. Abandoned game cleanup

**Success Criteria:**
- Players can reconnect
- Failed actions rollback cleanly
- No memory leaks

---

## Migration Strategy

### Backward Compatibility

**Keep existing client working during transition:**

1. **Dual Mode Support:**
```typescript
// Client detects mode
const isMultiGame = !!process.env.REACT_APP_SERVER_URL;

if (isMultiGame) {
  // Use WebSocket client
  const gameClient = new SocketGameClient(serverUrl);
} else {
  // Use existing local ServiceProvider
  const services = createLocalServices();
}
```

2. **Feature Flags:**
```typescript
const FEATURES = {
  MULTI_GAME: false,  // Enable when ready
  PERSISTENCE: false,
  AUTH: false,
};
```

3. **Gradual Rollout:**
- Phase 1: Local mode only (existing behavior)
- Phase 2: Optional server mode (env flag)
- Phase 3: Server mode default
- Phase 4: Remove local mode

---

## Testing Strategy

### Unit Tests
- Service factory creates isolated instances
- GameManager handles multiple games
- State updates increment version
- Authorization checks work correctly

### Integration Tests
- Create game flow (client → server → database)
- Join game flow (multiple clients)
- Action processing (full round trip)
- Reconnection scenarios

### E2E Tests
- Full game on multiple phones (simulated)
- Network failure recovery
- Concurrent action handling
- Session expiration

### Load Tests
- 100 concurrent games
- 1000 concurrent connections
- Action throughput (actions/sec)
- State sync latency

---

## Security Considerations

### Attack Vectors & Mitigations

1. **Unauthorized Game Access**
   - Mitigation: JWT tokens, session validation

2. **Action Injection**
   - Mitigation: Server-side validation, turn checks

3. **State Manipulation**
   - Mitigation: Server-authoritative state

4. **Replay Attacks**
   - Mitigation: Timestamp validation, nonce

5. **DoS via Game Creation**
   - Mitigation: Rate limiting, max games per IP

6. **Cheating (Modified Client)**
   - Mitigation: Server validates all rules

---

## Monitoring & Observability

### Metrics to Track
- Active games count
- Players per game distribution
- Action processing latency
- WebSocket connection count
- Database query times
- State sync latency
- Error rates by type

### Logging
- Game creation/destruction events
- Player join/leave events
- Action audit trail
- Error stack traces
- Performance warnings

---

## Open Questions

1. **Should we support game spectators?** (Watch-only mode)
2. **Max players per game?** (Currently unlimited)
3. **Game timeout/inactivity rules?** (Auto-end after 24h?)
4. **Support game save/export?** (Download game state as file)
5. **Cross-server games?** (Future: distributed system)

---

## Success Metrics

### MVP Success (Phase 1-4)
- ✅ 4 players can play one game across 4 phones
- ✅ State syncs in <100ms
- ✅ No data corruption under normal conditions
- ✅ All existing tests pass

### Production Ready (Phase 1-6)
- ✅ 100 concurrent games supported
- ✅ Games survive server restarts
- ✅ Players can reconnect after disconnect
- ✅ Zero security vulnerabilities
- ✅ 99% uptime

---

## Appendix A: File Structure

```
Code2027/
├── src/                      # Existing client code
│   ├── types/
│   │   ├── StateTypes.ts    # Updated with gameId
│   │   └── DataTypes.ts     # Updated with gameId
│   ├── services/            # Updated for multi-instance
│   └── context/
│       └── ServiceProvider.tsx  # Dual mode support
│
├── server/                   # NEW: Server code
│   ├── index.ts             # Express + Socket.IO server
│   ├── GameManager.ts       # Game lifecycle management
│   ├── GameInstanceFactory.ts  # Service instance creation
│   ├── auth/
│   │   ├── jwt.ts           # Token generation/validation
│   │   └── middleware.ts    # Auth middleware
│   ├── persistence/
│   │   ├── database.ts      # PostgreSQL connection
│   │   ├── redis.ts         # Redis connection
│   │   └── repositories/
│   │       ├── GameRepository.ts
│   │       └── PlayerRepository.ts
│   └── websocket/
│       ├── handlers.ts      # Socket.IO event handlers
│       └── rooms.ts         # Game room management
│
├── tests/
│   ├── server/              # NEW: Server tests
│   │   ├── GameManager.test.ts
│   │   ├── auth.test.ts
│   │   └── integration/
│   └── [existing tests]     # Updated for gameId
│
└── docs/
    └── project/
        └── MULTI_GAME_ARCHITECTURE.md  # This document
```

---

## Appendix B: Dependencies to Add

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.0",
    "socket.io-client": "^4.6.0",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.0",
    "redis": "^4.6.5",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/pg": "^8.10.0",
    "@types/uuid": "^9.0.1"
  }
}
```

---

**Document Status:** APPROVED FOR IMPLEMENTATION
**Next Step:** Begin Phase 1 implementation
