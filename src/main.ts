import Phaser from 'phaser';
import { LevelScene } from './scenes/LevelScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'app',
  pixelArt: true,
  backgroundColor: '#0A081D',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      customUpdate: true, // Crucial: disables auto Arcade Physics updates for deterministic control
      debug: false,
    },
  },
  scene: [LevelScene],
};

new Phaser.Game(config);
