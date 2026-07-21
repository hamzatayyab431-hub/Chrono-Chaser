import Phaser from 'phaser';
import { Player } from '../actors/Player';
import { InputRecorder } from '../actors/InputRecorder';
import { DeterminismTest, type DeterminismTestResult } from '../systems/DeterminismTest';

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private inputRecorder!: InputRecorder;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;

  // Fixed Timestep Accumulator settings
  private accumulator: number = 0;
  private readonly fixedDeltaTime: number = 1000 / 60; // 16.666ms per tick
  private readonly maxStepsPerFrame: number = 5; // Clamped to prevent spiral of death
  private currentTick: number = 0;

  // Loop Timer
  private readonly loopDuration: number = 15.0; // 15 seconds
  private remainingSeconds: number = 15.0;
  private loopCount: number = 1;

  // HUD Elements
  private timerText!: Phaser.GameObjects.Text;
  private loopText!: Phaser.GameObjects.Text;
  private ticksText!: Phaser.GameObjects.Text;
  private testStatusText!: Phaser.GameObjects.Text;

  private keyR!: Phaser.Input.Keyboard.Key;
  private keyT!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'LevelScene' });
  }

  create(): void {
    // Generate placeholder textures programmatically
    this.generateDynamicTextures();

    // Set up background
    this.add.rectangle(400, 300, 800, 600, 0x121026);

    // Create Platforms & Level Geometry
    this.platforms = this.physics.add.staticGroup();
    this.buildTestRoom();

    // Create Player
    this.player = new Player(this, 64, 400, 'player-texture');
    this.physics.add.collider(this.player, this.platforms);

    // Create Input Recorder
    this.inputRecorder = new InputRecorder(this);

    // Keyboard shortcuts
    if (this.input.keyboard) {
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    }

    // Set up HUD
    this.setupHUD();

    // Reset loop state
    this.resetLoop();

    // Run initial determinism smoke test automatically
    this.runSmokeTest();
  }

  private generateDynamicTextures(): void {
    // Player Texture: 32x48 cyan glowing rectangle
    if (!this.textures.exists('player-texture')) {
      const pCanvas = this.textures.createCanvas('player-texture', 32, 48);
      if (pCanvas) {
        const ctx = pCanvas.getContext();
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(0, 0, 32, 48);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 30, 46);
        // Face visor
        ctx.fillStyle = '#0A081D';
        ctx.fillRect(18, 10, 10, 8);
        pCanvas.refresh();
      }
    }

    // Tile Texture: 32x32 retro dark purple block with glowing top
    if (!this.textures.exists('block-texture')) {
      const bCanvas = this.textures.createCanvas('block-texture', 32, 32);
      if (bCanvas) {
        const ctx = bCanvas.getContext();
        ctx.fillStyle = '#2A2050';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#7B52FF';
        ctx.fillRect(0, 0, 32, 4); // Top highlight
        ctx.strokeStyle = '#3D2D75';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 32, 32);
        bCanvas.refresh();
      }
    }
  }

  private buildTestRoom(): void {
    // Floor (y=568, width 800)
    for (let x = 16; x <= 784; x += 32) {
      this.platforms.create(x, 584, 'block-texture').refreshBody();
    }

    // Left Wall
    for (let y = 16; y <= 550; y += 32) {
      this.platforms.create(16, y, 'block-texture').refreshBody();
    }

    // Right Wall
    for (let y = 16; y <= 550; y += 32) {
      this.platforms.create(784, y, 'block-texture').refreshBody();
    }

    // Ceiling
    for (let x = 16; x <= 784; x += 32) {
      this.platforms.create(x, 16, 'block-texture').refreshBody();
    }

    // Low Middle Floating Platform (x: 250..450, y: 440)
    for (let x = 250; x <= 450; x += 32) {
      this.platforms.create(x, 440, 'block-texture').refreshBody();
    }

    // High Right Platform (x: 550..700, y: 300)
    for (let x = 550; x <= 700; x += 32) {
      this.platforms.create(x, 300, 'block-texture').refreshBody();
    }
  }

  private setupHUD(): void {
    const textStyle = {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00F0FF',
    };

    // Header Panel Background
    this.add.rectangle(400, 30, 760, 40, 0x0a081d, 0.8).setStrokeStyle(1, 0x7b52ff);

    this.timerText = this.add.text(40, 22, 'TIME: 15.00s', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#FFDF00',
    });

    this.loopText = this.add.text(240, 22, 'LOOP: 1', textStyle);
    this.ticksText = this.add.text(380, 22, 'TICKS: 0', textStyle);

    this.testStatusText = this.add.text(40, 75, 'Smoke Test: Checking...', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#00FF66',
    });

    // Control tips footer
    this.add.text(
      40,
      545,
      '[A/D or Arrows] Move  |  [Space/W/Up] Jump (Coyote & Buffer active)  |  [R] Restart  |  [T] Run Test',
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#A0A0C0',
      }
    );
  }

  private runSmokeTest(): void {
    const result: DeterminismTestResult = DeterminismTest.runTest(this);
    if (result.passed) {
      this.testStatusText.setText(`Smoke Test: PASS (180 ticks identical)`).setColor('#00FF66');
    } else {
      this.testStatusText.setText(`Smoke Test: FAIL (Desync detected)`).setColor('#FF3366');
    }
  }

  private resetLoop(): void {
    this.player.resetTo(64, 400);
    this.remainingSeconds = this.loopDuration;
    this.inputRecorder.reset();
  }

  private restartFullLevel(): void {
    this.loopCount = 1;
    this.currentTick = 0;
    this.resetLoop();
  }

  update(_time: number, delta: number): void {
    // Handle R key full restart
    if (this.keyR && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartFullLevel();
      return;
    }

    // Handle T key smoke test trigger
    if (this.keyT && Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.runSmokeTest();
    }

    // Accumulate time delta and clamp max step limit (prevents spiral of death)
    const clampedDelta = Math.min(delta, 250);
    this.accumulator += clampedDelta;

    let steps = 0;
    while (this.accumulator >= this.fixedDeltaTime && steps < this.maxStepsPerFrame) {
      // 1. Sample input frame for live tick
      const input = this.inputRecorder.sampleInput(this.currentTick);

      // 2. Feed input frame into player
      this.player.physicsStep(input);

      // 3. Step physics simulation by 16.666ms
      this.physics.world.step(this.fixedDeltaTime / 1000);

      this.currentTick++;
      this.remainingSeconds -= 1 / 60;
      this.accumulator -= this.fixedDeltaTime;
      steps++;

      // Loop expiration check
      if (this.remainingSeconds <= 0) {
        this.loopCount++;
        this.resetLoop();
        break;
      }
    }

    // If accumulator exceeds max step limit, drop excess to avoid lag spiral
    if (steps >= this.maxStepsPerFrame) {
      this.accumulator = 0;
    }

    this.updateHUD();
  }

  private updateHUD(): void {
    const displayTime = Math.max(0, this.remainingSeconds).toFixed(2);
    this.timerText.setText(`TIME: ${displayTime}s`);
    this.loopText.setText(`LOOP: ${this.loopCount}`);
    this.ticksText.setText(`TICKS: ${this.currentTick}`);
  }
}
