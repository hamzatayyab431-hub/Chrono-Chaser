import Phaser from 'phaser';
import type { PlayerInput } from '../types/PlayerInput';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private coyoteTicks: number = 0;
  private jumpBufferTicks: number = 0;
  private readonly COYOTE_MAX_TICKS: number = 6; // 100ms at 60 FPS
  private readonly JUMP_BUFFER_MAX_TICKS: number = 6; // 100ms at 60 FPS

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey: string = 'player') {
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(true);
      body.setGravityY(1000);
      body.setSize(24, 38);
      body.setOffset(4, 5);
      body.setMaxVelocity(300, 800);
    }
  }

  /**
   * Deterministic physics update called once per 60Hz physics tick.
   */
  public physicsStep(input: PlayerInput): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Horizontal Movement
    if (input.left) {
      body.setVelocityX(-200);
      this.setFlipX(true);
    } else if (input.right) {
      body.setVelocityX(200);
      this.setFlipX(false);
    } else {
      body.setVelocityX(0);
    }

    // Ground Check & Coyote Time
    const isGrounded = body.blocked.down || body.touching.down;
    if (isGrounded) {
      this.coyoteTicks = this.COYOTE_MAX_TICKS;
    } else if (this.coyoteTicks > 0) {
      this.coyoteTicks--;
    }

    // Jump Buffering
    if (input.jump) {
      this.jumpBufferTicks = this.JUMP_BUFFER_MAX_TICKS;
    } else if (this.jumpBufferTicks > 0) {
      this.jumpBufferTicks--;
    }

    // Jump Trigger
    if (this.jumpBufferTicks > 0 && this.coyoteTicks > 0) {
      body.setVelocityY(-450);
      this.jumpBufferTicks = 0;
      this.coyoteTicks = 0;
    }
  }

  /**
   * Resets player state and position for a new loop.
   */
  public resetTo(x: number, y: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.reset(x, y);
      body.setVelocity(0, 0);
      body.setAcceleration(0, 0);
    } else {
      this.setPosition(x, y);
    }
    this.coyoteTicks = 0;
    this.jumpBufferTicks = 0;
  }
}
