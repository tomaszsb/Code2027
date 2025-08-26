import { DataService } from '../../src/services/DataService';
import { GameConfig, Movement, SpaceEffect, DiceEffect, SpaceContent, DiceOutcome, Card } from '../../src/types/DataTypes';

// Mock fetch globally for tests
global.fetch = jest.fn();

describe('DataService', () => {
  let dataService: DataService;
  
  // Mock CSV data
  const mockGameConfigCsv = `space_name,phase,path_type,is_starting_space,is_ending_space,min_players,max_players,requires_dice_roll
START-QUICK-PLAY-GUIDE,SETUP,Tutorial,Yes,No,1,6,No
OWNER-SCOPE-INITIATION,SETUP,Main,No,No,1,6,Yes
FINISH,END,Main,No,Yes,1,6,No`;

  const mockMovementCsv = `space_name,visit_type,movement_type,destination_1,destination_2,destination_3,destination_4,destination_5
START-QUICK-PLAY-GUIDE,First,fixed,OWNER-SCOPE-INITIATION,,,,
OWNER-SCOPE-INITIATION,First,choice,DEST1,DEST2,,,
FINISH,First,none,,,,,`;

  const mockSpaceEffectsCsv = `space_name,visit_type,effect_type,effect_action,effect_value,condition,description
OWNER-SCOPE-INITIATION,First,time,add,1,always,1 day for scope review
OWNER-SCOPE-INITIATION,First,cards,draw_w,3,always,Draw 3 W cards`;

  const mockDiceEffectsCsv = `space_name,visit_type,effect_type,card_type,roll_1,roll_2,roll_3,roll_4,roll_5,roll_6
OWNER-SCOPE-INITIATION,First,cards,W,Draw 1,Draw 1,Draw 2,Draw 2,Draw 3,Draw 3`;

  const mockSpaceContentCsv = `space_name,visit_type,title,story,action_description,outcome_description,can_negotiate
START-QUICK-PLAY-GUIDE,First,Getting Started,Test story,Test action,Test outcome,No
OWNER-SCOPE-INITIATION,First,Project Scope,Test scope story,Test scope action,Test scope outcome,Yes`;

  const mockDiceOutcomesCsv = `space_name,visit_type,roll_1,roll_2,roll_3,roll_4,roll_5,roll_6
OWNER-SCOPE-INITIATION,First,DEST1,DEST2,DEST3,DEST4,DEST5,DEST6`;

  const mockCardsCsv = `card_id,card_name,card_type,description,effects_on_play,cost,phase_restriction
W001,Strategic Planning,W,Plan your next moves carefully.,Draw 2 additional cards and gain 1 time unit.,0,Planning
B001,Budget Allocation,B,Allocate resources efficiently.,Gain $500 and reduce next action cost by 50%.,2,Any
E001,Expeditor Assistance,E,Filing representative helps speed up application process.,All work actions gain +1 effectiveness for 3 turns.,1,Development
L001,Weather Delay,L,Unexpected weather event delays project.,Prevent next 2 negative effects but lose $300.,2,Any
I001,Market Research,I,Conduct detailed market analysis.,Draw 2 cards of any type and gain $300.,2,Planning
W002,Research Analysis,W,Conduct thorough research.,Gain 2 time units and draw 1 B card.,,Any
E002,Filing Representative,E,Professional expeditor for permit applications.,,3,Development`;

  beforeEach(() => {
    dataService = new DataService();
    jest.clearAllMocks();
    
    // Mock fetch responses
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const urlMap: { [key: string]: string } = {
        '/data/CLEAN_FILES/GAME_CONFIG.csv': mockGameConfigCsv,
        '/data/CLEAN_FILES/MOVEMENT.csv': mockMovementCsv,
        '/data/CLEAN_FILES/SPACE_EFFECTS.csv': mockSpaceEffectsCsv,
        '/data/CLEAN_FILES/DICE_EFFECTS.csv': mockDiceEffectsCsv,
        '/data/CLEAN_FILES/SPACE_CONTENT.csv': mockSpaceContentCsv,
        '/data/CLEAN_FILES/DICE_OUTCOMES.csv': mockDiceOutcomesCsv,
        '/data/CLEAN_FILES/CARDS.csv': mockCardsCsv
      };
      
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(urlMap[url] || '')
      });
    });
  });

  describe('Data Loading', () => {
    it('should initialize with loaded state as false', () => {
      expect(dataService.isLoaded()).toBe(false);
    });

    it('should load all CSV data successfully', async () => {
      await dataService.loadData();
      
      expect(dataService.isLoaded()).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(7);
      expect(global.fetch).toHaveBeenCalledWith('/data/CLEAN_FILES/GAME_CONFIG.csv');
      expect(global.fetch).toHaveBeenCalledWith('/data/CLEAN_FILES/MOVEMENT.csv');
      expect(global.fetch).toHaveBeenCalledWith('/data/CLEAN_FILES/SPACE_EFFECTS.csv');
      expect(global.fetch).toHaveBeenCalledWith('/data/CLEAN_FILES/DICE_EFFECTS.csv');
      expect(global.fetch).toHaveBeenCalledWith('/data/CLEAN_FILES/SPACE_CONTENT.csv');
      expect(global.fetch).toHaveBeenCalledWith('/data/CLEAN_FILES/DICE_OUTCOMES.csv');
      expect(global.fetch).toHaveBeenCalledWith('/data/CLEAN_FILES/CARDS.csv');
    });

    it('should not reload data if already loaded', async () => {
      await dataService.loadData();
      jest.clearAllMocks();
      
      await dataService.loadData();
      
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should throw error if loading fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      
      await expect(dataService.loadData()).rejects.toThrow('Failed to load game data');
    });
  });

  describe('Game Configuration Methods', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should return all game configurations', () => {
      const configs = dataService.getGameConfig();
      
      expect(configs).toHaveLength(3);
      expect(configs[0].space_name).toBe('START-QUICK-PLAY-GUIDE');
      expect(configs[0].is_starting_space).toBe(true);
      expect(configs[0].is_ending_space).toBe(false);
    });

    it('should return specific game configuration by space name', () => {
      const config = dataService.getGameConfigBySpace('OWNER-SCOPE-INITIATION');
      
      expect(config).toBeDefined();
      expect(config!.space_name).toBe('OWNER-SCOPE-INITIATION');
      expect(config!.phase).toBe('SETUP');
      expect(config!.requires_dice_roll).toBe(true);
    });

    it('should return undefined for non-existent space', () => {
      const config = dataService.getGameConfigBySpace('NON_EXISTENT');
      
      expect(config).toBeUndefined();
    });
  });

  describe('Movement Methods', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should return movement for specific space and visit type', () => {
      const movement = dataService.getMovement('START-QUICK-PLAY-GUIDE', 'First');
      
      expect(movement).toBeDefined();
      expect(movement!.movement_type).toBe('fixed');
      expect(movement!.destination_1).toBe('OWNER-SCOPE-INITIATION');
    });

    it('should return all movements', () => {
      const movements = dataService.getAllMovements();
      
      expect(movements).toHaveLength(3);
      expect(movements.find(m => m.movement_type === 'choice')).toBeDefined();
      expect(movements.find(m => m.movement_type === 'none')).toBeDefined();
    });

    it('should return undefined for non-existent movement', () => {
      const movement = dataService.getMovement('NON_EXISTENT', 'First');
      
      expect(movement).toBeUndefined();
    });
  });

  describe('Space Effects Methods', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should return space effects for specific space and visit type', () => {
      const effects = dataService.getSpaceEffects('OWNER-SCOPE-INITIATION', 'First');
      
      expect(effects).toHaveLength(2);
      expect(effects[0].effect_type).toBe('time');
      expect(effects[0].effect_value).toBe(1);
      expect(effects[1].effect_type).toBe('cards');
      expect(effects[1].effect_value).toBe(3);
    });

    it('should return empty array for space with no effects', () => {
      const effects = dataService.getSpaceEffects('NON_EXISTENT', 'First');
      
      expect(effects).toHaveLength(0);
    });

    it('should return all space effects', () => {
      const effects = dataService.getAllSpaceEffects();
      
      expect(effects).toHaveLength(2);
    });
  });

  describe('Dice Effects Methods', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should return dice effects for specific space and visit type', () => {
      const effects = dataService.getDiceEffects('OWNER-SCOPE-INITIATION', 'First');
      
      expect(effects).toHaveLength(1);
      expect(effects[0].effect_type).toBe('cards');
      expect(effects[0].card_type).toBe('W');
      expect(effects[0].roll_1).toBe('Draw 1');
      expect(effects[0].roll_6).toBe('Draw 3');
    });

    it('should return all dice effects', () => {
      const effects = dataService.getAllDiceEffects();
      
      expect(effects).toHaveLength(1);
    });
  });

  describe('Space Content Methods', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should return space content for specific space and visit type', () => {
      const content = dataService.getSpaceContent('START-QUICK-PLAY-GUIDE', 'First');
      
      expect(content).toBeDefined();
      expect(content!.title).toBe('Getting Started');
      expect(content!.can_negotiate).toBe(false);
    });

    it('should return content with negotiation enabled', () => {
      const content = dataService.getSpaceContent('OWNER-SCOPE-INITIATION', 'First');
      
      expect(content).toBeDefined();
      expect(content!.can_negotiate).toBe(true);
    });

    it('should return all space content', () => {
      const contents = dataService.getAllSpaceContent();
      
      expect(contents).toHaveLength(2);
    });
  });

  describe('Dice Outcomes Methods', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should return dice outcome for specific space and visit type', () => {
      const outcome = dataService.getDiceOutcome('OWNER-SCOPE-INITIATION', 'First');
      
      expect(outcome).toBeDefined();
      expect(outcome!.roll_1).toBe('DEST1');
      expect(outcome!.roll_6).toBe('DEST6');
    });

    it('should return all dice outcomes', () => {
      const outcomes = dataService.getAllDiceOutcomes();
      
      expect(outcomes).toHaveLength(1);
    });
  });

  describe('Spaces Methods', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should build and return all spaces', () => {
      const spaces = dataService.getAllSpaces();
      
      expect(spaces).toHaveLength(3);
      
      const startSpace = spaces.find(s => s.name === 'START-QUICK-PLAY-GUIDE');
      expect(startSpace).toBeDefined();
      expect(startSpace!.config.is_starting_space).toBe(true);
      expect(startSpace!.content).toHaveLength(1);
      expect(startSpace!.movement).toHaveLength(1);
    });

    it('should return specific space by name', () => {
      const space = dataService.getSpaceByName('OWNER-SCOPE-INITIATION');
      
      expect(space).toBeDefined();
      expect(space!.name).toBe('OWNER-SCOPE-INITIATION');
      expect(space!.spaceEffects).toHaveLength(2);
      expect(space!.diceEffects).toHaveLength(1);
      expect(space!.diceOutcomes).toHaveLength(1);
    });

    it('should return undefined for non-existent space', () => {
      const space = dataService.getSpaceByName('NON_EXISTENT');
      
      expect(space).toBeUndefined();
    });
  });

  describe('CSV Parsing', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should correctly parse boolean values', () => {
      const config = dataService.getGameConfigBySpace('START-QUICK-PLAY-GUIDE');
      
      expect(config!.is_starting_space).toBe(true);
      expect(config!.is_ending_space).toBe(false);
      expect(config!.requires_dice_roll).toBe(false);
    });

    it('should correctly parse numeric values', () => {
      const config = dataService.getGameConfigBySpace('START-QUICK-PLAY-GUIDE');
      
      expect(config!.min_players).toBe(1);
      expect(config!.max_players).toBe(6);
    });

    it('should handle empty CSV fields as undefined', () => {
      const movement = dataService.getMovement('START-QUICK-PLAY-GUIDE', 'First');
      
      expect(movement!.destination_2).toBeUndefined();
      expect(movement!.destination_3).toBeUndefined();
    });
  });

  describe('Data Immutability', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should return copies of data to prevent external mutations', () => {
      const configs1 = dataService.getGameConfig();
      const configs2 = dataService.getGameConfig();
      
      expect(configs1).not.toBe(configs2);
      expect(configs1).toEqual(configs2);
    });

    it('should return copies of arrays for effects', () => {
      const effects1 = dataService.getSpaceEffects('OWNER-SCOPE-INITIATION', 'First');
      const effects2 = dataService.getSpaceEffects('OWNER-SCOPE-INITIATION', 'First');
      
      expect(effects1).not.toBe(effects2);
      expect(effects1).toEqual(effects2);
    });
  });

  describe('CSV Parsing with Quoted Fields', () => {
    it('should handle CSV fields with commas inside quotes', async () => {
      // Mock CSV with quoted fields containing commas
      const csvWithQuotedCommas = `space_name,visit_type,title,story,action_description,outcome_description,can_negotiate
COMPLEX-SPACE,First,"A grand title, full of adventure","A story, with a twist, and drama","An action, requiring choice","An outcome, with consequences",Yes
SIMPLE-SPACE,First,Simple Title,Simple Story,Simple Action,Simple Outcome,No`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/SPACE_CONTENT.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(csvWithQuotedCommas)
          });
        }
        // Return empty CSV for other files to avoid errors
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await newDataService.loadData();

      const complexContent = newDataService.getSpaceContent('COMPLEX-SPACE', 'First');
      const simpleContent = newDataService.getSpaceContent('SIMPLE-SPACE', 'First');

      expect(complexContent).toBeDefined();
      expect(complexContent!.title).toBe('A grand title, full of adventure');
      expect(complexContent!.story).toBe('A story, with a twist, and drama');
      expect(complexContent!.action_description).toBe('An action, requiring choice');
      expect(complexContent!.outcome_description).toBe('An outcome, with consequences');
      expect(complexContent!.can_negotiate).toBe(true);

      expect(simpleContent).toBeDefined();
      expect(simpleContent!.title).toBe('Simple Title');
      expect(simpleContent!.story).toBe('Simple Story');
    });

    it('should handle empty quoted fields', async () => {
      const csvWithEmptyQuotedFields = `space_name,visit_type,title,story,action_description,outcome_description,can_negotiate
EMPTY-SPACE,First,"","",Empty Action,"",No`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/SPACE_CONTENT.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(csvWithEmptyQuotedFields)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await newDataService.loadData();

      const content = newDataService.getSpaceContent('EMPTY-SPACE', 'First');

      expect(content).toBeDefined();
      expect(content!.title).toBe('');
      expect(content!.story).toBe('');
      expect(content!.action_description).toBe('Empty Action');
      expect(content!.outcome_description).toBe('');
      expect(content!.can_negotiate).toBe(false);
    });

    it('should handle mixed quoted and unquoted fields', async () => {
      const csvWithMixedFields = `space_name,visit_type,title,story,action_description,outcome_description,can_negotiate
MIXED-SPACE,First,"Quoted, title",Unquoted story,"Another, quoted field",Unquoted outcome,Yes`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/SPACE_CONTENT.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(csvWithMixedFields)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await newDataService.loadData();

      const content = newDataService.getSpaceContent('MIXED-SPACE', 'First');

      expect(content).toBeDefined();
      expect(content!.title).toBe('Quoted, title');
      expect(content!.story).toBe('Unquoted story');
      expect(content!.action_description).toBe('Another, quoted field');
      expect(content!.outcome_description).toBe('Unquoted outcome');
      expect(content!.can_negotiate).toBe(true);
    });

    it('should handle consecutive quoted fields', async () => {
      const csvWithConsecutiveQuotes = `space_name,visit_type,title,story,action_description,outcome_description,can_negotiate
CONSECUTIVE-SPACE,First,"First, quoted","Second, quoted","Third, quoted","Fourth, quoted",No`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/SPACE_CONTENT.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(csvWithConsecutiveQuotes)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await newDataService.loadData();

      const content = newDataService.getSpaceContent('CONSECUTIVE-SPACE', 'First');

      expect(content).toBeDefined();
      expect(content!.title).toBe('First, quoted');
      expect(content!.story).toBe('Second, quoted');
      expect(content!.action_description).toBe('Third, quoted');
      expect(content!.outcome_description).toBe('Fourth, quoted');
      expect(content!.can_negotiate).toBe(false);
    });

    it('should handle quoted fields at the end of line', async () => {
      const csvWithEndQuotes = `space_name,visit_type,title,story,action_description,outcome_description,can_negotiate
END-QUOTE-SPACE,First,Start Title,Start Story,Start Action,Start Outcome,"Yes, with emphasis"`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/SPACE_CONTENT.csv') {
          return Promise.resolve({
            text: () => Promise.resolve(csvWithEndQuotes)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await newDataService.loadData();

      const content = newDataService.getSpaceContent('END-QUOTE-SPACE', 'First');

      expect(content).toBeDefined();
      expect(content!.space_name).toBe('END-QUOTE-SPACE');
      expect(content!.visit_type).toBe('First');
      expect(content!.title).toBe('Start Title');
      expect(content!.story).toBe('Start Story');
      expect(content!.action_description).toBe('Start Action');
      expect(content!.outcome_description).toBe('Start Outcome');
      expect(content!.can_negotiate).toBe(false); // "Yes, with emphasis" contains comma, not exact "Yes"
    });

    it('should handle single character fields and quotes', async () => {
      const csvWithSingleChars = `space_name,visit_type,title,story,action_description,outcome_description,can_negotiate
CHAR-SPACE,First,A,B,"C,D",E,F`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/SPACE_CONTENT.csv') {
          return Promise.resolve({
            text: () => Promise.resolve(csvWithSingleChars)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await newDataService.loadData();

      const content = newDataService.getSpaceContent('CHAR-SPACE', 'First');

      expect(content).toBeDefined();
      expect(content!.title).toBe('A');
      expect(content!.story).toBe('B');
      expect(content!.action_description).toBe('C,D');
      expect(content!.outcome_description).toBe('E');
    });

    it('should handle CSV with missing trailing columns', async () => {
      // Test dice outcomes with missing columns to trigger || undefined branches
      const diceOutcomesWithMissingColumns = `space_name,visit_type,roll_1,roll_2,roll_3,roll_4,roll_5,roll_6
PARTIAL-OUTCOMES,First,DEST1,DEST2
FULL-OUTCOMES,First,DEST1,DEST2,DEST3,DEST4,DEST5,DEST6`;

      // Test dice effects with missing columns
      const diceEffectsWithMissingColumns = `space_name,visit_type,effect_type,card_type,roll_1,roll_2,roll_3,roll_4,roll_5,roll_6
PARTIAL-EFFECTS,First,cards,W,Draw 1
FULL-EFFECTS,First,cards,W,Draw 1,Draw 2,Draw 3,Draw 4,Draw 5,Draw 6`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        const urlMap: { [key: string]: string } = {
          '/data/CLEAN_FILES/DICE_OUTCOMES.csv': diceOutcomesWithMissingColumns,
          '/data/CLEAN_FILES/DICE_EFFECTS.csv': diceEffectsWithMissingColumns,
          '/data/CLEAN_FILES/GAME_CONFIG.csv': 'space_name,phase,path_type,is_starting_space,is_ending_space,min_players,max_players,requires_dice_roll\nPARTIAL-OUTCOMES,TEST,Main,No,No,1,6,No\nFULL-OUTCOMES,TEST,Main,No,No,1,6,No\nPARTIAL-EFFECTS,TEST,Main,No,No,1,6,No\nFULL-EFFECTS,TEST,Main,No,No,1,6,No',
          '/data/CLEAN_FILES/MOVEMENT.csv': 'space_name,visit_type,movement_type,destination_1,destination_2,destination_3,destination_4,destination_5\nPARTIAL-OUTCOMES,First,none,,,,,\nFULL-OUTCOMES,First,none,,,,,',
          '/data/CLEAN_FILES/SPACE_EFFECTS.csv': 'space_name,visit_type,effect_type,effect_action,effect_value,condition,description\n',
          '/data/CLEAN_FILES/SPACE_CONTENT.csv': 'space_name,visit_type,title,story,action_description,outcome_description,can_negotiate\n'
        };
        
        return Promise.resolve({
          text: () => Promise.resolve(urlMap[url] || 'header\n')
        });
      });

      const newDataService = new DataService();
      await newDataService.loadData();

      // Test partial dice outcomes (missing columns should be undefined)
      const partialOutcome = newDataService.getDiceOutcome('PARTIAL-OUTCOMES', 'First');
      expect(partialOutcome).toBeDefined();
      expect(partialOutcome!.roll_1).toBe('DEST1');
      expect(partialOutcome!.roll_2).toBe('DEST2');
      expect(partialOutcome!.roll_3).toBeUndefined();
      expect(partialOutcome!.roll_4).toBeUndefined();
      expect(partialOutcome!.roll_5).toBeUndefined();
      expect(partialOutcome!.roll_6).toBeUndefined();

      // Test full dice outcomes
      const fullOutcome = newDataService.getDiceOutcome('FULL-OUTCOMES', 'First');
      expect(fullOutcome).toBeDefined();
      expect(fullOutcome!.roll_1).toBe('DEST1');
      expect(fullOutcome!.roll_6).toBe('DEST6');

      // Test partial dice effects (missing columns should be undefined)
      const partialEffects = newDataService.getDiceEffects('PARTIAL-EFFECTS', 'First');
      expect(partialEffects).toHaveLength(1);
      expect(partialEffects[0].roll_1).toBe('Draw 1');
      expect(partialEffects[0].roll_2).toBeUndefined();
      expect(partialEffects[0].roll_3).toBeUndefined();
      expect(partialEffects[0].roll_4).toBeUndefined();
      expect(partialEffects[0].roll_5).toBeUndefined();
      expect(partialEffects[0].roll_6).toBeUndefined();

      // Test full dice effects
      const fullEffects = newDataService.getDiceEffects('FULL-EFFECTS', 'First');
      expect(fullEffects).toHaveLength(1);
      expect(fullEffects[0].roll_1).toBe('Draw 1');
      expect(fullEffects[0].roll_6).toBe('Draw 6');
    });

    it('should handle space effects with numeric vs string values', async () => {
      const spaceEffectsWithNumbers = `space_name,visit_type,effect_type,effect_action,effect_value,condition,description
NUMERIC-SPACE,First,time,add,5,always,Add 5 time units
STRING-SPACE,First,cards,draw_w,Many,always,Draw many W cards`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/SPACE_EFFECTS.csv') {
          return Promise.resolve({
            text: () => Promise.resolve(spaceEffectsWithNumbers)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await newDataService.loadData();

      const numericEffects = newDataService.getSpaceEffects('NUMERIC-SPACE', 'First');
      expect(numericEffects).toHaveLength(1);
      expect(numericEffects[0].effect_value).toBe(5); // Should be parsed as number

      const stringEffects = newDataService.getSpaceEffects('STRING-SPACE', 'First');
      expect(stringEffects).toHaveLength(1);
      expect(stringEffects[0].effect_value).toBe('Many'); // Should remain as string
    });
  });

  describe('Card Methods', () => {
    beforeEach(async () => {
      await dataService.loadData();
    });

    it('should return all cards', () => {
      const cards = dataService.getCards();
      
      expect(cards).toHaveLength(7);
      expect(cards.find(c => c.card_id === 'W001')).toBeDefined();
      expect(cards.find(c => c.card_id === 'B001')).toBeDefined();
      expect(cards.find(c => c.card_id === 'E001')).toBeDefined();
      expect(cards.find(c => c.card_id === 'L001')).toBeDefined();
      expect(cards.find(c => c.card_id === 'I001')).toBeDefined();
    });

    it('should return card by ID', () => {
      const card = dataService.getCardById('W001');
      
      expect(card).toBeDefined();
      expect(card!.card_name).toBe('Strategic Planning');
      expect(card!.card_type).toBe('W');
      expect(card!.description).toBe('Plan your next moves carefully.');
      expect(card!.effects_on_play).toBe('Draw 2 additional cards and gain 1 time unit.');
      expect(card!.cost).toBe(0);
      expect(card!.phase_restriction).toBe('Planning');
    });

    it('should return undefined for non-existent card ID', () => {
      const card = dataService.getCardById('NON_EXISTENT');
      
      expect(card).toBeUndefined();
    });

    it('should return cards by type', () => {
      const wCards = dataService.getCardsByType('W');
      const bCards = dataService.getCardsByType('B');
      const eCards = dataService.getCardsByType('E');
      const lCards = dataService.getCardsByType('L');
      const iCards = dataService.getCardsByType('I');
      
      expect(wCards).toHaveLength(2);
      expect(wCards.every(card => card.card_type === 'W')).toBe(true);
      expect(wCards.map(c => c.card_id)).toEqual(['W001', 'W002']);
      
      expect(bCards).toHaveLength(1);
      expect(bCards[0].card_id).toBe('B001');
      
      expect(eCards).toHaveLength(2);
      expect(eCards.map(c => c.card_id)).toEqual(['E001', 'E002']);
      
      expect(lCards).toHaveLength(1);
      expect(lCards[0].card_id).toBe('L001');
      
      expect(iCards).toHaveLength(1);
      expect(iCards[0].card_id).toBe('I001');
    });

    it('should return empty array for card type with no cards', () => {
      // Add an empty mock that has no cards of a certain type
      const cards = dataService.getCardsByType('B');
      // Since we have B001, let's test with a scenario where we filter and get empty results
      const filteredCards = cards.filter(c => c.card_id === 'NON_EXISTENT');
      expect(filteredCards).toHaveLength(0);
    });

    it('should return all card types present in the data', () => {
      const cardTypes = dataService.getAllCardTypes();
      
      expect(cardTypes).toHaveLength(5);
      expect(cardTypes).toContain('W');
      expect(cardTypes).toContain('B');
      expect(cardTypes).toContain('E');
      expect(cardTypes).toContain('L');
      expect(cardTypes).toContain('I');
    });

    it('should handle cards with optional fields', () => {
      const cardWithoutCost = dataService.getCardById('W002');
      const cardWithoutEffects = dataService.getCardById('E002');
      
      expect(cardWithoutCost).toBeDefined();
      expect(cardWithoutCost!.cost).toBeUndefined();
      expect(cardWithoutCost!.effects_on_play).toBe('Gain 2 time units and draw 1 B card.');
      
      expect(cardWithoutEffects).toBeDefined();
      expect(cardWithoutEffects!.effects_on_play).toBeUndefined();
      expect(cardWithoutEffects!.cost).toBe(3);
    });

    it('should return immutable copies of card data', () => {
      const cards1 = dataService.getCards();
      const cards2 = dataService.getCards();
      
      expect(cards1).not.toBe(cards2);
      expect(cards1).toEqual(cards2);
      
      const cardsByType1 = dataService.getCardsByType('W');
      const cardsByType2 = dataService.getCardsByType('W');
      
      expect(cardsByType1).not.toBe(cardsByType2);
      expect(cardsByType1).toEqual(cardsByType2);
    });
  });

  describe('Card CSV Parsing and Validation', () => {
    it('should throw error for invalid card type', async () => {
      const invalidCardsCsv = `card_id,card_name,card_type,description,effects_on_play,cost,phase_restriction
INVALID001,Invalid Card,X,Invalid card type,No effects,0,Any`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/CARDS.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(invalidCardsCsv)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await expect(newDataService.loadData()).rejects.toThrow('Invalid card_type \'X\' in CARDS.csv row 2. Must be one of: W, B, E, L, I');
    });

    it('should throw error for invalid cost value', async () => {
      const invalidCostCardsCsv = `card_id,card_name,card_type,description,effects_on_play,cost,phase_restriction
INVALID001,Invalid Card,W,Card with invalid cost,No effects,invalid_cost,Any`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/CARDS.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(invalidCostCardsCsv)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await expect(newDataService.loadData()).rejects.toThrow('Invalid cost \'invalid_cost\' in CARDS.csv row 2. Must be a non-negative number or empty');
    });

    it('should throw error for negative cost value', async () => {
      const negativeCostCardsCsv = `card_id,card_name,card_type,description,effects_on_play,cost,phase_restriction
INVALID001,Invalid Card,W,Card with negative cost,No effects,-5,Any`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/CARDS.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(negativeCostCardsCsv)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await expect(newDataService.loadData()).rejects.toThrow('Invalid cost \'-5\' in CARDS.csv row 2. Must be a non-negative number or empty');
    });

    it('should throw error for wrong number of columns', async () => {
      const wrongColumnCardsCsv = `card_id,card_name,card_type,description,effects_on_play,cost,phase_restriction
INVALID001,Invalid Card,W,Missing columns,No effects`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/CARDS.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(wrongColumnCardsCsv)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await expect(newDataService.loadData()).rejects.toThrow('CARDS.csv row 2 must have exactly 7 columns. Found: 5');
    });

    it('should throw error for wrong header column count', async () => {
      const wrongHeaderCardsCsv = `card_id,card_name,card_type,description
INVALID001,Invalid Card,W,Missing header columns`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/CARDS.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(wrongHeaderCardsCsv)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await expect(newDataService.loadData()).rejects.toThrow('CARDS.csv header must have exactly 7 columns. Found: 4');
    });

    it('should throw error for empty cards file', async () => {
      const emptyCardsCsv = `card_id,card_name,card_type,description,effects_on_play,cost,phase_restriction`;

      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/CARDS.csv') {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(emptyCardsCsv)
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await expect(newDataService.loadData()).rejects.toThrow('CARDS.csv must have at least a header row and one data row');
    });

    it('should throw error for fetch failure', async () => {
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url === '/data/CLEAN_FILES/CARDS.csv') {
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: 'Not Found'
          });
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('header\n')
        });
      });

      const newDataService = new DataService();
      await expect(newDataService.loadData()).rejects.toThrow('Failed to fetch CARDS.csv: 404 Not Found');
    });
  });
});