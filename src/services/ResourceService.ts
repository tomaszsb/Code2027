import { 
  IResourceService, 
  IStateService, 
  ResourceChange, 
  ResourceTransaction, 
  ResourceValidation 
} from '../types/ServiceContracts';

/**
 * Unified Resource Management Service
 * 
 * Handles all player resource modifications (money and time) with:
 * - Atomic operations and rollback capability
 * - Source tracking for debugging and logging
 * - Validation and error handling
 * - Transaction history for auditing
 * 
 * This service can be called from any source:
 * - Card effects (e.g., "card:E029")
 * - Space effects (e.g., "space:PM-DECISION-CHECK")
 * - UI actions (e.g., "ui:manual_adjustment")
 */
export class ResourceService implements IResourceService {
  private stateService: IStateService;
  private transactionHistory: Map<string, ResourceTransaction[]> = new Map();

  constructor(stateService: IStateService) {
    this.stateService = stateService;
  }

  // === MONEY OPERATIONS ===

  addMoney(playerId: string, amount: number, source: string, reason?: string): boolean {
    if (amount <= 0) {
      console.warn(`ResourceService.addMoney: Invalid amount ${amount} for player ${playerId}`);
      return false;
    }

    return this.updateResources(playerId, {
      money: amount,
      source,
      reason: reason || `Added $${amount.toLocaleString()}`
    });
  }

  spendMoney(playerId: string, amount: number, source: string, reason?: string): boolean {
    if (amount <= 0) {
      console.warn(`ResourceService.spendMoney: Invalid amount ${amount} for player ${playerId}`);
      return false;
    }

    if (!this.canAfford(playerId, amount)) {
      console.warn(`ResourceService.spendMoney: Player ${playerId} cannot afford $${amount.toLocaleString()}`);
      return false;
    }

    return this.updateResources(playerId, {
      money: -amount,
      source,
      reason: reason || `Spent $${amount.toLocaleString()}`
    });
  }

