import Phaser from 'phaser';

export interface GoalZoneConfig {
  id?: string;
  textureKey?: string;
  unlocked?: boolean;
  onWin?: (player: Phaser.GameObjects.GameObject, goal: GoalZone) => void;
}

export class GoalZone extends Phaser.Physics.Arcade.Sprite {
  public readonly id: string;
  private isUnlocked: boolean = true;
  private glowTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number, config: GoalZoneConfig = {}) {
    const textureKey = config.textureKey || 'goal-texture';
    GoalZone.ensureDefaultTexture(scene, textureKey);

    super(scene, x, y, textureKey);
    this.id = config.id || 'goal-zone';
    this.isUnlocked = config.unlocked !== undefined ? config.unlocked : true;

    scene.add.existing(this);
    scene.physics.add.existing(this, true); // Static Arcade Physics body

    const body = this.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      body.updateFromGameObject();
    }

    this.initVisuals();

    if (config.onWin) {
      this.setupOverlapListener(config.onWin);
    }
  }

  /**
   * Generates a neon portal default texture if one does not already exist in the texture manager.
   */
  private static ensureDefaultTexture(scene: Phaser.Scene, textureKey: string): void {
    if (scene.textures.exists(textureKey)) {
      return;
    }

    const width = 48;
    const height = 64;
    const canvasTexture = scene.textures.createCanvas(textureKey, width, height);
    if (!canvasTexture) return;

    const ctx = canvasTexture.getContext();

    // Outer neon aura
    ctx.fillStyle = 'rgba(0, 255, 170, 0.25)';
    ctx.fillRect(0, 0, width, height);

    // Glowing Frame
    ctx.strokeStyle = '#00FFCC';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    // Inner Energy Core
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      4,
      width / 2,
      height / 2,
      width / 2
    );
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.3, '#00FFCC');
    gradient.addColorStop(0.7, '#0088FF');
    gradient.addColorStop(1, '#05001E');

    ctx.fillStyle = gradient;
    ctx.fillRect(6, 6, width - 12, height - 12);

    canvasTexture.refresh();
  }

  /**
   * Initializes visual neon aesthetics and pulsing animation.
   */
  private initVisuals(): void {
    if (this.scene && this.scene.tweens) {
      this.glowTween = this.scene.tweens.add({
        targets: this,
        alpha: { from: 0.85, to: 1.0 },
        scaleX: { from: 0.97, to: 1.03 },
        scaleY: { from: 0.97, to: 1.03 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    this.updateVisualState();
  }

  /**
   * Updates tint, alpha, and animation state based on lock state.
   */
  private updateVisualState(): void {
    if (this.isUnlocked) {
      this.setTint(0x00FFCC); // Vibrant neon cyan/green glow
      this.setAlpha(1.0);
      if (this.glowTween && this.glowTween.isPaused()) {
        this.glowTween.resume();
      }
    } else {
      this.setTint(0x555555); // Dimmed gray when locked
      this.setAlpha(0.4);
      if (this.glowTween && this.glowTween.isPlaying()) {
        this.glowTween.pause();
      }
    }
  }

  /**
   * Sets whether the exit portal is unlocked and active.
   */
  public setUnlocked(unlocked: boolean): void {
    this.isUnlocked = unlocked;
    this.updateVisualState();
  }

  /**
   * Returns whether the goal zone is unlocked.
   */
  public getIsUnlocked(): boolean {
    return this.isUnlocked;
  }

  /**
   * Checks if a player object is currently reaching / overlapping the goal zone.
   * Returns true only if unlocked and overlapping.
   */
  public checkWin(player: Phaser.GameObjects.GameObject): boolean {
    if (!this.isUnlocked || !this.active) {
      return false;
    }

    // Check physics overlap if Arcade physics is active on both objects
    const playerBody = (player as unknown as { body?: Phaser.Physics.Arcade.Body }).body;
    if (playerBody && this.body && this.scene && this.scene.physics) {
      return this.scene.physics.overlap(this, player);
    }

    // Fallback: geometric bounding box intersection
    const getBoundsObj = player as unknown as Phaser.GameObjects.Components.GetBounds;
    if (typeof getBoundsObj.getBounds === 'function') {
      const playerBounds = getBoundsObj.getBounds();
      const goalBounds = this.getBounds();
      return Phaser.Geom.Intersects.RectangleToRectangle(playerBounds, goalBounds);
    }

    return false;
  }

  /**
   * Attaches an Arcade Physics overlap listener to trigger a callback when player enters the goal zone.
   */
  public setupOverlapListener(
    playerOrCallback: Phaser.GameObjects.GameObject | ((player: Phaser.GameObjects.GameObject, goal: GoalZone) => void),
    callback?: (player: Phaser.GameObjects.GameObject, goal: GoalZone) => void
  ): Phaser.Physics.Arcade.Collider | null {
    let targetPlayer: Phaser.GameObjects.GameObject | undefined;
    let onWin: ((player: Phaser.GameObjects.GameObject, goal: GoalZone) => void) | undefined;

    if (typeof playerOrCallback === 'function') {
      onWin = playerOrCallback;
    } else {
      targetPlayer = playerOrCallback;
      onWin = callback;
    }

    if (targetPlayer && onWin && this.scene && this.scene.physics) {
      return this.scene.physics.add.overlap(this, targetPlayer, (goalObj, pObj) => {
        if (this.isUnlocked && onWin) {
          onWin(pObj as Phaser.GameObjects.GameObject, goalObj as GoalZone);
        }
      });
    }

    return null;
  }

  public destroy(fromScene?: boolean): void {
    if (this.glowTween) {
      this.glowTween.stop();
      this.glowTween = undefined;
    }
    super.destroy(fromScene);
  }
}
