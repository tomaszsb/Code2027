
### File: `/mnt/d/unravel/current_game/code2026/game/js/components/ActionPanel.js`

*   **`ActionPanel({ isInUnifiedContainer = false })`**: The main React component that acts as the central hub for all player actions during their turn. It manages the state for movement, dice rolls, card actions, and space actions.
*   **`handleDiceRollUpdate(diceState)`**: Updates the panel's state based on input from the `DiceRollSection`.
*   **`handleDiceCompleted()`**: Marks the dice roll action as complete for the current turn.
*   **`handleCardActionsStateChange(cardActionState)`**: Updates the panel's state based on input from the `CardActionsSection`.
*   **`handleCardActionCompleted()`**: Placeholder; turn validation is now handled by `TurnControls`.
*   **`handleSpaceActionsStateChange(spaceActionState)`**: Updates the panel's state based on input from the `SpaceActionsSection`.
*   **`handleSpaceActionCompleted()`**: Placeholder; turn validation is now handled by `TurnControls`.
*   **`handleMovementStateChange(movementState)`**: Updates the panel's state based on input from the `MovementSection`.
*   **`handleMovementCompleted()`**: Placeholder; turn validation is now handled by `TurnControls`.
*   **`handleTurnControlsStateChange(turnControlsState)`**: Updates the panel's state based on input from the `TurnControls` component.
*   **`showRulesModal()`**: Sets the state to display the game rules modal.
*   **`hideRulesModal()`**: Sets the state to hide the game rules modal.
*   **`useEventListener('diceRequired', ...)`**: Event listener that updates the UI to show a dice roll is needed.
*   **`useEventListener('negotiationAvailable', ...)`**: Event listener that updates the UI to show negotiation options.
*   **`useEventListener('showDiceRoll', ...)`**: Event listener that shows the dice roll UI for the current player.
*   **`useEventListener('turnStarted', ...)`**: Event listener that resets the panel's state at the start of a new turn.
*   **`useEventListener('turnAdvanced', ...)`**: Event listener that resets dice-related UI when the turn advances to the next player.
*   **`useEventListener('spaceActionCompleted', ...)`**: Event listener that marks a space action as completed for the turn.
*   **`useEffect(...)`**: A React hook that recalculates available moves and actions whenever the player's position changes.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/AdvancedCardManager.js`

*   **`AdvancedCardManager()`**: The main React component for managing a sophisticated card system, including combos and chain effects.
*   **`useEventListener('cardDrawn', ...)`**: Event listener that processes card effects and checks for combo opportunities when a card is drawn.
*   **`useEventListener('cardPlayed', ...)`**: Event listener that processes card effects, executes combos, and handles chain effects when a card is played.
*   **`processCardEffects(card, player, isPlayed)`**: Applies the monetary and time effects of a single card to a player.
*   **`checkComboOpportunities(triggerCard, player)`**: Checks if the last card drawn or played creates any combo opportunities with other recent cards.
*   **`addToRecentCards(card, player)`**: Adds a card to a player's recent card history for combo tracking.
*   **`findComboOpportunities(triggerCard, player)`**: Identifies potential card combos based on the player's hand and recent card history.
*   **`executeCardCombo(triggerCard, player)`**: Activates the first available card combo and applies its effects.
*   **`applyComboEffects(combo, player)`**: Applies the bonus effects (money, time, etc.) of a completed combo to the player.
*   **`recordComboExecution(combo, player)`**: Logs a completed combo to the player's history and the game state.
*   **`processChainEffects(card, player)`**: Processes sequential card benefits (e.g., playing multiple "Phase" cards in a row).
*   **`calculateChainBonus(card, player)`**: Determines the bonus for a chain of related cards.
*   **`applyChainEffects(chainBonus, player, triggerCard)`**: Applies the effects of a completed card chain.
*   **`getCardTypeName(cardType)`**: Returns the human-readable name for a card type (e.g., 'W' -> 'Work').
*   **`useEffect(...)`**: A React hook that exposes the manager's methods globally so other components can access them.
*   **`renderComboOpportunities()`**: Renders a UI element to notify the player of available combo opportunities.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/AdvancedDiceManager.js`

*   **`AdvancedDiceManager()`**: The main React component for a sophisticated dice system with conditional outcomes based on CSV data.
*   **`useEventListener('rollDiceRequest', ...)`**: Event listener that initiates a dice roll.
*   **`useEventListener('playerMoved', ...)`**: Event listener that checks if the player's new space requires a dice roll.
*   **`performDiceRoll(playerId, spaceName, visitType, options)`**: The core function to perform a dice roll, generate a value, and process the outcomes from CSV data.
*   **`simulateDiceAnimation()`**: Simulates a visual dice rolling animation.
*   **`processRollOutcomes(spaceName, visitType, rollValue, options)`**: Determines the results of a dice roll by looking up the outcome in the `DICE_OUTCOMES.csv` and `DICE_EFFECTS.csv` files.
*   **`parseMovementOptions(movementText)`**: Parses text from the CSV to determine possible player movements (e.g., "Move to SPACE-A or SPACE-B").
*   **`parseCardDrawOutcome(cardDrawText, rollValue)`**: Parses text from the CSV to determine how many and what type of cards to draw.
*   **`parseMoneyEffect(moneyText, rollValue)`**: Parses text from the CSV to determine monetary gains or losses.
*   **`parseTimeEffect(timeText, rollValue)`**: Parses text from the CSV to determine time gains or losses.
*   **`parseConditionalRequirement(conditionalText, rollValue)`**: Parses conditional outcomes from the CSV (e.g., "If roll >= 4: Draw W card").
*   **`processOutcomeEffects(outcomes, playerId, rollRecord)`**: Applies all the determined effects (movement, cards, money, time) to the player.
*   **`handleMovementOutcome(outcome, player)`**: Executes player movement based on the dice roll outcome.
*   **`handleCardDrawOutcome(outcome, player)`**: Initiates a card draw based on the dice roll outcome.
*   **`handleMoneyOutcome(outcome, player)`**: Updates the player's money based on the dice roll outcome.
*   **`handleTimeOutcome(outcome, player)`**: Updates the player's time based on the dice roll outcome.
*   **`handleConditionalOutcome(outcome, player)`**: Applies effects for conditional outcomes that have been met.
*   **`showOutcomeFeedback(outcomes, rollRecord)`**: Displays a summary of the dice roll results to the player.
*   **`checkDiceRequirements(player)`**: Checks if the player's current space requires a dice roll.
*   **`useEffect(...)`**: A React hook that exposes the manager's methods globally.
*   **`handleCloseDice()`**: Hides the dice display UI.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/BoardRenderer.js`

*   **`VisualBoard({ gameState, onSpaceClick, ... })`**: The main React component responsible for rendering the visual game board layout. It arranges spaces in a snake-like flow and manages the display of player positions and available moves.
*   **`useEffect(...)`**: A React hook that loads and merges data from `GAME_CONFIG.csv` and `SPACE_CONTENT.csv` to build the complete list of board spaces when the component first loads.
*   **`handleSpaceMouseEnter(spaceName)`**: An event handler that highlights potential moves from a space when the user hovers over it, providing interactive feedback.
*   **`handleSpaceMouseLeave()`**: An event handler that removes the move highlighting when the user's mouse leaves a space.
*   **`BoardSpace({ space, players, ... })`**: A React component that renders a single, individual space on the board. It displays the space's name, phase, and any players currently on it.
*   **`SpaceDisplay({ spaceName, visitType, ... })`**: A React component that shows a detailed view of a selected space, including its event description, required actions, costs, and potential next moves.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/Card.js`

*   **`Card({ card, onClick, ... })`**: A reusable React component that renders a single, consistently styled game card. It can be configured to show action buttons and display in various sizes.
*   **`getPhaseAccent(phaseRestriction)`**: A helper function that determines the border color for a card based on its phase restriction (e.g., 'DESIGN', 'CONSTRUCTION').
*   **`CardGrid({ cards, onCardClick, ... })`**: A higher-order React component that displays a collection of cards in a grid layout, using the `Card` component for each item.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardAcknowledgmentModal.js`

