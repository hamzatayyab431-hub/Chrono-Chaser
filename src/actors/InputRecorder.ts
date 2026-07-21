import Phaser from 'phaser';
import type { PlayerInput } from '../types/PlayerInput';

export class InputRecorder {
  private scene: Phaser.Scene;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  private prevJumpDown: boolean = false;
  private prevActionDown: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    if (scene.input && scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }
  }

  /**
   * Sample input state for the current physics tick.
   */
  public sampleInput(tick: number): PlayerInput {
    if (!this.scene.input || !this.scene.input.keyboard) {
      return { tick, left: false, right: false, jump: false, action: false };
    }

    const left = this.cursors.left.isDown || this.keyA.isDown;
    const right = this.cursors.right.isDown || this.keyD.isDown;
    const currJumpDown = this.cursors.up.isDown || this.keyW.isDown || this.keySpace.isDown;
    const currActionDown = this.keyE.isDown;

    // Edge trigger for jump and action
    const jump = currJumpDown && !this.prevJumpDown;
    const action = currActionDown && !this.prevActionDown;

    this.prevJumpDown = currJumpDown;
    this.prevActionDown = currActionDown;

    return {
      tick,
      left,
      right,
      jump,
      action,
    };
  }

  public reset(): void {
    this.prevJumpDown = false;
    this.prevActionDown = false;
  }
}
