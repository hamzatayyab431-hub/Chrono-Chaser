import Phaser from 'phaser';
import { PersistentState } from '../systems/PersistentState';

export interface PressurePlateConfig {
  id: string;
  persistentState: PersistentState;
  textureKey?: string;
}

export class PressurePlate extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  private persistentState: PersistentState;

  constructor(scene: Phaser.Scene, x: number, y: number, config: PressurePlateConfig) {
    super(scene, x, y, config.textureKey || 'plate-texture');
    this.id = config.id;
    this.persistentState = config.persistentState;

    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    this.syncState();

    this.persistentState.onChange((key, _val) => {
      if (key === this.id) {
        this.syncState();
      }
    });
  }

  /**
   * Update pressure plate state based on overlapping actor count.
   */
  public evaluateOverlaps(overlappingActorsCount: number): void {
    const isPressed = overlappingActorsCount > 0;
    this.persistentState.setState(this.id, isPressed);
  }

  public syncState(): void {
    const isPressed = this.persistentState.getState(this.id);
    if (isPressed) {
      this.setTint(0x00F0FF); // Glowing Cyan when depressed
      this.setScale(1, 0.5); // Depressed visual scale
    } else {
      this.setTint(0x7B52FF); // Deep Indigo/Purple when unpressed
      this.setScale(1, 1.0);
    }
  }
}
