import { IDataService } from '../types/ServiceContracts';
import {
  GameConfig,
  Movement,
  DiceOutcome,
  SpaceEffect,
  DiceEffect,
  SpaceContent,
  Space,
  VisitType,
  Card
} from '../types/DataTypes';

export class DataService implements IDataService {
  private gameConfigs: GameConfig[] = [];
  private movements: Movement[] = [];
  private diceOutcomes: DiceOutcome[] = [];
  private spaceEffects: SpaceEffect[] = [];
  private diceEffects: DiceEffect[] = [];
  private spaceContents: SpaceContent[] = [];
  private spaces: Space[] = [];
  private loaded = false;

  constructor() {}

  async loadData(): Promise<void> {
    if (this.loaded) return;

    try {
      await Promise.all([
        this.loadGameConfig(),
        this.loadMovements(),
        this.loadDiceOutcomes(),
        this.loadSpaceEffects(),
        this.loadDiceEffects(),
        this.loadSpaceContents()
      ]);

      this.buildSpaces();
      this.loaded = true;
    } catch (error) {
      console.error('Error loading CSV data:', error);
      throw new Error('Failed to load game data');
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  // Configuration methods
  getGameConfig(): GameConfig[] {
    return [...this.gameConfigs];
  }

  getGameConfigBySpace(spaceName: string): GameConfig | undefined {
    return this.gameConfigs.find(config => config.space_name === spaceName);
  }

  // Space methods
  getAllSpaces(): Space[] {
    return [...this.spaces];
  }

  getSpaceByName(spaceName: string): Space | undefined {
    return this.spaces.find(space => space.name === spaceName);
  }

  // Movement methods
  getMovement(spaceName: string, visitType: VisitType): Movement | undefined {
    return this.movements.find(
      movement => movement.space_name === spaceName && movement.visit_type === visitType
    );
  }

  getAllMovements(): Movement[] {
    return [...this.movements];
  }

  // Dice outcome methods
  getDiceOutcome(spaceName: string, visitType: VisitType): DiceOutcome | undefined {
    return this.diceOutcomes.find(
      outcome => outcome.space_name === spaceName && outcome.visit_type === visitType
    );
  }

  getAllDiceOutcomes(): DiceOutcome[] {
    return [...this.diceOutcomes];
  }

  // Space effects methods
  getSpaceEffects(spaceName: string, visitType: VisitType): SpaceEffect[] {
    return this.spaceEffects.filter(
      effect => effect.space_name === spaceName && effect.visit_type === visitType
    );
  }

  getAllSpaceEffects(): SpaceEffect[] {
    return [...this.spaceEffects];
  }

  // Dice effects methods
  getDiceEffects(spaceName: string, visitType: VisitType): DiceEffect[] {
    return this.diceEffects.filter(
      effect => effect.space_name === spaceName && effect.visit_type === visitType
    );
  }

  getAllDiceEffects(): DiceEffect[] {
    return [...this.diceEffects];
  }

  // Content methods
  getSpaceContent(spaceName: string, visitType: VisitType): SpaceContent | undefined {
    return this.spaceContents.find(
      content => content.space_name === spaceName && content.visit_type === visitType
    );
  }

  getAllSpaceContent(): SpaceContent[] {
    return [...this.spaceContents];
  }

  // Private CSV loading methods
  private async loadGameConfig(): Promise<void> {
    const response = await fetch('/data/CLEAN_FILES/GAME_CONFIG.csv');
    const csvText = await response.text();
    this.gameConfigs = this.parseGameConfigCsv(csvText);
  }

  private async loadMovements(): Promise<void> {
    const response = await fetch('/data/CLEAN_FILES/MOVEMENT.csv');
    const csvText = await response.text();
    this.movements = this.parseMovementCsv(csvText);
  }

  private async loadDiceOutcomes(): Promise<void> {
    const response = await fetch('/data/CLEAN_FILES/DICE_OUTCOMES.csv');
    const csvText = await response.text();
    this.diceOutcomes = this.parseDiceOutcomesCsv(csvText);
  }

  private async loadSpaceEffects(): Promise<void> {
    const response = await fetch('/data/CLEAN_FILES/SPACE_EFFECTS.csv');
    const csvText = await response.text();
    this.spaceEffects = this.parseSpaceEffectsCsv(csvText);
  }

  private async loadDiceEffects(): Promise<void> {
    const response = await fetch('/data/CLEAN_FILES/DICE_EFFECTS.csv');
    const csvText = await response.text();
    this.diceEffects = this.parseDiceEffectsCsv(csvText);
  }

  private async loadSpaceContents(): Promise<void> {
    const response = await fetch('/data/CLEAN_FILES/SPACE_CONTENT.csv');
    const csvText = await response.text();
    this.spaceContents = this.parseSpaceContentCsv(csvText);
  }

  // CSV parsing methods
  private parseGameConfigCsv(csvText: string): GameConfig[] {
    const lines = csvText.trim().split('\n');
    const header = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      return {
        space_name: values[0],
        phase: values[1],
        path_type: values[2],
        is_starting_space: values[3] === 'Yes',
        is_ending_space: values[4] === 'Yes',
        min_players: parseInt(values[5]),
        max_players: parseInt(values[6]),
        requires_dice_roll: values[7] === 'Yes'
      };
    });
  }