*   **`CardAcknowledgmentModal({ isVisible, card, ... })`**: A React component that displays a modal dialog to the player when they draw a card with an immediate effect, requiring them to acknowledge it before proceeding.
*   **`useEffect(...)`**: React hooks used to manage the modal's visibility, animations, and to allow closing it with the 'Escape' key.
*   **`handleCardClick()`**: An event handler for clicks on the card displayed within the modal.
*   **`getCardTypeStyle(cardType)`**: A helper function to apply a border style to the modal that matches the type of card being shown.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardActionsSection.js`

*   **`CardActionsSection({ availableCardActions, ... })`**: A React component that displays the card-related actions a player can take on a specific space (e.g., "Draw 1 Work card").
*   **`useEventListener('showCardActions', ...)`**: An event listener that makes the card action buttons visible to the current player.
*   **`handleCardAction(cardType, action, condition)`**: The core function that executes a card action, such as drawing or replacing cards, by emitting events to the `GameStateManager`.
*   **`handleFundingCardDraw()`**: A special handler for the `OWNER-FUND-INITIATION` space that allows the player to draw a funding card (Bank Loan or Investor Loan) based on the project's total scope cost.
*   **`isDiceBasedAction(cardAction)`**: A utility function to check if a card action is dependent on a dice roll.
*   **`isDiceBasedManualActionAvailable(cardAction)`**: A utility function to check if a manual card action that requires a dice roll is currently available to the player.
*   **`shouldShowFundingButton()`**: A utility function that determines whether the special funding card draw button should be visible.
*   **`getFilteredCardActions()`**: A function that filters the list of available card actions based on the current game state, such as whether a dice roll has occurred.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardDisplay.js`

*   **`CardDisplay` (class component)**: A React component for displaying a player's cards. It can render cards in different layouts (e.g., grid) and show a detailed view of a selected card.
*   **`handleCardClick(card)`**: An event handler that updates the component's state to show the details of the clicked card.
*   **`renderCardDetails(card)`**: A helper method that renders the detailed information panel for a selected card, including its full description and effects.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardEffectAnimations.js`

*   **`CardEffectAnimations` (class component)**: A React component dedicated to displaying visual feedback and animations when card effects are triggered.
*   **`handleCardPlayed(data)`**: An event handler that queues an animation when a card is played.
*   **`handleCardEffect(data)`**: An event handler that queues an animation for a specific card effect (e.g., gaining money).
*   **`queueAnimation(animation)`**: Adds an animation to a queue to be processed sequentially.
*   **`processAnimationQueue()`**: Manages the animation queue, ensuring animations play one after another.
*   **`createFloatingMessage(options)`**: Creates a temporary, floating message on the screen to provide feedback to the player (e.g., "+$50,000").
*   **`getEffectIcon(effectType)`**: A helper function that returns an appropriate icon for a given effect type.
*   **`getEffectColor(effectType)`**: A helper function that returns a color associated with a given effect type.
*   **`triggerTestAnimation(type)`**: A debugging function for triggering test animations.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardModal.js`

*   **`CardModal({ selectedCard, isVisible, onClose })`**: A React component that displays a modal dialog with a 3D flip animation to show the details of a selected card.
*   **`getCardTypeIcon(cardType)`**: A helper function to get the icon for a specific card type.
*   **`getCardTypeColor(cardType)`**: A helper function to get the colors associated with a specific card type.
*   **`flipCard()`**: Toggles the CSS-based flip animation of the card in the modal.
*   **`useEffect(...)`**: A React hook that resets the card's flip state whenever the modal is opened or closed.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardPlayInterface.js`

*   **`CardPlayInterface` (class component)**: A React component that provides a drag-and-drop interface for players to play cards from their hand.
*   **`setupDropZones()`**: Defines the valid areas where cards can be dropped, such as the "Play Area" or "Discard Area".
*   **`handleCardMouseDown(card, event)`**: Initiates the drag-and-drop action when a player clicks and holds on a card.
*   **`handleGlobalMouseMove(event)`**: Tracks the mouse movement while a card is being dragged.
*   **`handleGlobalMouseUp(event)`**: Handles the logic when the player releases the mouse button, dropping the card into a zone.
*   **`getValidDropZoneAt(position)`**: Determines if the card is currently over a valid drop zone.
*   **`canDropCardInZone(card, zone)`**: Checks if a specific card type is allowed in a specific drop zone.
*   **`isCardPlayable(card)`**: Checks if a card can be played based on the current game rules and player resources.
*   **`handleCardDrop(card, dropZone)`**: Processes the action when a card is successfully played in a drop zone.
*   **`renderDragGhost()`**: Renders a semi-transparent "ghost" image of the card that follows the cursor during the drag operation.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardReplacementModal.js`

*   **`CardReplacementModal({ gameStateManager })`**: A React component that displays a modal dialog allowing a player to select which cards they want to replace when a "Replace X" action is used.
*   **`useEventListener('showCardReplacementModal', ...)`**: An event listener that shows the modal when a card replacement action is triggered.
*   **`handleCardToggle(cardIndex)`**: Toggles the selection state of a card in the modal.
*   **`handleConfirm()`**: Confirms the player's selection and emits an event to the `GameStateManager` to perform the replacement.
*   **`handleCancel()`**: Closes the modal without performing the replacement action.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardsInHand.js`

*   **`CardsInHand({ player, ... })`**: A React component that displays the cards currently held by the active player.
*   **`useMemo(...)`**: React hooks used to optimize performance by only recalculating the card list when the player's hand actually changes.
*   **`canUseECard(card)`**: A helper function that checks if an "E" (Expeditor) card is usable in the current game phase.
*   **`getCurrentGamePhase()`**: A helper function that returns the current phase of the game based on the player's position on the board.
*   **`handleUseCard(card)`**: Handles the logic for playing an "E" card directly from the player's hand.
*   **`CardsInHandMemo`**: A memoized version of the component to prevent unnecessary re-renders, improving UI performance.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CurrentSpaceInfo.js`

*   **`CurrentSpaceInfo({ player, ... })`**: A React component that displays detailed information about the space the current player is on.
*   **`getCurrentSpaceInfo()`**: A core helper function that gathers all relevant data for the current space from the various CSV files (`SPACE_CONTENT.csv`, `SPACE_EFFECTS.csv`, etc.).
*   **`getContextualEffects(effects)`**: A helper function that formats the time-based effects of a space for a clear and user-friendly display.
*   **`getMovementContext(movement, diceOutcomes)`**: A helper function that determines the next fixed movement destination from the current space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/DiceRenderer.js`

*   **`DiceRenderer({ diceState, onClose })`**: A React component responsible for the visual display and animation of the dice roll. It shows the dice value and the outcome description.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/DiceResultModal.js`

*   **`DiceResultModal({ diceValue, effects, ... })`**: A React component that displays a modal dialog showing the results of a dice roll before the effects are applied, giving the player a clear summary of what will happen.
*   **`getSpecificNoEffectMessage()`**: A helper function that generates a user-friendly message when a dice roll results in no specific effect, based on the CSV data.
*   **`formatEffects()`**: A helper function that formats the list of dice roll effects for display in the modal.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/DiceRoll.js`

