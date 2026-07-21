import type { LevelData } from '../types/LevelData';

export const LEVELS_DATA: LevelData[] = [
  // --- LEVEL 1: First Steps ---
  {
    id: 'level-01',
    name: 'First Steps',
    description: 'Learn to use past loops. Flip the switch on the middle platform to open the gate.',
    loopDurationSeconds: 15,
    maxLoops: 2,
    spawnPoint: { x: 64, y: 400 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 }, // Floor
      { x: 16, y: 300, width: 32, height: 600 },  // Left Wall
      { x: 784, y: 300, width: 32, height: 600 }, // Right Wall
      { x: 400, y: 16, width: 800, height: 32 },  // Ceiling
      { x: 350, y: 440, width: 200, height: 32 }, // Middle Platform
      { x: 640, y: 300, width: 160, height: 32 }, // High Right Platform
    ],
    switches: [
      { id: 'switch-1', x: 300, y: 408 },
    ],
    gates: [
      { id: 'gate-1', x: 540, y: 368, controlIds: ['switch-1'], mode: 'all' },
    ],
    goalZone: { id: 'goal-1', x: 700, y: 240 },
  },

  // --- LEVEL 2: Time Relay ---
  {
    id: 'level-02',
    name: 'Time Relay',
    description: 'The switch is far away. Have your past self flip the switch while you sprint to the gate.',
    loopDurationSeconds: 15,
    maxLoops: 2,
    spawnPoint: { x: 64, y: 500 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 },
      { x: 16, y: 300, width: 32, height: 600 },
      { x: 784, y: 300, width: 32, height: 600 },
      { x: 400, y: 16, width: 800, height: 32 },
      { x: 120, y: 350, width: 140, height: 32 }, // High Left Ledge
      { x: 300, y: 450, width: 140, height: 32 }, // Middle Ledge
      { x: 640, y: 500, width: 160, height: 32 }, // Exit Platform
    ],
    switches: [
      { id: 'switch-relay', x: 100, y: 318 },
    ],
    gates: [
      { id: 'gate-relay', x: 580, y: 520, controlIds: ['switch-relay'], mode: 'all' },
    ],
    goalZone: { id: 'goal-2', x: 720, y: 440 },
  },

  // --- LEVEL 3: Dual Pressure ---
  {
    id: 'level-03',
    name: 'Dual Pressure',
    description: 'Requires two bodies standing on separate pressure plates at the same time.',
    loopDurationSeconds: 15,
    maxLoops: 3,
    spawnPoint: { x: 64, y: 400 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 },
      { x: 16, y: 300, width: 32, height: 600 },
      { x: 784, y: 300, width: 32, height: 600 },
      { x: 400, y: 16, width: 800, height: 32 },
      { x: 350, y: 440, width: 200, height: 32 },
      { x: 640, y: 300, width: 160, height: 32 },
    ],
    pressurePlates: [
      { id: 'plate-a', x: 380, y: 428 },
      { id: 'plate-b', x: 520, y: 562 },
    ],
    gates: [
      { id: 'gate-dual', x: 580, y: 250, controlIds: ['plate-a', 'plate-b'], mode: 'all' },
    ],
    goalZone: { id: 'goal-3', x: 700, y: 240 },
  },

  // --- LEVEL 4: Triple Synchrony ---
  {
    id: 'level-04',
    name: 'Triple Synchrony',
    description: 'Coordinate three past selves to trigger a switch and two pressure plates simultaneously.',
    loopDurationSeconds: 15,
    maxLoops: 4,
    spawnPoint: { x: 64, y: 400 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 },
      { x: 16, y: 300, width: 32, height: 600 },
      { x: 784, y: 300, width: 32, height: 600 },
      { x: 400, y: 16, width: 800, height: 32 },
      { x: 140, y: 280, width: 140, height: 32 },
      { x: 350, y: 440, width: 200, height: 32 },
      { x: 640, y: 300, width: 160, height: 32 },
    ],
    switches: [
      { id: 'sw-triple', x: 120, y: 248 },
    ],
    pressurePlates: [
      { id: 'plate-tri-a', x: 350, y: 428 },
      { id: 'plate-tri-b', x: 500, y: 562 },
    ],
    gates: [
      { id: 'gate-triple', x: 580, y: 250, controlIds: ['sw-triple', 'plate-tri-a', 'plate-tri-b'], mode: 'all' },
    ],
    goalZone: { id: 'goal-4', x: 720, y: 240 },
  },

  // --- LEVEL 5: Chrono Master (Finale) ---
  {
    id: 'level-05',
    name: 'Chrono Master',
    description: 'The master challenge. Navigate nested barriers and coordinate a 4-ghost army to escape.',
    loopDurationSeconds: 15,
    maxLoops: 4,
    spawnPoint: { x: 64, y: 500 },
    platforms: [
      { x: 400, y: 584, width: 800, height: 32 },
      { x: 16, y: 300, width: 32, height: 600 },
      { x: 784, y: 300, width: 32, height: 600 },
      { x: 400, y: 16, width: 800, height: 32 },
      { x: 140, y: 350, width: 140, height: 32 }, // Left Ledge
      { x: 380, y: 440, width: 180, height: 32 }, // Middle Ledge
      { x: 640, y: 280, width: 160, height: 32 }, // Master Exit Platform
    ],
    switches: [
      { id: 'sw-finale-1', x: 120, y: 318 },
      { id: 'sw-finale-2', x: 380, y: 408 },
    ],
    pressurePlates: [
      { id: 'plate-fin-a', x: 250, y: 562 },
      { id: 'plate-fin-b', x: 500, y: 562 },
    ],
    gates: [
      { id: 'gate-fin-outer', x: 300, y: 520, controlIds: ['sw-finale-1'], mode: 'all' },
      { id: 'gate-fin-inner', x: 580, y: 240, controlIds: ['sw-finale-2', 'plate-fin-a', 'plate-fin-b'], mode: 'all' },
    ],
    goalZone: { id: 'goal-5', x: 720, y: 220 },
  },
];
