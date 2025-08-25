# Data Structure and Architecture

This document outlines the data structure for the Code2027 project, covering both the raw CSV data files and the TypeScript interfaces that define the application's state.

## CSV Data Files

### Location

All raw game data is stored in CSV files located in the `/public/data/CLEAN_FILES/` directory. This location is used by the Vite development server to serve the files statically.

*   `CARDS.csv`: Contains all card definitions, including their type, name, description, effects, cost, duration, and phase restrictions.
*   `DICE_EFFECTS.csv`: Defines the effects that are triggered by dice rolls on certain spaces.
*   `DICE_OUTCOMES.csv`: Maps dice roll results to specific destination spaces.
*   `GAME_CONFIG.csv`: Contains general game configuration and metadata for each space on the board.
*   `MOVEMENT.csv`: Defines the possible moves from each space.
*   `SPACE_CONTENT.csv`: Contains the UI text and story content for each space.
*   `SPACE_EFFECTS.csv`: Defines the effects that are applied when a player lands on a space.

### Data Access

All access to the CSV data is handled by the `DataService`. This service is responsible for fetching, parsing, and caching the data, and it provides a clean and consistent API for the rest of the application to use.

**IMPORTANT:** Never access the CSV files directly. Always go through the `DataService` to ensure that the data is handled correctly.

## TypeScript Data Structures

The following TypeScript interfaces define the core data structures used throughout the application.

### `Card`

```typescript
export interface Card {
  card_id: string;
  card_name: string;
  card_type: 'W' | 'B' | 'E' | 'L' | 'I';
  description: string;
  effects_on_play?: string;
  cost?: number;
  duration?: number;
  phase_restriction?: string;
}
```

*   **`card_id`**: A unique identifier for the card.
*   **`card_name`**: The name of the card.
*   **`card_type`**: The type of the card (W, B, E, L, I).
*   **`description`**: A description of the card's purpose and effect.
*   **`effects_on_play`**: A string describing the card's effect when played.
*   **`cost`**: The cost to play the card.
*   **`duration`**: The number of turns the card remains active after being played.
*   **`phase_restriction`**: The game phase in which the card can be played.

### `ActiveCard`

```typescript
export interface ActiveCard {
  cardId: string;
  expirationTurn: number;
}
```

*   **`cardId`**: The ID of the active card.
*   **`expirationTurn`**: The turn number on which the card will expire.

### `Player`

```typescript
export interface Player {
  id: string;
  name: string;
  currentSpace: string;
  visitType: 'First' | 'Subsequent';
  money: number;
  timeSpent: number;
  color?: string;
  avatar?: string;
  availableCards: {
    W: string[];
    B: string[];
    E: string[];
    L: string[];
    I: string[];
  };
  activeCards: ActiveCard[];
  discardedCards: {
    W: string[];
    B: string[];
    E: string[];
    L: string[];
    I: string[];
  };
  // ... other properties
}
```

*   **`id`**: A unique identifier for the player.
*   **`name`**: The player's name.
*   **`currentSpace`**: The space the player is currently on.
*   **`visitType`**: Whether this is the player's first or subsequent visit to the current space.
*   **`money`**: The player's current amount of money.
*   **`timeSpent`**: The amount of time the player has spent on the project.
*   **`availableCards`**: A collection of the cards in the player's hand.
*   **`activeCards`**: A collection of the cards that the player has played and that are currently active.
*   **`discardedCards`**: A collection of the cards that the player has played and that are no longer active.