*   **`DiceRoll()`**: A React component that handles the core logic for CSV-driven dice rolling.
*   **`useEventListener('showDiceRoll', ...)`**: An event listener that prepares the component for a dice roll when requested by another part of the game.
*   **`rollDice()`**: The main function that simulates the dice roll, looks up the outcome in the `DICE_OUTCOMES.csv` file, and emits an event with the result.
*   **`applyOutcome()`**: Applies the result of the dice roll by emitting an event to the `GameStateManager`.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/DiceRollSection.js`

*   **`DiceRollSection({ diceRequired, ... })`**: A React component that provides the UI and logic for the dice rolling section within the main `ActionPanel`.
*   **`useEventListener('diceRollCompleted', ...)`**: An event listener that notifies the parent component when the dice roll is complete.
*   **`handleDiceRoll()`**: The core function that manages the entire dice roll process, including showing animations, getting the result from CSV data, and displaying the result modal.
*   **`getDiceEffectsPreview()`**: A helper function that shows the player a preview of the possible effects of a dice roll on the current space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/EnhancedPlayerSetup.js`

*   **`EnhancedPlayerSetup({ gameStateManager })`**: A React component that provides a modern, graphical interface for setting up a new game.
*   **`addPlayer()`**: Adds a new player to the game.
*   **`removePlayer(playerId)`**: Removes a player from the game.
*   **`updatePlayer(playerId, property, value)`**: Updates a player's details, such as their name, color, and avatar, while ensuring that colors and avatars remain unique among players.
*   **`startGame()`**: Finalizes the setup and starts the game by sending the player and settings data to the `GameStateManager`.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/FixedApp.js`

*   **`FixedApp({ debugMode, ... })`**: The main, top-level React component for the entire application. It uses the `useGameState` hook to ensure all child components are synchronized with the central game state.
*   **`initializeGame(players, settings)`**: A function to initialize a new game with the provided players and settings.
*   **`GameInterface({ gameState, ... })`**: A sub-component that renders the main game screen, including the player status panels and the game board.
*   **`handleCloseModal()`**: A function to close any currently active modal dialog.
*   **`handleShowDiceResult(...)`**: A function to display the dice result modal.
*   **`closeSpaceExplorer()`**: A function to close the space explorer panel.
*   **`rollDice()`**: A function that initiates a dice roll.
*   **`movePlayer(destination)`**: A function that moves the current player to a new space on the board.
*   **`ErrorBoundary` (class component)**: A special React component that acts as a safety net, catching any JavaScript errors that occur within its child components and displaying a fallback UI instead of crashing the entire application.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameBoard.js`

*   **`GameBoard()`**: The main React component for the game board area. It manages the board's state, such as which spaces are highlighted as available moves, and delegates the actual rendering to other components.
*   **`useEffect(...)`**: A React hook that updates the list of available moves for the current player whenever their position on the board changes.
*   **`handleSpaceClick(spaceName)`**: An event handler that shows detailed information about a clicked space in the `SpaceExplorer` panel but does not move the player.
*   **`handleMovePlayer(spaceName, visitType)`**: A function that contains the logic for moving a player to a new space and then processing any effects associated with that space.
*   **`processSpaceEffects(spaceData, player)`**: A function that applies the effects of a space to a player, such as time costs, fees, or card-related events.
*   **`processCardEffect(effectText, cardType, player)`**: A function that processes an individual card effect that is triggered by landing on a space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameEndScreen.js`

*   **`GameEndScreen({ gameState, ... })`**: A React component that displays the final results and scores when the game has been completed.
*   **`useEventListener('gameCompleted', ...)`**: An event listener that automatically shows the end screen when the game is won.
*   **`restartGame()`**: A function that resets the game state, allowing players to start a new game.
*   **`formatTime(days)`**: A helper function to format the display of time spent during the game (e.g., "10 days").
*   **`formatMoney(amount)`**: A helper function to format currency values for display (e.g., "$1,200,000").

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameInitializer.js`

*   **`GameInitializer()`**: A logic-only React component that handles the initial setup of the game, including the `MovementEngine`.
*   **`useEventListener('movePlayerRequest', ...)`**: An event listener that processes requests to move a player, using the `MovementEngine` to apply space effects correctly.
*   **`useEventListener('spaceReentry', ...)`**: An event listener that handles the logic for when a player re-enters a space, such as after a negotiation, to re-trigger space effects.
*   **`showMovementOptions(playerId, spaceData)`**: A function that displays the available movement options for a player from their current space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameManager.js`

*   **`GameManager({ gameState, ... })`**: A core, logic-only React component that serves as the central controller for the game's state and business logic. It does not render any UI.
*   **`processSpaceEffects(playerId, spaceData)`**: Processes the effects of a space on a player, including time, fees, and card events.
*   **`processCardAction({ playerId, cardType, action })`**: Processes various card actions like drawing, replacing, or removing cards.
*   **`drawCardsForPlayer(playerId, cardType, amount)`**: Handles the logic for a player to draw a specific number of cards of a certain type from the deck.
*   **`replaceCardsForPlayer(playerId, cardType, amount)`**: Initiates the card replacement process by displaying the replacement modal.
*   **`executeCardReplacement(playerId, cardType, cardIndices)`**: Finalizes the replacement of specific cards in a player's hand.
*   **`removeCardsFromPlayer(playerId, cardType, amount)`**: Removes a specified number of cards from a player's hand.
*   **`processDiceOutcome({ playerId, outcome, ... })`**: Processes the result of a dice roll, which can trigger card actions, movement, or other effects.
*   **`giveCardToPlayer(playerId, cardId)`**: A global debug function to give a specific card to a player for testing purposes.
*   **`showGameState()`**: A global debug function that logs the entire current game state to the console for inspection.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GamePanelLayout.js`

*   **`GamePanelLayout({ debugMode })`**: A React component that creates a modern, responsive three-panel layout for the main game interface, adapting for both mobile and desktop screens.
*   **`useEffect(...)`**: A React hook that listens for window resize events to switch between mobile and desktop layouts.
*   **`togglePanel(panel)`**: A function to expand or collapse the side panels in the desktop view.
*   **`setActiveTab(tab)`**: A function that switches between the "Status", "Actions", and "Results" tabs in the mobile view.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameSaveManager.js`

*   **`GameSaveManager({ gameState, ... })`**: A logic-only React component that manages saving and loading the game state using the browser's `localStorage`.
*   **`autoSaveGame()`**: Automatically saves the current game state at regular intervals.
*   **`saveGame(slotName)`**: Manually saves the current game state to a named slot.
*   **`loadGame(saveId)`**: Loads a game from a specific save slot.
*   **`loadAutoSave()`**: Loads the most recent auto-saved game.
*   **`createSaveData()`**: Creates a data object from the current game state that can be saved.
*   **`deleteSave(saveId)`**: Deletes a specific save slot.
*   **`exportSave(saveId)`**: Allows the user to download a save file to their computer.
*   **`importSave(fileData)`**: Allows the user to load a game from a save file on their computer.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameTimer.js`

*   **`GameTimer()`**: A React component that tracks and displays the total elapsed game time and the current session duration.
*   **`useEventListener(...)`**: Event listeners that automatically start, pause, and reset the timer based on game events like "gameStarted" or "gameCompleted".
*   **`formatDuration(milliseconds)`**: A helper function to format the time into a human-readable string (e.g., "01:23:45").
*   **`getAverageTurnTime()`**: Calculates and displays the average time players are taking for each turn.
*   **`checkTimeWarnings()`**: Monitors the game duration and displays warnings if the session is running long.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/HandManager.js`

*   **`HandManager` (class component)**: A React component for managing and organizing the player's hand of cards.
*   **`sortCards(sortBy)`**: Sorts the cards in the player's hand based on criteria like type, name, or cost.
*   **`filterCards(filterBy)`**: Filters the cards to show only a specific type.
*   **`groupCards(groupBy)`**: Groups the cards in the hand based on criteria like type or cost.
*   **`handleBulkAction(action)`**: Performs a bulk action, such as discarding, on multiple selected cards at once.
*   **`organizeSelectedCards()`**: Automatically organizes the selected cards based on a predefined play strategy.
*   **`checkHandLimit()`**: Checks if the player is holding more cards than the hand limit allows.
*   **`renderControlPanel()`**: Renders the UI panel with controls for sorting, filtering, and viewing the cards.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/InteractiveFeedback.js`

