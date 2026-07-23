import Phaser from 'phaser';
import type { PlayerInput } from '../types/PlayerInput';

export class InputRecorder {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyE!: Phaser.Input.Keyboard.Key;
  private keySpace!: Phaser.Input.Keyboard.Key;

  // DOM Window Event Fallback Listeners
  private domLeft: boolean = false;
  private domRight: boolean = false;
  private domJump: boolean = false;
  private domAction: boolean = false;

  private prevJumpDown: boolean = false;
  private prevActionDown: boolean = false;

  private boundKeyDownListener: (e: KeyboardEvent) => void;
  private boundKeyUpListener: (e: KeyboardEvent) => void;
  private boundBlurListener: () => void;

  constructor(scene: Phaser.Scene) {
    if (scene.input && scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyE = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.keySpace = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // Attach DOM window event listeners as a fail-safe for browser input focus
    this.boundKeyDownListener = (e: KeyboardEvent) => this.handleDomKeyDown(e);
    this.boundKeyUpListener = (e: KeyboardEvent) => this.handleDomKeyUp(e);
    this.boundBlurListener = () => this.reset();

    window.addEventListener('keydown', this.boundKeyDownListener);
    window.addEventListener('keyup', this.boundKeyUpListener);
    window.addEventListener('blur', this.boundBlurListener);

    // Clean up listeners when scene shuts down
    scene.events.once('shutdown', () => this.destroy());
    scene.events.once('destroy', () => this.destroy());
  }

  private handleDomKeyDown(e: KeyboardEvent): void {
    const code = e.code;
    const key = e.key.toLowerCase();

    if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a') {
      this.domLeft = true;
    }
    if (code === 'KeyD' || code === 'ArrowRight' || key === 'd') {
      this.domRight = true;
    }
    if (code === 'KeyW' || code === 'Space' || code === 'ArrowUp' || key === 'w' || key === ' ') {
      this.domJump = true;
    }
    if (code === 'KeyE' || key === 'e') {
      this.domAction = true;
    }
  }

  private handleDomKeyUp(e: KeyboardEvent): void {
    const code = e.code;
    const key = e.key.toLowerCase();

    if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a') {
      this.domLeft = false;
    }
    if (code === 'KeyD' || code === 'ArrowRight' || key === 'd') {
      this.domRight = false;
    }
    if (code === 'KeyW' || code === 'Space' || code === 'ArrowUp' || key === 'w' || key === ' ') {
      this.domJump = false;
    }
    if (code === 'KeyE' || key === 'e') {
      this.domAction = false;
    }
  }

  /**
   * Sample input state for the current physics tick.
   */
  public sampleInput(tick: number): PlayerInput {
    let phaserLeft = false;
    let phaserRight = false;
    let phaserJump = false;
    let phaserAction = false;

    if (this.cursors && this.keyA && this.keyD) {
      phaserLeft = this.cursors.left.isDown || this.keyA.isDown;
      phaserRight = this.cursors.right.isDown || this.keyD.isDown;
      phaserJump = this.cursors.up.isDown || this.keyW.isDown || this.keySpace.isDown;
      phaserAction = this.keyE.isDown;
    }

    const left = phaserLeft || this.domLeft;
    const right = phaserRight || this.domRight;
    const currJumpDown = phaserJump || this.domJump;
    const currActionDown = phaserAction || this.domAction;

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

  public setTouchLeft(down: boolean): void {
    this.domLeft = down;
  }

  public setTouchRight(down: boolean): void {
    this.domRight = down;
  }

  public setTouchJump(down: boolean): void {
    this.domJump = down;
  }

  public setTouchAction(down: boolean): void {
    this.domAction = down;
  }

  public reset(): void {
    this.prevJumpDown = false;
    this.prevActionDown = false;
    this.domLeft = false;
    this.domRight = false;
    this.domJump = false;
    this.domAction = false;
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDownListener);
    window.removeEventListener('keyup', this.boundKeyUpListener);
    window.removeEventListener('blur', this.boundBlurListener);
  }
}
