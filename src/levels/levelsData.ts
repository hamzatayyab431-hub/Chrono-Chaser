import type { LevelData } from '../types/LevelData';

export const LEVELS_DATA: LevelData[] = [
  // --- LEVEL 1: First Steps ---
  {
    id: 'level-01',
    name: 'First Steps',
    description: 'Loop 1: Jump up left to flip the switch. Loop 2: Walk through the unlocked gate to the exit.',
    loopDurationSeconds: 15,
    maxLoops: 2,
    spawnPoint: { x: 100, y: 410 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 }, // Floor
      { x: 16, y: 300, width: 32, height: 600 },  // Left Wall
      { x: 784, y: 300, width: 32, height: 600 }, // Right Wall
      { x: 400, y: 16, width: 800, height: 32 },  // Ceiling
      { x: 100, y: 460, width: 140, height: 32 }, // Spawn Platform
      { x: 180, y: 385, width: 80, height: 32 },  // Stepping Ledge
      { x: 100, y: 310, width: 120, height: 32 }, // High Left Switch Ledge
      { x: 420, y: 460, width: 160, height: 32 }, // Middle Platform
      { x: 680, y: 460, width: 160, height: 32 }, // Exit Ledge
    ],
    switches: [
      { id: 'switch-1', x: 80, y: 278 },
    ],
    gates: [
      { id: 'gate-1', x: 260, y: 420, controlIds: ['switch-1'], mode: 'all' },
    ],
    goalZone: { id: 'goal-1', x: 700, y: 412 },
  },

  // --- LEVEL 2: Time Relay ---
  {
    id: 'level-02',
    name: 'Time Relay',
    description: 'The switch is far away. Have your past self flip the switch while you sprint to the gate.',
    loopDurationSeconds: 15,
    maxLoops: 2,
    spawnPoint: { x: 100, y: 410 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 },
      { x: 16, y: 300, width: 32, height: 600 },
      { x: 784, y: 300, width: 32, height: 600 },
      { x: 400, y: 16, width: 800, height: 32 },
      { x: 100, y: 460, width: 140, height: 32 }, // Spawn Platform
      { x: 120, y: 320, width: 140, height: 32 }, // High Left Ledge
      { x: 380, y: 440, width: 180, height: 32 }, // Middle Ledge
      { x: 650, y: 460, width: 160, height: 32 }, // Exit Platform
    ],
    switches: [
      { id: 'switch-relay', x: 100, y: 288 },
    ],
    gates: [
      { id: 'gate-relay', x: 580, y: 428, controlIds: ['switch-relay'], mode: 'all' },
    ],
    goalZone: { id: 'goal-2', x: 700, y: 400 },
  },

  // --- LEVEL 3: Dual Pressure ---
  {
    id: 'level-03',
    name: 'Dual Pressure',
    description: 'Requires two bodies standing on separate pressure plates at the same time.',
    loopDurationSeconds: 15,
    maxLoops: 3,
    spawnPoint: { x: 100, y: 410 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 },
      { x: 16, y: 300, width: 32, height: 600 },
      { x: 784, y: 300, width: 32, height: 600 },
      { x: 400, y: 16, width: 800, height: 32 },
      { x: 100, y: 460, width: 140, height: 32 }, // Spawn Platform
      { x: 350, y: 440, width: 200, height: 32 }, // Middle Ledge
      { x: 650, y: 340, width: 160, height: 32 }, // Exit Ledge
    ],
    pressurePlates: [
      { id: 'plate-a', x: 350, y: 428 },
      { id: 'plate-b', x: 520, y: 562 },
    ],
    gates: [
      { id: 'gate-dual', x: 580, y: 308, controlIds: ['plate-a', 'plate-b'], mode: 'all' },
    ],
    goalZone: { id: 'goal-3', x: 700, y: 280 },
  },

  // --- LEVEL 4: Triple Synchrony ---
  {
    id: 'level-04',
    name: 'Triple Synchrony',
    description: 'Coordinate three past selves to trigger a switch and two pressure plates simultaneously.',
    loopDurationSeconds: 15,
    maxLoops: 4,
    spawnPoint: { x: 100, y: 410 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 },
      { x: 16, y: 300, width: 32, height: 600 },
      { x: 784, y: 300, width: 32, height: 600 },
      { x: 400, y: 16, width: 800, height: 32 },
      { x: 100, y: 460, width: 140, height: 32 }, // Spawn Platform
      { x: 120, y: 300, width: 140, height: 32 }, // High Left Ledge
      { x: 350, y: 440, width: 200, height: 32 }, // Middle Ledge
      { x: 650, y: 340, width: 160, height: 32 }, // Exit Platform
    ],
    switches: [
      { id: 'sw-triple', x: 100, y: 268 },
    ],
    pressurePlates: [
      { id: 'plate-tri-a', x: 350, y: 428 },
      { id: 'plate-tri-b', x: 500, y: 562 },
    ],
    gates: [
      { id: 'gate-triple', x: 580, y: 308, controlIds: ['sw-triple', 'plate-tri-a', 'plate-tri-b'], mode: 'all' },
    ],
    goalZone: { id: 'goal-4', x: 700, y: 280 },
  },

  // --- LEVEL 5: Chrono Master (Finale) ---
  {
    id: 'level-05',
    name: 'Chrono Master',
    description: 'The master challenge. Navigate nested barriers and coordinate a 4-ghost army to escape.',
    loopDurationSeconds: 15,
    maxLoops: 4,
    spawnPoint: { x: 100, y: 430 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 },
      { x: 16, y: 300, width: 32, height: 600 },
      { x: 784, y: 300, width: 32, height: 600 },
      { x: 400, y: 16, width: 800, height: 32 },
      { x: 100, y: 480, width: 140, height: 32 }, // Spawn Platform
      { x: 140, y: 340, width: 140, height: 32 }, // Left Ledge
      { x: 300, y: 350, width: 32, height: 260 }, // Outer Wall Barrier Column
      { x: 380, y: 440, width: 180, height: 32 }, // Middle Ledge
      { x: 650, y: 340, width: 160, height: 32 }, // Master Exit Platform
    ],
    switches: [
      { id: 'sw-finale-1', x: 120, y: 308 },
      { id: 'sw-finale-2', x: 380, y: 408 },
    ],
    pressurePlates: [
      { id: 'plate-fin-a', x: 250, y: 562 },
      { id: 'plate-fin-b', x: 500, y: 562 },
    ],
    gates: [
      { id: 'gate-fin-outer', x: 300, y: 520, controlIds: ['sw-finale-1'], mode: 'all' },
      { id: 'gate-fin-inner', x: 580, y: 308, controlIds: ['sw-finale-2', 'plate-fin-a', 'plate-fin-b'], mode: 'all' },
    ],
    goalZone: { id: 'goal-5', x: 700, y: 280 },
  },
];