*   **`InteractiveFeedback()`**: A React component that provides a system for professional UI notifications, such as "toast" pop-ups and loading indicators.
*   **`showToast(message, type, duration)`**: Displays a temporary "toast" notification on the screen.
*   **`success(message, duration)`**: A convenience method to show a success-themed toast.
*   **`warning(message, duration)`**: A convenience method to show a warning-themed toast.
*   **`error(message, duration)`**: A convenience method to show an error-themed toast.
*   **`info(message, duration)`**: A convenience method to show an info-themed toast.
*   **`showLoading(elementId, text)`**: Displays a loading spinner on a specific UI element.
*   **`hideLoading(loadingId)`**: Hides a loading spinner.
*   **`addRippleEffect(event)`**: Adds a visual ripple effect to buttons when they are clicked.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/LoadingAndErrorHandler.js`

*   **`LoadingAndErrorHandler()`**: A React component that provides a centralized system for handling loading states and error messages throughout the application.
*   **`useEventListener(...)`**: Event listeners that automatically show or hide loading screens and error dialogs based on game events.
*   **`addNotification(notification)`**: Adds a notification message to be displayed to the user.
*   **`retryAction()`**: Allows the user to retry an action that previously resulted in an error.
*   **`dismissError()`**: Allows the user to dismiss an error message.
*   **`LoadingOverlay()`**: A sub-component that renders the full-screen loading overlay.
*   **`ErrorModal()`**: A sub-component that renders the error message modal.
*   **`NotificationContainer()`**: A sub-component that renders the list of notifications.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/LoadingScreen.js`

*   **`LoadingScreen({ message, progress })`**: A React component that displays a loading screen with a message and a progress bar.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/LogicSpaceManager.js`

*   **`LogicSpaceManager()`**: A logic-only React component that handles the logic for "Logic" spaces on the board, where players have to make decisions.
*   **`useEventListener('playerMoved', ...)`**: An event listener that checks if a player has moved to a Logic space and, if so, presents them with a decision.
*   **`presentDecision(player, spaceData)`**: Presents a decision to the player, including the options and a confirmation button.
*   **`handleDecision(player, spaceData, decision)`**: Handles the player's decision, updating the game state and applying any consequences.
*   **`getDecisionConsequences(spaceData, decision)`**: Gets the consequences of a decision from the `SPACE_EFFECTS.csv` file.
*   **`applyConsequences(player, consequences)`**: Applies the consequences of a decision to the player.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/MovementSection.js`

*   **`MovementSection({ currentPlayer, ... })`**: A React component that displays the available moves for the current player and handles the movement action.
*   **`handleMoveSelect(spaceName)`**: Handles the selection of a move.
*   **`handleMoveExecute()`**: Executes the selected move, moving the player to the new space.
*   **`getMovementType(spaceName)`**: A helper function to get the type of movement for a given space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PathVisualizer.js`

*   **`PathVisualizer({ gameState, currentPlayer, availableMoves, boardState, explorationPath })`**: A React component that draws arrows on the game board to visualize the possible movement paths for the current player.
*   **`useEffect(...)`**: A React hook that redraws the arrows whenever the player's position or the available moves change.
*   **`drawArrow(sourceElement, destElement, isExploration)`**: A function that draws a single arrow between two spaces on the board.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerHeader.js`

*   **`PlayerHeader({ player, isCurrentPlayer })`**: A React component that displays the header for a player's status panel, including their name, avatar, and a turn indicator.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerInfo.js`

*   **`PlayerInfo({ player })`**: A React component that displays the main information for a player, such as their current position and any status effects.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerMovementVisualizer.js`

*   **`PlayerMovementVisualizer()`**: A React component that visualizes the player's movement on the board, for example, by animating the player marker from one space to another.
*   **`useEventListener('playerMoved', ...)`**: An event listener that triggers the movement animation when a player moves.
*   **`animateMovement(player, fromSpace, toSpace)`**: A function that performs the animation of the player marker.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerResources.js`

*   **`PlayerResources({ player })`**: A React component that displays a player's resources, such as their money and time.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerStatusPanel.js`

*   **`PlayerStatusPanel({ debugMode = false })`**: A React component that serves as a container for all the player status components, such as `PlayerHeader`, `PlayerInfo`, `PlayerResources`, and `CardsInHand`.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/ResultsPanel.js`

*   **`ResultsPanel()`**: A React component that displays the results of the game, including the winner and the final scores. It also provides a space for future logging functionality.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/RulesContent.js`

*   **`RulesContent({ rulesData })`**: A React component that renders the detailed content of the game's rules inside the `RulesModal`. It fetches the rules text from the provided `rulesData` prop, which is originally from the `SPACE_CONTENT.csv` file.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/RulesModal.js`

*   **`RulesModal({ show, onClose })`**: A React component that displays a modal dialog containing the game's rules.
*   **`getRulesData()`**: A helper function that retrieves the rules data from the `CSVDatabase`.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/SpaceActionsSection.js`

*   **`SpaceActionsSection({ currentPlayer, ... })`**: A React component that displays and handles actions specific to a particular space, derived from the "Outcome" field in the `SPACE_CONTENT.csv` file (e.g., "Take Owner Money: $2M").
*   **`useEffect(...)`**: A React hook that parses the available space actions whenever the player lands on a new space.
*   **`parseSpaceActions(outcomeText)`**: A function that reads the "Outcome" text from the CSV and converts it into a list of actionable buttons.
*   **`parseMoneyAmount(amountText)`**: A helper function to parse formatted money strings (e.g., "$2M", "500K") into numerical values.
*   **`handleSpaceAction(action)`**: An event handler that executes a space-specific action, such as giving the player money.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/SpaceChoice.js`

*   **`SpaceChoice()`**: A React component that provides a UI for the player to choose their next move when multiple options are available.
*   **`useEventListener('showSpaceChoice', ...)`**: An event listener that displays the space choice UI when a player has multiple movement options.
*   **`selectSpace(spaceName)`**: An event handler for when the player selects a destination.
*   **`confirmSelection()`**: An event handler that confirms the selected destination and moves the player.
*   **`useEffect(...)`**: A React hook that automatically selects a destination if there is only one option available.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/SpaceExplorer.js`

*   **`getPhaseColor(phase)`**: A helper function that returns a color associated with a specific game phase.
*   **`SpaceExplorer()`**: A React component that serves as an interactive panel for displaying detailed information about any space on the board clicked by the user.
*   **`useEventListener('spaceSelected', ...)`**: An event listener that updates the explorer with the data of the currently selected space.
*   **`clearSelection()`**: Clears the selected space and hides the detailed view.
*   **`exploreSpace(spaceName)`**: Allows the user to navigate to and view the details of a related space from within the explorer.
*   **`SpaceDetails({ spaceName, ... })`**: A sub-component that renders the detailed information for a selected space, including its events, actions, and outcomes.
*   **`DiceOutcomes({ spaceName, ... })`**: A sub-component that displays a table of all possible dice roll outcomes for a given space.
*   **`getCardTypeIcon(type)`**: A helper function that returns an icon for a specific card type.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/TooltipSystem.js`

*   **`TooltipSystem()`**: A React component that provides a system for displaying context-sensitive help tooltips throughout the application.
*   **`useEffect(...)`**: A React hook that sets up the tooltip configurations and global event listeners for mouse movements and keyboard presses.
*   **`findTooltipConfig(element)`**: A function that finds the appropriate tooltip configuration for a given UI element.
*   **`calculatePosition(element, config)`**: A function that calculates the optimal position for the tooltip on the screen.
*   **`showTooltip(element, config)`**: Displays a tooltip with the specified content and position.
*   **`hideTooltip()`**: Hides the currently visible tooltip.
*   **`handleMouseEnter(event)`**: An event handler that shows a tooltip when the user hovers the mouse over an element.
*   **`handleMouseLeave(event)`**: An event handler that hides the tooltip when the user's mouse leaves an element.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/TurnControls.js`

