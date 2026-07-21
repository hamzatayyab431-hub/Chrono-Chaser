import Phaser from 'phaser';
import { PersistentState } from '../systems/PersistentState';

export interface SwitchConfig {
  id: string;
  persistentState: PersistentState;
  textureKey?: string;
}

export class Switch extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  private persistentState: PersistentState;

  constructor(scene: Phaser.Scene, x: number, y: number, config: SwitchConfig) {
    super(scene, x, y, config.textureKey || 'switch-texture');
    this.id = config.id;
    this.persistentState = config.persistentState;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static physics body

    this.syncState();

    // Listen for state changes
    this.persistentState.onChange((key, _val) => {
      if (key === this.id) {
        this.syncState();
      }
    });
  }

  /**
   * One-Way Latch Activation.
   * Once turned ON, a switch stays ON to ensure level geometry only ever opens.
   */
  public activate(): void {
    if (this.persistentState.getState(this.id)) {
      return; // Already active (one-way latch guard)
    }

    this.persistentState.setState(this.id, true);
  }

  /**
   * Synchronizes visual state with PersistentState.
   */
  public syncState(): void {
    const isActive = this.persistentState.getState(this.id);
    if (isActive) {
      this.setTint(0x00FF66); // Neon Green when active
    } else {
      this.setTint(0xFF3366); // Neon Pink/Red when inactive
    }
  }
}