  canAfford(playerId: string, amount: number): boolean {
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      console.error(`ResourceService.canAfford: Player ${playerId} not found`);
      return false;
    }
    return player.money >= amount;
  }

  // === TIME OPERATIONS ===

  addTime(playerId: string, amount: number, source: string, reason?: string): void {
    this.updateResources(playerId, {
      timeSpent: amount,
      source,
      reason: reason || `Added ${amount} time`
    });
  }

  spendTime(playerId: string, amount: number, source: string, reason?: string): void {
    this.updateResources(playerId, {
      timeSpent: -amount,
      source,
      reason: reason || `Spent ${amount} time`
    });
  }

  // === COMBINED OPERATIONS ===

  updateResources(playerId: string, changes: ResourceChange): boolean {
    // Validate the change
    const validation = this.validateResourceChange(playerId, changes);
    if (!validation.valid) {
      console.error(`ResourceService.updateResources: Validation failed for player ${playerId}:`, validation.errors);
      return false;
    }

    // Get current player state
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      console.error(`ResourceService.updateResources: Player ${playerId} not found`);
      return false;
    }

    // Calculate new values
    const balanceBefore = {
      money: player.money,
      timeSpent: player.timeSpent
    };

    const newMoney = changes.money ? player.money + changes.money : player.money;
    const newTimeSpent = changes.timeSpent ? player.timeSpent + changes.timeSpent : player.timeSpent;

    // Apply the changes
    try {
      const updatedState = this.stateService.updatePlayer({
        id: playerId,
        money: newMoney,
        timeSpent: Math.max(0, newTimeSpent) // Ensure time doesn't go negative
      });

      const balanceAfter = {
        money: newMoney,
        timeSpent: Math.max(0, newTimeSpent)
      };

      // Log the transaction
      this.logTransaction(playerId, changes, balanceBefore, balanceAfter, true);

      // Log to console for debugging
      const changeDescription = this.formatChangeDescription(changes);
      console.log(`💰 Resource Update [${playerId}]: ${changeDescription} (Source: ${changes.source})`);
      console.log(`   Balance: $${balanceBefore.money.toLocaleString()} → $${balanceAfter.money.toLocaleString()}, Time: ${balanceBefore.timeSpent} → ${balanceAfter.timeSpent}`);

      return true;

    } catch (error) {
      console.error(`ResourceService.updateResources: Failed to update player ${playerId}:`, error);
      
      // Log failed transaction
      this.logTransaction(playerId, changes, balanceBefore, balanceBefore, false);
      
      return false;
    }
  }

  getResourceHistory(playerId: string): ResourceTransaction[] {
    return this.transactionHistory.get(playerId) || [];
  }

  // === VALIDATION ===

  validateResourceChange(playerId: string, changes: ResourceChange): ResourceValidation {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate player exists
    const player = this.stateService.getPlayer(playerId);
    if (!player) {
      errors.push(`Player ${playerId} does not exist`);
      return { valid: false, errors, warnings };
    }

    // Validate source is provided
    if (!changes.source || changes.source.trim().length === 0) {
      errors.push('Source is required for all resource changes');
    }

    // Validate money changes
    if (changes.money !== undefined) {
      if (isNaN(changes.money)) {
        errors.push('Money change must be a valid number');
      }
      
      // Check if spending more money than player has
      if (changes.money < 0 && player.money + changes.money < 0) {
        errors.push(`Insufficient funds: trying to spend $${Math.abs(changes.money).toLocaleString()}, but player only has $${player.money.toLocaleString()}`);
      }

      // Warning for large transactions
      if (Math.abs(changes.money) > 1000000) {
        warnings.push(`Large money transaction: ${changes.money > 0 ? '+' : ''}$${changes.money.toLocaleString()}`);
      }
    }

    // Validate time changes
    if (changes.timeSpent !== undefined) {
      if (isNaN(changes.timeSpent)) {
        errors.push('Time change must be a valid number');
      }

      // Warning for large time changes
      if (Math.abs(changes.timeSpent) > 20) {
        warnings.push(`Large time change: ${changes.timeSpent > 0 ? '+' : ''}${changes.timeSpent} ticks`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  // === PRIVATE HELPERS ===

  private logTransaction(
    playerId: string, 
    changes: ResourceChange, 
    balanceBefore: { money: number; timeSpent: number },
    balanceAfter: { money: number; timeSpent: number },
    successful: boolean
  ): void {
    const transaction: ResourceTransaction = {
      id: this.generateTransactionId(),
      playerId,
      timestamp: Date.now(),
      changes,
      balanceBefore,
      balanceAfter,
      successful
    };

    // Initialize history if needed
    if (!this.transactionHistory.has(playerId)) {
      this.transactionHistory.set(playerId, []);
    }

    // Add transaction to history
    const playerHistory = this.transactionHistory.get(playerId)!;
    playerHistory.push(transaction);

    // Keep only last 100 transactions per player
    if (playerHistory.length > 100) {
      playerHistory.splice(0, playerHistory.length - 100);
    }
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatChangeDescription(changes: ResourceChange): string {
    const parts: string[] = [];
    
    if (changes.money !== undefined) {
      const sign = changes.money >= 0 ? '+' : '';
      parts.push(`${sign}$${changes.money.toLocaleString()}`);
    }
    
    if (changes.timeSpent !== undefined) {
      const sign = changes.timeSpent >= 0 ? '+' : '';
      parts.push(`${sign}${changes.timeSpent} time`);
    }

    let description = parts.join(', ');
    
    if (changes.reason) {
      description += ` (${changes.reason})`;
    }

    return description;
  }

  // === DEBUG HELPERS ===

  /**
   * Get summary of all resource transactions for debugging
   */
  getTransactionSummary(): { [playerId: string]: { totalTransactions: number; lastTransaction?: ResourceTransaction } } {
    const summary: { [playerId: string]: { totalTransactions: number; lastTransaction?: ResourceTransaction } } = {};
    
    for (const [playerId, transactions] of this.transactionHistory.entries()) {
      summary[playerId] = {
        totalTransactions: transactions.length,
        lastTransaction: transactions[transactions.length - 1]
      };
    }
    
    return summary;
  }

  /**
   * Clear transaction history (for testing or reset)
   */
  clearTransactionHistory(playerId?: string): void {
    if (playerId) {
      this.transactionHistory.delete(playerId);
    } else {
      this.transactionHistory.clear();
    }
  }
}