*   **`TurnControls({ currentPlayer, ... })`**: A React component that displays the primary controls for managing a player's turn, such as the "End Turn" and "Negotiate" buttons.
*   **`getNegotiateStatus()`**: A function that determines if the "Negotiate" button should be hidden, disabled, or enabled based on the current game state.
*   **`handleNegotiate()`**: Handles the negotiation action, which typically applies a penalty and allows the player to retry their turn on a space.
*   **`handleEndTurn()`**: Handles the logic for ending a player's turn, which includes automatically moving the player if they have a single, fixed destination.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/WinConditionManager.js`

*   **`WinConditionManager({ gameState, ... })`**: A logic-only React component that checks if the game's win conditions have been met.
*   **`useEventListener('playerMoved', ...)`**: An event listener that checks for a win condition every time a player moves.
*   **`checkWinCondition(player, spaceName)`**: Checks if a player has won by landing on the "FINISH" space.
*   **`handleGameWin(winner)`**: Handles the game completion logic, including calculating the final scores for all players.
*   **`calculateFinalScores()`**: Calculates the final scores based on each player's remaining money and total time spent.
*   **`checkGameEndConditions()`**: Checks for other game-ending conditions, such as a player exceeding a time limit.

### File: `/mnt/d/unravel/current_game/code2026/game/js/config.js`

*   This file contains a single global configuration object, `window.gameConfig`, with a `fallbackMoves` property used as a default move if no other moves are available.

### File: `/mnt/d/unravel/current_game/code2026/game/js/data/CSVDatabase.js`

*   **`CSVDatabase` (class)**: A class that handles loading, parsing, and providing access to all the game's data from the various CSV files.
*   **`loadAll()`**: Asynchronously loads all the game's CSV data files.
*   **`saveToCache()`**: Saves the loaded CSV data to the browser's `localStorage` to speed up future page loads.
*   **`loadFromCache()`**: Loads the CSV data from the local cache if it is available and not expired.
*   **`loadMovement()`, `loadDiceOutcomes()`, etc.**: Individual methods for loading each of the specific CSV files.
*   **`parseCSV(csvText)`**: A method that uses the Papa Parse library to parse CSV text into an array of JavaScript objects.
*   **`movement`, `spaceEffects`, etc. (getters)**: A series of getters that provide a clean and consistent API for querying the data from each of the loaded CSV files.
*   **`getStatus()`**: Returns an object containing the status of the database, including whether the data has been loaded and the number of records in each file.

### File: `/mnt/d/unravel/current_game/code2026/game/js/data/GameStateManager.js`

*   **`useGameState()`**: A custom React hook that allows any component to access the central game state and the `GameStateManager` instance.
*   **`GameStateProvider({ children })`**: A React component that uses the Context API to provide the game state to all of its descendant components.
*   **`GameStateManager` (class)**: A central class that manages the entire state of the game. It holds the player data, turn information, and game phase, and it acts as an event emitter for all game events.
*   **`initializeGame(players, settings)`**: Sets up a new game with the specified players and settings.
*   **`setState(newState)`**: Updates the game state and notifies all listening components of the change.
*   **`on(eventName, listener)`**: Registers a listener function to be called when a specific game event occurs.
*   **`off(eventName, listener)`**: Removes a previously registered event listener.
*   **`emit(eventName, payload)`**: Fires a game event, calling all registered listeners for that event.
*   **`movePlayer(playerId, spaceName, visitType)`**: Moves a player to a new space on the board.
*   **`nextTurn()`**: Advances the game to the next player's turn.
*   **`updatePlayerMoney(playerId, amount, reason)`**: Updates a player's money by a given amount.
*   **`updatePlayerTime(playerId, amount, reason)`**: Updates a player's time spent by a given amount.
*   **`addCardsToPlayer(playerId, cardType, cards)`**: Adds one or more cards to a player's hand.
*   **`removeCardFromPlayer(playerId, cardId)`**: Removes a specific card from a player's hand.
*   **`usePlayerCard(playerId, cardId)`**: Handles the logic for a player using a card from their hand, including applying its effects.
*   **`savePlayerSnapshot(playerId)`**: Saves a copy of a player's current state, used for actions like negotiation.
*   **`restorePlayerSnapshot(playerId)`**: Restores a player's state to a previously saved snapshot.
*   **`movePlayerWithEffects(playerId, destination, visitType)`**: A comprehensive function that moves a player and applies all the effects of the destination space.
*   **`triggerFundingCardDraw(playerId)`**: A special function that handles the logic for drawing a funding card at the `OWNER-FUND-INITIATION` space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/utils/AccessibilityUtils.js`

*   **`AccessibilityUtils` (object)**: A utility object containing functions to improve the accessibility of the game for players using screen readers.
*   **`announceToScreenReader(message, politeness)`**: A function that uses ARIA live regions to announce a message to screen readers.
*   **`focusOnElement(elementOrSelector)`**: A function that programmatically sets the focus on a specific UI element.
*   **`gameAnnouncements` (object)**: A collection of functions for announcing specific game events, such as player movement, turn changes, and card draws.

### File: `/mnt/d/unravel/current_game/code2026/game/js/utils/CardUtils.js`

*   **`CardUtils` (object)**: A utility object containing helper functions for working with game cards.
*   **`getCardTypeConfig(cardType)`**: Returns the configuration for a specific card type, including its name, icon, and colors.
*   **`getCardEffectDescription(card)`**: Generates a human-readable description of a card's effects.
*   **`formatCardValue(card)`**: Formats a card's value (e.g., money cost, loan amount) for display.
*   **`sortCardsByType(cards)`**: Sorts a list of cards based on their type.
*   **`getAllCardTypes()`**: Returns an array of all possible card types in the game.

### File: `/mnt/d/unravel/current_game/code2026/game/js/utils/ComponentUtils.js`

*   **`ComponentUtils` (object)**: A utility object containing helper functions used by various React components.
*   **`getNextSpaces(spaceName, visitType)`**: Determines the next possible spaces a player can move to from a given space.
*   **`getCardTypes(spaceName, visitType, ...)`**: Gets the types of cards that can be drawn on a specific space.
*   **`requiresDiceRoll(spaceName, visitType)`**: Checks if a given space requires a dice roll.
*   **`parseFeeAmount(feeText)`**: Parses a fee amount from a string (e.g., "$1.5M").
*   **`formatMoney(amount)`**: Formats a number into a currency string (e.g., "$1,500,000").
*   **`parseCardAction(actionText)`**: Parses a card action string (e.g., "Draw 2") to determine the action type and amount.

### File: `/mnt/d/unravel/current_game/code2026/game/js/utils/ContentEngine.js`

*   **`ContentEngine` (class)**: A class designed to manage and retrieve all text-based content for the game, such as the descriptions for events, actions, and outcomes.
*   **`getSpaceContent(spaceName, visitType)`**: Retrieves the content for a specific space from the `SPACE_CONTENT.csv` file.
*   **`getCardContent(cardId)`**: Retrieves the content for a specific card from the `cards.csv` file.
*   **`getUIContent(elementId)`**: Retrieves content for a specific UI element, intended for a more dynamic content system.

### File: `/mnt/d/unravel/current_game/code2026/game/js/utils/EffectsEngine.js`

*   **`EffectsEngine` (object)**: A utility object that contains the core logic for applying the various effects in the game, such as those from spaces, cards, and dice rolls.
*   **`initialize(csvDatabase)`**: Initializes the engine with the game's CSV data.
*   **`applySpaceEffects(player, spaceData, ...)`**: Applies the effects of a specific space to a player.
*   **`applyCardEffect(player, card, ...)`**: Applies the effects of a specific card to a player.
*   **`applyDiceEffect(player, diceEffect, ...)`**: Applies the effects of a dice roll to a player.
*   **`getCardActionsForSpace(spaceName, visitType)`**: Retrieves the card actions that are available on a specific space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/utils/MovementEngine.js`

