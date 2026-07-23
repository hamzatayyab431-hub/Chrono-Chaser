import Phaser from 'phaser';
import { Player } from './Player';
import type { PlayerInput } from '../types/PlayerInput';

export class Ghost extends Player {
  private trailTimer: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    loopNumber: number,
    textureKey: string = 'player-texture'
  ) {
    super(scene, x, y, textureKey);

    // Distinct Ghost Aesthetics
    this.setAlpha(0.65);

    // Color tinting per loop: Loop 1 = Cyan, Loop 2 = Purple/Magenta, Loop 3 = Gold
    const tints = [0x00F0FF, 0xCE42FF, 0xFFDF00, 0x00FF88];
    const tintColor = tints[(loopNumber - 1) % tints.length];
    this.setTint(tintColor);

    // Ethereal pulsing glow tween
    if (scene && scene.tweens) {
      scene.tweens.add({
        targets: this,
        alpha: { from: 0.5, to: 0.8 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Ghost physics step driven by recorded input frames.
   * Spawns a subtle visual motion trail every 6 physics ticks.
   */
  public override physicsStep(input: PlayerInput, _playAudio: boolean = false): void {
    super.physicsStep(input, false);

    // Motion Trail Effect (visual only, no physics impact)
    this.trailTimer++;
    if (this.trailTimer >= 6) {
      this.trailTimer = 0;
      this.spawnTrailGhost();
    }
  }

  private spawnTrailGhost(): void {
    if (!this.scene) return;

    const shadow = this.scene.add.sprite(this.x, this.y, this.texture.key);
    shadow.setAlpha(0.25);
    shadow.setTint(this.tintTopLeft);
    shadow.setFlipX(this.flipX);

    this.scene.tweens.add({
      targets: shadow,
      alpha: 0,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 250,
      ease: 'Power1',
      onComplete: () => {
        shadow.destroy();
      },
    });
  }
}
