import Phaser from 'phaser';
import { PersistentState } from '../systems/PersistentState';

export interface GateConfig {
  id: string;
  controlId: string;
  persistentState: PersistentState;
  textureKey?: string;
}

export class Gate extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  public readonly controlId: string;
  private persistentState: PersistentState;

  constructor(scene: Phaser.Scene, x: number, y: number, config: GateConfig) {
    super(scene, x, y, config.textureKey || 'gate-texture');
    this.id = config.id;
    this.controlId = config.controlId;
    this.persistentState = config.persistentState;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static physics body

    this.syncState();

    // Listen for state changes in PersistentState
    this.persistentState.onChange((key, _val) => {
      if (key === this.controlId) {
        this.syncState();
      }
    });
  }

  /**
   * Pre-tick & real-time state sync.
   * Disables physics collision and lowers opacity when open.
   */
  public syncState(): void {
    const isOpen = this.persistentState.getState(this.controlId);
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (isOpen) {
      if (body) {
        body.enable = false; // Disables physics collisions
      }
      this.setAlpha(0.2);
      this.setTint(0x444466);
    } else {
      if (body) {
        body.enable = true; // Enables solid physics collisions
      }
      this.setAlpha(1.0);
      this.setTint(0xFFDF00); // Glowing gold barrier when closed
    }
  }
}