*   **`MovementEngine` (class)**: A singleton class that handles all logic related to player movement on the game board.
*   **`getInstance()`**: A static method that ensures only one instance of the `MovementEngine` is created.
*   **`initialize(gameStateManager)`**: Initializes the engine with the `GameStateManager`.
*   **`getAvailableMoves(player)`**: Calculates and returns the list of available moves for a player from their current position.
*   **`getVisitType(player, destination)`**: Determines if a player's move to a destination space will be a "First" or "Subsequent" visit.
*   **`applySpaceEffects(player, spaceData, visitType)`**: Applies the effects of a space to a player after they have moved.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/RulesContent.js`

*   **`RulesContent({ rulesData })`**: A React component that renders the detailed content of the game's rules inside the `RulesModal`. It fetches the rules text from the provided `rulesData` prop, which is originally from the `SPACE_CONTENT.csv` file.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/RulesModal.js`

*   **`RulesModal({ show, onClose })`**: A React component that displays a modal dialog containing the game's rules.
*   **`getRulesData()`**: A helper function that retrieves the rules data from the `CSVDatabase`.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/SpaceActionsSection.js`

*   **`SpaceActionsSection({ currentPlayer, ... })`**: A React component that displays and handles actions specific to a particular space, derived from the "Outcome" field in the `SPACE_CONTENT.csv` file (e.g., "Take Owner Money: $2M").
*   **`useEffect(...)`**: A React hook that parses the available space actions whenever the player lands on a new space.
*   **`parseSpaceActions(outcomeText)`**: A function that reads the "Outcome" text from the CSV and converts it into a list of actionable buttons.
*   **`parseMoneyAmount(amountText)`**: A helper function to parse formatted money strings (e.g., "$2M", "500K") into numerical values.
*   **`handleSpaceAction(action)`**: An event handler that executes a space-specific action, such as giving the player money.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/SpaceChoice.js`

*   **`SpaceChoice()`**: A React component that provides a UI for the player to choose their next move when multiple options are available.
*   **`useEventListener('showSpaceChoice', ...)`**: An event listener that displays the space choice UI when a player has multiple movement options.
*   **`selectSpace(spaceName)`**: An event handler for when the player selects a destination.
*   **`confirmSelection()`**: An event handler that confirms the selected destination and moves the player.
*   **`useEffect(...)`**: A React hook that automatically selects a destination if there is only one option available.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/SpaceExplorer.js`

*   **`getPhaseColor(phase)`**: A helper function that returns a color associated with a specific game phase.
*   **`SpaceExplorer()`**: A React component that serves as an interactive panel for displaying detailed information about any space on the board clicked by the user.
*   **`useEventListener('spaceSelected', ...)`**: An event listener that updates the explorer with the data of the currently selected space.
*   **`clearSelection()`**: Clears the selected space and hides the detailed view.
*   **`exploreSpace(spaceName)`**: Allows the user to navigate to and view the details of a related space from within the explorer.
*   **`SpaceDetails({ spaceName, ... })`**: A sub-component that renders the detailed information for a selected space, including its events, actions, and outcomes.
*   **`DiceOutcomes({ spaceName, ... })`**: A sub-component that displays a table of all possible dice roll outcomes for a given space.
*   **`getCardTypeIcon(type)`**: A helper function that returns an icon for a specific card type.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/TooltipSystem.js`

*   **`TooltipSystem()`**: A React component that provides a system for displaying context-sensitive help tooltips throughout the application.
*   **`useEffect(...)`**: A React hook that sets up the tooltip configurations and global event listeners for mouse movements and keyboard presses.
*   **`findTooltipConfig(element)`**: A function that finds the appropriate tooltip configuration for a given UI element.
*   **`calculatePosition(element, config)`**: A function that calculates the optimal position for the tooltip on the screen.
*   **`showTooltip(element, config)`**: Displays a tooltip with the specified content and position.
*   **`hideTooltip()`**: Hides the currently visible tooltip.
*   **`handleMouseEnter(event)`**: An event handler that shows a tooltip when the user hovers the mouse over an element.
*   **`handleMouseLeave(event)`**: An event handler that hides the tooltip when the user's mouse leaves an element.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/TurnControls.js`

*   **`TurnControls({ currentPlayer, ... })`**: A React component that displays the primary controls for managing a player's turn, such as the "End Turn" and "Negotiate" buttons.
*   **`getNegotiateStatus()`**: A function that determines if the "Negotiate" button should be hidden, disabled, or enabled based on the current game state.
*   **`handleNegotiate()`**: Handles the negotiation action, which typically applies a penalty and allows the player to retry their turn on a space.
*   **`handleEndTurn()`**: Handles the logic for ending a player's turn, which includes automatically moving the player if they have a single, fixed destination.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/WinConditionManager.js`

*   **`WinConditionManager({ gameState, ... })`**: A logic-only React component that checks if the game's win conditions have been met.
*   **`useEventListener('playerMoved', ...)`**: An event listener that checks for a win condition every time a player moves.
*   **`checkWinCondition(player, spaceName)`**: Checks if a player has won by landing on the "FINISH" space.
*   **`handleGameWin(winner)`**: Handles the game completion logic, including calculating the final scores for all players.
*   **`calculateFinalScores()`**: Calculates the final scores based on each player's remaining money and total time spent.
*   **`checkGameEndConditions()`**: Checks for other game-ending conditions, such as a player exceeding a time limit.

### File: `/mnt/d/unravel/current_game/code2026/game/js/config.js`

*   This file contains a single global configuration object, `window.gameConfig`, with a `fallbackMoves` property used as a default move if no other moves are available.

### File: `/mnt/d/unravel/current_game/code2026/game/js/data/CSVDatabase.js`

*   **`CSVDatabase` (class)**: A class that handles loading, parsing, and providing access to all the game's data from the various CSV files.
*   **`loadAll()`**: Asynchronously loads all the game's CSV data files.
*   **`saveToCache()`**: Saves the loaded CSV data to the browser's `localStorage` to speed up future page loads.
*   **`loadFromCache()`**: Loads the CSV data from the local cache if it is available and not expired.
*   **`loadMovement()`, `loadDiceOutcomes()`, etc.**: Individual methods for loading each of the specific CSV files.
*   **`parseCSV(csvText)`**: A method that uses the Papa Parse library to parse CSV text into an array of JavaScript objects.
*   **`movement`, `spaceEffects`, etc. (getters)**: A series of getters that provide a clean and consistent API for querying the data from each of the loaded CSV files.
*   **`getStatus()`**: Returns an object containing the status of the database, including whether the data has been loaded and the number of records in each file.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/LoadingScreen.js`

*   **`LoadingScreen({ message, progress })`**: A React component that displays a loading screen with a message and a progress bar.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/LogicSpaceManager.js`

*   **`LogicSpaceManager()`**: A logic-only React component that handles the logic for "Logic" spaces on the board, where players have to make decisions.
*   **`useEventListener('playerMoved', ...)`**: An event listener that checks if a player has moved to a Logic space and, if so, presents them with a decision.
*   **`presentDecision(player, spaceData)`**: Presents a decision to the player, including the options and a confirmation button.
*   **`handleDecision(player, spaceData, decision)`**: Handles the player's decision, updating the game state and applying any consequences.
*   **`getDecisionConsequences(spaceData, decision)`**: Gets the consequences of a decision from the `SPACE_EFFECTS.csv` file.
*   **`applyConsequences(player, consequences)`**: Applies the consequences of a decision to the player.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/MovementSection.js`

*   **`MovementSection({ currentPlayer, ... })`**: A React component that displays the available moves for the current player and handles the movement action.
*   **`handleMoveSelect(spaceName)`**: Handles the selection of a move.
*   **`handleMoveExecute()`**: Executes the selected move, moving the player to the new space.
*   **`getMovementType(spaceName)`**: A helper function to get the type of movement for a given space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PathVisualizer.js`

