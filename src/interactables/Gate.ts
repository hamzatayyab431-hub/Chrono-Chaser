import Phaser from 'phaser';
import { PersistentState } from '../systems/PersistentState';
import { SoundEffects } from '../systems/SoundEffects';

export interface GateConfig {
  id: string;
  controlId?: string;
  controlIds?: string[];
  mode?: 'all' | 'any';
  persistentState: PersistentState;
  textureKey?: string;
}

export class Gate extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  public readonly controlIds: string[];
  public readonly mode: 'all' | 'any';
  private persistentState: PersistentState;

  constructor(scene: Phaser.Scene, x: number, y: number, config: GateConfig) {
    super(scene, x, y, config.textureKey || 'gate-texture');
    this.id = config.id;
    this.controlIds = config.controlIds
      ? [...config.controlIds]
      : config.controlId
        ? [config.controlId]
        : [];
    this.mode = config.mode || 'all';
    this.persistentState = config.persistentState;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static physics body

    this.syncState();

    // Listen for state changes in PersistentState
    this.persistentState.onChange((key, _val) => {
      if (key === this.id || this.controlIds.includes(key)) {
        this.syncState();
      }
    });
  }

  /**
   * Pre-tick & real-time state sync.
   * Disables physics collision and lowers opacity when open.
   * Latches OPEN permanently in PersistentState if conditions are met.
   */
  public syncState(): void {
    let isOpen = this.persistentState.getState(this.id);
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!isOpen) {
      const conditionMet =
        this.mode === 'any'
          ? this.controlIds.some((cId) => this.persistentState.getState(cId))
          : this.controlIds.length > 0 &&
            this.controlIds.every((cId) => this.persistentState.getState(cId));

      if (conditionMet) {
        SoundEffects.playGateOpen();
        this.persistentState.setState(this.id, true);
        isOpen = true;
      }
    }

    if (isOpen) {
      if (body) {
        body.enable = false; // Disables solid physics collisions
      }
      this.setAlpha(0.2);
      this.setTint(0x444466);
    } else {
      if (body) {
        body.enable = true; // Solid physics collision
      }
      this.setAlpha(1.0);
      this.setTint(0xFFDF00); // Glowing gold barrier when closed
    }
  }
}
