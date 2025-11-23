// server/websocket/handlers.ts

import { Server, Socket } from 'socket.io';
import { GameManager } from '../GameManager';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  PlayerActionRequest
} from '../types/ServerTypes';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Set up all WebSocket event handlers for game communication
 */
export function setupSocketHandlers(io: TypedServer, gameManager: GameManager): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Handle game creation
    socket.on('game:create', (playerName, callback) => {
      try {
        console.log(`📝 Create game request from ${playerName}`);

        const result = gameManager.createGame(playerName, socket.id);

        // Store game/player info in socket data
        socket.data.gameId = result.gameId;
        socket.data.playerId = result.playerId;
        socket.data.sessionToken = result.sessionToken;

        // Join the game room
        socket.join(`game:${result.gameId}`);

        console.log(`✅ Game ${result.gameId} created successfully`);

        callback({
          success: true,
          gameId: result.gameId,
          sessionToken: result.sessionToken,
          playerId: result.playerId,
          gameState: result.gameState
        });
      } catch (error) {
        console.error('❌ Error creating game:', error);
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create game'
        });
      }
    });

    // Handle joining a game
    socket.on('game:join', (gameId, playerName, callback) => {
      try {
        console.log(`📝 Join game request: ${playerName} → ${gameId}`);

        const result = gameManager.joinGame(gameId, playerName, socket.id);

        // Store game/player info in socket data
        socket.data.gameId = gameId;
        socket.data.playerId = result.playerId;
        socket.data.sessionToken = result.sessionToken;

        // Join the game room
        socket.join(`game:${gameId}`);

        console.log(`✅ Player ${playerName} joined game ${gameId}`);

        // Notify existing players
        socket.to(`game:${gameId}`).emit('player:joined', {
          playerId: result.playerId,
          playerName,
          color: result.gameState.players.find(p => p.id === result.playerId)?.color,
          avatar: result.gameState.players.find(p => p.id === result.playerId)?.avatar
        });

        callback({
          success: true,
          sessionToken: result.sessionToken,
          playerId: result.playerId,
          gameState: result.gameState
        });
      } catch (error) {
        console.error('❌ Error joining game:', error);
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to join game'
        });
      }
    });

    // Handle leaving a game
    socket.on('game:leave', (gameId, playerId, callback) => {
      try {
        console.log(`📝 Leave game request: ${playerId} ← ${gameId}`);

        const gameState = gameManager.leaveGame(gameId, playerId);
        const player = gameState.players.find(p => p.id === playerId);

        // Leave the game room
        socket.leave(`game:${gameId}`);

        // Clear socket data
        delete socket.data.gameId;
        delete socket.data.playerId;
        delete socket.data.sessionToken;

        // Notify remaining players
        socket.to(`game:${gameId}`).emit('player:left', playerId, player?.name || 'Unknown');

        console.log(`✅ Player ${playerId} left game ${gameId}`);

        callback({
          success: true,
          gameState
        });
      } catch (error) {
        console.error('❌ Error leaving game:', error);
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to leave game'
        });
      }
    });

    // Handle starting a game
    socket.on('game:start', (gameId, callback) => {
      try {
        console.log(`📝 Start game request: ${gameId}`);

        const gameState = gameManager.startGame(gameId);

        // Broadcast to all players in the game
        io.to(`game:${gameId}`).emit('game:started', gameState);

        console.log(`✅ Game ${gameId} started`);

        callback({
          success: true,
          gameState
        });
      } catch (error) {
        console.error('❌ Error starting game:', error);
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start game'
        });
      }
    });

    // Handle player actions
    socket.on('game:action', async (gameId, action: PlayerActionRequest, callback) => {
      try {
        console.log(`📝 Player action: ${action.type} from ${action.playerId} in game ${gameId}`);

        // Validate session token
        const session = gameManager.validateSession(action.sessionToken);
        if (!session) {
          throw new Error('Invalid or expired session');
        }

        if (session.gameId !== gameId) {
          throw new Error('Session does not match game');
        }

        if (session.playerId !== action.playerId) {
          throw new Error('Cannot perform actions for another player');
        }

        // Get game services
        const services = gameManager.getGame(gameId);
        if (!services) {
          throw new Error('Game not found');
        }

        // Check state version for optimistic locking
        const currentVersion = services.stateService.getStateVersion();
        if (action.expectedVersion !== currentVersion) {
          throw new Error(`State conflict - expected version ${action.expectedVersion}, current is ${currentVersion}`);
        }

        // Process action based on type
        let newState;
        switch (action.type) {
          case 'ROLL_DICE':
            newState = await services.turnService.rollDice();
            break;

          case 'END_TURN':
            newState = await services.turnService.endTurn();
            break;

          case 'DRAW_CARD':
            if (!action.data?.cardType) {
              throw new Error('Card type required for draw action');
            }
            newState = await services.cardService.drawCard(action.playerId, action.data.cardType);
            break;

          case 'PLAY_CARD':
            if (!action.data?.cardId) {
              throw new Error('Card ID required for play action');
            }
            newState = await services.cardService.playCard(action.playerId, action.data.cardId);
            break;

          case 'MAKE_CHOICE':
            if (!action.data?.choiceIndex === undefined) {
              throw new Error('Choice index required');
            }
            newState = await services.choiceService.makeChoice(action.data.choiceIndex);
            break;

          case 'MOVE':
            if (!action.data?.destination) {
              throw new Error('Destination required for move action');
            }
            newState = await services.movementService.movePlayer(action.playerId, action.data.destination);
            break;

          default:
            throw new Error(`Unknown action type: ${action.type}`);
        }

        // Broadcast new state to all players in the game
        io.to(`game:${gameId}`).emit('game:state', newState);

        console.log(`✅ Action ${action.type} processed successfully`);

        callback({
          success: true,
          gameState: newState
        });
      } catch (error) {
        console.error('❌ Error processing action:', error);

        // Send error to the requesting client
        socket.emit('game:error', {
          message: error instanceof Error ? error.message : 'Failed to process action',
          code: 'ACTION_ERROR'
        });

        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process action'
        });
      }
    });

    // Handle reconnection
    socket.on('game:reconnect', (sessionToken, callback) => {
      try {
        console.log(`📝 Reconnect request with token: ${sessionToken.substring(0, 20)}...`);

        const session = gameManager.validateSession(sessionToken);
        if (!session) {
          throw new Error('Invalid or expired session');
        }

        // Update socket ID in session
        gameManager.updateSessionSocket(sessionToken, socket.id);

        // Rejoin game room
        socket.join(`game:${session.gameId}`);

        // Restore socket data
        socket.data.gameId = session.gameId;
        socket.data.playerId = session.playerId;
        socket.data.sessionToken = sessionToken;

        // Get current game state
        const gameState = gameManager.getGameState(session.gameId);
        if (!gameState) {
          throw new Error('Game no longer exists');
        }

        console.log(`✅ Player ${session.playerId} reconnected to game ${session.gameId}`);

        callback({
          success: true,
          gameId: session.gameId,
          playerId: session.playerId,
          gameState
        });
      } catch (error) {
        console.error('❌ Error reconnecting:', error);
        callback({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to reconnect'
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      // Note: We don't remove players on disconnect, allowing them to reconnect
      // The cleanup task in GameManager will remove abandoned games after timeout
    });
  });
}