*   **`PathVisualizer({ gameState, currentPlayer, availableMoves, boardState, explorationPath })`**: A React component that draws arrows on the game board to visualize the possible movement paths for the current player.
*   **`useEffect(...)`**: A React hook that redraws the arrows whenever the player's position or the available moves change.
*   **`drawArrow(sourceElement, destElement, isExploration)`**: A function that draws a single arrow between two spaces on the board.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerHeader.js`

*   **`PlayerHeader({ player, isCurrentPlayer })`**: A React component that displays the header for a player's status panel, including their name, avatar, and a turn indicator.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerInfo.js`

*   **`PlayerInfo({ player })`**: A React component that displays the main information for a player, such as their current position and any status effects.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerMovementVisualizer.js`

*   **`PlayerMovementVisualizer()`**: A React component that visualizes the player's movement on the board, for example, by animating the player marker from one space to another.
*   **`useEventListener('playerMoved', ...)`**: An event listener that triggers the movement animation when a player moves.
*   **`animateMovement(player, fromSpace, toSpace)`**: A function that performs the animation of the player marker.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerResources.js`

*   **`PlayerResources({ player })`**: A React component that displays a player's resources, such as their money and time.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/PlayerStatusPanel.js`

*   **`PlayerStatusPanel({ debugMode = false })`**: A React component that serves as a container for all the player status components, such as `PlayerHeader`, `PlayerInfo`, `PlayerResources`, and `CardsInHand`.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/ResultsPanel.js`

*   **`ResultsPanel()`**: A React component that displays the results of the game, including the winner and the final scores. It also provides a space for future logging functionality.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameBoard.js`

*   **`GameBoard()`**: The main React component for the game board area. It manages the board's state, such as which spaces are highlighted as available moves, and delegates the actual rendering to other components.
*   **`useEffect(...)`**: A React hook that updates the list of available moves for the current player whenever their position on the board changes.
*   **`handleSpaceClick(spaceName)`**: An event handler that shows detailed information about a clicked space in the `SpaceExplorer` panel but does not move the player.
*   **`handleMovePlayer(spaceName, visitType)`**: A function that contains the logic for moving a player to a new space and then processing any effects associated with that space.
*   **`processSpaceEffects(spaceData, player)`**: A function that applies the effects of a space to a player, such as time costs, fees, or card-related events.
*   **`processCardEffect(effectText, cardType, player)`**: A function that processes an individual card effect that is triggered by landing on a space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameEndScreen.js`

*   **`GameEndScreen({ gameState, ... })`**: A React component that displays the final results and scores when the game has been completed.
*   **`useEventListener('gameCompleted', ...)`**: An event listener that automatically shows the end screen when the game is won.
*   **`restartGame()`**: A function that resets the game state, allowing players to start a new game.
*   **`formatTime(days)`**: A helper function to format the display of time spent during the game (e.g., "10 days").
*   **`formatMoney(amount)`**: A helper function to format currency values for display (e.g., "$1,200,000").

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameInitializer.js`

*   **`GameInitializer()`**: A logic-only React component that handles the initial setup of the game, including the `MovementEngine`.
*   **`useEventListener('movePlayerRequest', ...)`**: An event listener that processes requests to move a player, using the `MovementEngine` to apply space effects correctly.
*   **`useEventListener('spaceReentry', ...)`**: An event listener that handles the logic for when a player re-enters a space, such as after a negotiation, to re-trigger space effects.
*   **`showMovementOptions(playerId, spaceData)`**: A function that displays the available movement options for a player from their current space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameManager.js`

*   **`GameManager({ gameState, ... })`**: A core, logic-only React component that serves as the central controller for the game's state and business logic. It does not render any UI.
*   **`processSpaceEffects(playerId, spaceData)`**: Processes the effects of a space on a player, including time, fees, and card events.
*   **`processCardAction({ playerId, cardType, action })`**: Processes various card actions like drawing, replacing, or removing cards.
*   **`drawCardsForPlayer(playerId, cardType, amount)`**: Handles the logic for a player to draw a specific number of cards of a certain type from the deck.
*   **`replaceCardsForPlayer(playerId, cardType, amount)`**: Initiates the card replacement process by displaying the replacement modal.
*   **`executeCardReplacement(playerId, cardType, cardIndices)`**: Finalizes the replacement of specific cards in a player's hand.
*   **`removeCardsFromPlayer(playerId, cardType, amount)`**: Removes a specified number of cards from a player's hand.
*   **`processDiceOutcome({ playerId, outcome, ... })`**: Processes the result of a dice roll, which can trigger card actions, movement, or other effects.
*   **`giveCardToPlayer(playerId, cardId)`**: A global debug function to give a specific card to a player for testing purposes.
*   **`showGameState()`**: A global debug function that logs the entire current game state to the console for inspection.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GamePanelLayout.js`

*   **`GamePanelLayout({ debugMode })`**: A React component that creates a modern, responsive three-panel layout for the main game interface, adapting for both mobile and desktop screens.
*   **`useEffect(...)`**: A React hook that listens for window resize events to switch between mobile and desktop layouts.
*   **`togglePanel(panel)`**: A function to expand or collapse the side panels in the desktop view.
*   **`setActiveTab(tab)`**: A function that switches between the "Status", "Actions", and "Results" tabs in the mobile view.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameSaveManager.js`

*   **`GameSaveManager({ gameState, ... })`**: A logic-only React component that manages saving and loading the game state using the browser's `localStorage`.
*   **`autoSaveGame()`**: Automatically saves the current game state at regular intervals.
*   **`saveGame(slotName)`**: Manually saves the current game state to a named slot.
*   **`loadGame(saveId)`**: Loads a game from a specific save slot.
*   **`loadAutoSave()`**: Loads the most recent auto-saved game.
*   **`createSaveData()`**: Creates a data object from the current game state that can be saved.
*   **`deleteSave(saveId)`**: Deletes a specific save slot.
*   **`exportSave(saveId)`**: Allows the user to download a save file to their computer.
*   **`importSave(fileData)`**: Allows the user to load a game from a save file on their computer.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/GameTimer.js`

*   **`GameTimer()`**: A React component that tracks and displays the total elapsed game time and the current session duration.
*   **`useEventListener(...)`**: Event listeners that automatically start, pause, and reset the timer based on game events like "gameStarted" or "gameCompleted".
*   **`formatDuration(milliseconds)`**: A helper function to format the time into a human-readable string (e.g., "01:23:45").
*   **`getAverageTurnTime()`**: Calculates and displays the average time players are taking for each turn.
*   **`checkTimeWarnings()`**: Monitors the game duration and displays warnings if the session is running long.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/HandManager.js`

*   **`HandManager` (class component)**: A React component for managing and organizing the player's hand of cards.
*   **`sortCards(sortBy)`**: Sorts the cards in the player's hand based on criteria like type, name, or cost.
*   **`filterCards(filterBy)`**: Filters the cards to show only a specific type.
*   **`groupCards(groupBy)`**: Groups the cards in the hand based on criteria like type or cost.
*   **`handleBulkAction(action)`**: Performs a bulk action, such as discarding, on multiple selected cards at once.
*   **`organizeSelectedCards()`**: Automatically organizes the selected cards based on a predefined play strategy.
*   **`checkHandLimit()`**: Checks if the player is holding more cards than the hand limit allows.
*   **`renderControlPanel()`**: Renders the UI panel with controls for sorting, filtering, and viewing the cards.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/InteractiveFeedback.js`