  private parseMovementCsv(csvText: string): Movement[] {
    const lines = csvText.trim().split('\n');
    
    return lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      return {
        space_name: values[0],
        visit_type: values[1] as VisitType,
        movement_type: values[2] as 'fixed' | 'choice' | 'dice' | 'logic' | 'none',
        destination_1: values[3] || undefined,
        destination_2: values[4] || undefined,
        destination_3: values[5] || undefined,
        destination_4: values[6] || undefined,
        destination_5: values[7] || undefined
      };
    });
  }

  private parseDiceOutcomesCsv(csvText: string): DiceOutcome[] {
    const lines = csvText.trim().split('\n');
    
    return lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      return {
        space_name: values[0],
        visit_type: values[1] as VisitType,
        roll_1: values[2] || undefined,
        roll_2: values[3] || undefined,
        roll_3: values[4] || undefined,
        roll_4: values[5] || undefined,
        roll_5: values[6] || undefined,
        roll_6: values[7] || undefined
      };
    });
  }

  private parseSpaceEffectsCsv(csvText: string): SpaceEffect[] {
    const lines = csvText.trim().split('\n');
    
    return lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      return {
        space_name: values[0],
        visit_type: values[1] as VisitType,
        effect_type: values[2] as 'time' | 'cards' | 'money',
        effect_action: values[3],
        effect_value: isNaN(Number(values[4])) ? values[4] : Number(values[4]),
        condition: values[5],
        description: values[6]
      };
    });
  }

  private parseDiceEffectsCsv(csvText: string): DiceEffect[] {
    const lines = csvText.trim().split('\n');
    
    return lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      return {
        space_name: values[0],
        visit_type: values[1] as VisitType,
        effect_type: values[2],
        card_type: values[3] || undefined,
        roll_1: values[4] || undefined,
        roll_2: values[5] || undefined,
        roll_3: values[6] || undefined,
        roll_4: values[7] || undefined,
        roll_5: values[8] || undefined,
        roll_6: values[9] || undefined
      };
    });
  }

  private parseSpaceContentCsv(csvText: string): SpaceContent[] {
    const lines = csvText.trim().split('\n');
    
    return lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      return {
        space_name: values[0],
        visit_type: values[1] as VisitType,
        title: values[2],
        story: values[3],
        action_description: values[4],
        outcome_description: values[5],
        can_negotiate: values[6] === 'Yes'
      };
    });
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private buildSpaces(): void {
    const spaceNames = [...new Set(this.gameConfigs.map(config => config.space_name))];
    
    this.spaces = spaceNames.map(spaceName => {
      const config = this.getGameConfigBySpace(spaceName)!;
      const content = this.spaceContents.filter(c => c.space_name === spaceName);
      const movement = this.movements.filter(m => m.space_name === spaceName);
      const spaceEffects = this.spaceEffects.filter(e => e.space_name === spaceName);
      const diceEffects = this.diceEffects.filter(e => e.space_name === spaceName);
      const diceOutcomes = this.diceOutcomes.filter(o => o.space_name === spaceName);
      
      return {
        name: spaceName,
        config,
        content,
        movement,
        spaceEffects,
        diceEffects,
        diceOutcomes
      };
    });
  }

  // Card management methods (mock data for now)
  getCards(): Card[] {
    // Mock card data for testing the modal functionality
    return [
      {
        card_id: 'W001',
        card_name: 'Strategic Planning',
        card_type: 'W',
        description: 'Plan your next moves carefully to gain advantage in the project.',
        effects_on_play: 'Draw 2 additional cards and gain 1 time unit.',
        cost: 0,
        phase_restriction: 'Planning'
      },
      {
        card_id: 'B001',
        card_name: 'Budget Allocation',
        card_type: 'B',
        description: 'Allocate resources efficiently to maximize project outcomes.',
        effects_on_play: 'Gain $500 and reduce next action cost by 50%.',
        cost: 2,
        phase_restriction: 'Any'
      },
      {
        card_id: 'E001',
        card_name: 'Equipment Upgrade',
        card_type: 'E',
        description: 'Upgrade your equipment to improve efficiency.',
        effects_on_play: 'All work actions gain +1 effectiveness for 3 turns.',
        cost: 1,
        phase_restriction: 'Development'
      }
    ];
  }
}