*   **`InteractiveFeedback()`**: A React component that provides a system for professional UI notifications, such as "toast" pop-ups and loading indicators.
*   **`showToast(message, type, duration)`**: Displays a temporary "toast" notification on the screen.
*   **`success(message, duration)`**: A convenience method to show a success-themed toast.
*   **`warning(message, duration)`**: A convenience method to show a warning-themed toast.
*   **`error(message, duration)`**: A convenience method to show an error-themed toast.
*   **`info(message, duration)`**: A convenience method to show an info-themed toast.
*   **`showLoading(elementId, text)`**: Displays a loading spinner on a specific UI element.
*   **`hideLoading(loadingId)`**: Hides a loading spinner.
*   **`addRippleEffect(event)`**: Adds a visual ripple effect to buttons when they are clicked.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/LoadingAndErrorHandler.js`

*   **`LoadingAndErrorHandler()`**: A React component that provides a centralized system for handling loading states and error messages throughout the application.
*   **`useEventListener(...)`**: Event listeners that automatically show or hide loading screens and error dialogs based on game events.
*   **`addNotification(notification)`**: Adds a notification message to be displayed to the user.
*   **`retryAction()`**: Allows the user to retry an action that previously resulted in an error.
*   **`dismissError()`**: Allows the user to dismiss an error message.
*   **`LoadingOverlay()`**: A sub-component that renders the full-screen loading overlay.
*   **`ErrorModal()`**: A sub-component that renders the error message modal.
*   **`NotificationContainer()`**: A sub-component that renders the list of notifications.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardPlayInterface.js`

*   **`CardPlayInterface` (class component)**: A React component that provides a drag-and-drop interface for players to play cards from their hand.
*   **`setupDropZones()`**: Defines the valid areas where cards can be dropped, such as the "Play Area" or "Discard Area".
*   **`handleCardMouseDown(card, event)`**: Initiates the drag-and-drop action when a player clicks and holds on a card.
*   **`handleGlobalMouseMove(event)`**: Tracks the mouse movement while a card is being dragged.
*   **`handleGlobalMouseUp(event)`**: Handles the logic when the player releases the mouse button, dropping the card into a zone.
*   **`getValidDropZoneAt(position)`**: Determines if the card is currently over a valid drop zone.
*   **`canDropCardInZone(card, zone)`**: Checks if a specific card type is allowed in a specific drop zone.
*   **`isCardPlayable(card)`**: Checks if a card can be played based on the current game rules and player resources.
*   **`handleCardDrop(card, dropZone)`**: Processes the action when a card is successfully played in a drop zone.
*   **`renderDragGhost()`**: Renders a semi-transparent "ghost" image of the card that follows the cursor during the drag operation.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardReplacementModal.js`

*   **`CardReplacementModal({ gameStateManager })`**: A React component that displays a modal dialog allowing a player to select which cards they want to replace when a "Replace X" action is used.
*   **`useEventListener('showCardReplacementModal', ...)`**: An event listener that shows the modal when a card replacement action is triggered.
*   **`handleCardToggle(cardIndex)`**: Toggles the selection state of a card in the modal.
*   **`handleConfirm()`**: Confirms the player's selection and emits an event to the `GameStateManager` to perform the replacement.
*   **`handleCancel()`**: Closes the modal without performing the replacement action.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CardsInHand.js`

*   **`CardsInHand({ player, ... })`**: A React component that displays the cards currently held by the active player.
*   **`useMemo(...)`**: React hooks used to optimize performance by only recalculating the card list when the player's hand actually changes.
*   **`canUseECard(card)`**: A helper function that checks if an "E" (Expeditor) card is usable in the current game phase.
*   **`getCurrentGamePhase()`**: A helper function that returns the current phase of the game based on the player's position on the board.
*   **`handleUseCard(card)`**: Handles the logic for playing an "E" card directly from the player's hand.
*   **`CardsInHandMemo`**: A memoized version of the component to prevent unnecessary re-renders, improving UI performance.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/CurrentSpaceInfo.js`

*   **`CurrentSpaceInfo({ player, ... })`**: A React component that displays detailed information about the space the current player is on.
*   **`getCurrentSpaceInfo()`**: A core helper function that gathers all relevant data for the current space from the various CSV files (`SPACE_CONTENT.csv`, `SPACE_EFFECTS.csv`, etc.).
*   **`getContextualEffects(effects)`**: A helper function that formats the time-based effects of a space for a clear and user-friendly display.
*   **`getMovementContext(movement, diceOutcomes)`**: A helper function that determines the next fixed movement destination from the current space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/DiceRenderer.js`

*   **`DiceRenderer({ diceState, onClose })`**: A React component responsible for the visual display and animation of the dice roll. It shows the dice value and the outcome description.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/DiceResultModal.js`

*   **`DiceResultModal({ diceValue, effects, ... })`**: A React component that displays a modal dialog showing the results of a dice roll before the effects are applied, giving the player a clear summary of what will happen.
*   **`getSpecificNoEffectMessage()`**: A helper function that generates a user-friendly message when a dice roll results in no specific effect, based on the CSV data.
*   **`formatEffects()`**: A helper function that formats the list of dice roll effects for display in the modal.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/DiceRoll.js`

*   **`DiceRoll()`**: A React component that handles the core logic for CSV-driven dice rolling.
*   **`useEventListener('showDiceRoll', ...)`**: An event listener that prepares the component for a dice roll when requested by another part of the game.
*   **`rollDice()`**: The main function that simulates the dice roll, looks up the outcome in the `DICE_OUTCOMES.csv` file, and emits an event with the result.
*   **`applyOutcome()`**: Applies the result of the dice roll by emitting an event to the `GameStateManager`.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/DiceRollSection.js`

*   **`DiceRollSection({ diceRequired, ... })`**: A React component that provides the UI and logic for the dice rolling section within the main `ActionPanel`.
*   **`useEventListener('diceRollCompleted', ...)`**: An event listener that notifies the parent component when the dice roll is complete.
*   **`handleDiceRoll()`**: The core function that manages the entire dice roll process, including showing animations, getting the result from CSV data, and displaying the result modal.
*   **`getDiceEffectsPreview()`**: A helper function that shows the player a preview of the possible effects of a dice roll on the current space.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/EnhancedPlayerSetup.js`

*   **`EnhancedPlayerSetup({ gameStateManager })`**: A React component that provides a modern, graphical interface for setting up a new game.
*   **`addPlayer()`**: Adds a new player to the game.
*   **`removePlayer(playerId)`**: Removes a player from the game.
*   **`updatePlayer(playerId, property, value)`**: Updates a player's details, such as their name, color, and avatar, while ensuring that colors and avatars remain unique among players.
*   **`startGame()`**: Finalizes the setup and starts the game by sending the player and settings data to the `GameStateManager`.

### File: `/mnt/d/unravel/current_game/code2026/game/js/components/FixedApp.js`

*   **`FixedApp({ debugMode, ... })`**: The main, top-level React component for the entire application. It uses the `useGameState` hook to ensure all child components are synchronized with the central game state.
*   **`initializeGame(players, settings)`**: A function to initialize a new game with the provided players and settings.
*   **`GameInterface({ gameState, ... })`**: A sub-component that renders the main game screen, including the player status panels and the game board.
*   **`handleCloseModal()`**: A function to close any currently active modal dialog.
*   **`handleShowDiceResult(...)`**: A function to display the dice result modal.
*   **`closeSpaceExplorer()`**: A function to close the space explorer panel.
*   **`rollDice()`**: A function that initiates a dice roll.
*   **`movePlayer(destination)`**: A function that moves the current player to a new space on the board.
*   **`ErrorBoundary` (class component)**: A special React component that acts as a safety net, catching any JavaScript errors that occur within its child components and displaying a fallback UI instead of crashing the entire application.
