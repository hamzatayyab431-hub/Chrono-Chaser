import Phaser from 'phaser';
import { Player } from '../actors/Player';
import { Ghost } from '../actors/Ghost';
import { InputRecorder } from '../actors/InputRecorder';
import { LoopManager } from '../systems/LoopManager';
import { DeterminismTest, type DeterminismTestResult } from '../systems/DeterminismTest';

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private ghosts: Ghost[] = [];
  private inputRecorder!: InputRecorder;
  private loopManager!: LoopManager;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;

  // Fixed Timestep Accumulator settings
  private accumulator: number = 0;
  private readonly fixedDeltaTime: number = 1000 / 60; // 16.666ms per tick
  private readonly maxStepsPerFrame: number = 5; // Clamped to prevent spiral of death
  private currentTick: number = 0;

  // Loop Lifecycle
  private readonly loopDuration: number = 15.0; // 15 seconds
  private remainingSeconds: number = 15.0;
  private loopCount: number = 1;

  // HUD Elements
  private timerText!: Phaser.GameObjects.Text;
  private loopText!: Phaser.GameObjects.Text;
  private ghostCountText!: Phaser.GameObjects.Text;
  private ticksText!: Phaser.GameObjects.Text;
  private testStatusText!: Phaser.GameObjects.Text;

  private keyR!: Phaser.Input.Keyboard.Key;
  private keyT!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'LevelScene' });
  }

  create(): void {
    // Generate dynamic placeholder textures
    this.generateDynamicTextures();

    // Background
    this.add.rectangle(400, 300, 800, 600, 0x121026);

    // Systems & Managers
    this.loopManager = new LoopManager();

    // Create Platforms & Level Geometry
    this.platforms = this.physics.add.staticGroup();
    this.buildTestRoom();

    // Create Live Player
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

    // Start fresh level
    this.restartFullLevel();

    // Run initial determinism smoke test automatically
    this.runSmokeTest();
  }

  private generateDynamicTextures(): void {
    // Live Player Texture: 32x48 cyan glowing block
    if (!this.textures.exists('player-texture')) {
      const pCanvas = this.textures.createCanvas('player-texture', 32, 48);
      if (pCanvas) {
        const ctx = pCanvas.getContext();
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(0, 0, 32, 48);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, 30, 46);
        // Visor
        ctx.fillStyle = '#0A081D';
        ctx.fillRect(18, 10, 10, 8);
        pCanvas.refresh();
      }
    }

    // Platform Block Texture: 32x32 dark purple block
    if (!this.textures.exists('block-texture')) {
      const bCanvas = this.textures.createCanvas('block-texture', 32, 32);
      if (bCanvas) {
        const ctx = bCanvas.getContext();
        ctx.fillStyle = '#2A2050';
        ctx.fillRect(0, 0, 32, 32);
        ctx.fillStyle = '#7B52FF';
        ctx.fillRect(0, 0, 32, 4); // Top highlight border
        ctx.strokeStyle = '#3D2D75';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 32, 32);
        bCanvas.refresh();
      }
    }
  }

  private buildTestRoom(): void {
    // Floor
    for (let x = 16; x <= 784; x += 32) {
      this.platforms.create(x, 584, 'block-texture').refreshBody();
    }

    // Walls
    for (let y = 16; y <= 550; y += 32) {
      this.platforms.create(16, y, 'block-texture').refreshBody();
      this.platforms.create(784, y, 'block-texture').refreshBody();
    }

    // Ceiling
    for (let x = 16; x <= 784; x += 32) {
      this.platforms.create(x, 16, 'block-texture').refreshBody();
    }

    // Middle Floating Platform
    for (let x = 250; x <= 450; x += 32) {
      this.platforms.create(x, 440, 'block-texture').refreshBody();
    }

    // High Right Platform
    for (let x = 550; x <= 700; x += 32) {
      this.platforms.create(x, 300, 'block-texture').refreshBody();
    }
  }

  private setupHUD(): void {
    const textStyle = {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#00F0FF',
    };

    // Header Panel Background
    this.add.rectangle(400, 30, 760, 40, 0x0a081d, 0.85).setStrokeStyle(1, 0x7b52ff);

    this.timerText = this.add.text(30, 22, 'TIME: 15.00s', {
      fontFamily: 'monospace',
      fontSize: '17px',
      color: '#FFDF00',
    });

    this.loopText = this.add.text(210, 22, 'LOOP: 1', textStyle);
    this.ghostCountText = this.add.text(320, 22, 'GHOSTS: 0', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#CE42FF',
    });
    this.ticksText = this.add.text(460, 22, 'TICKS: 0', textStyle);

    this.testStatusText = this.add.text(30, 75, 'Determinism Check: Ready', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#00FF66',
    });

    // Control tips footer
    this.add.text(
      30,
      545,
      '[A/D] Move | [Space/W] Jump | [R] Restart Full Level (Clear Ghosts) | [T] Run Test',
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

  /**
   * Resets actors and spawns ghosts for a new loop.
   */
  private prepareNextLoop(): void {
    // 1. Finalize current loop's recording
    this.loopManager.finalizeLoop();

    // 2. Increment loop count
    this.loopCount++;

    // 3. Destroy existing ghosts (clean lifecycle management)
    this.destroyActiveGhosts();

    // 4. Spawn ghosts for all previously recorded loops
    const completedLoops = this.loopManager.getCompletedLoopCount();
    for (let i = 0; i < completedLoops; i++) {
      const ghost = new Ghost(this, 64, 400, i + 1, 'player-texture');
      this.physics.add.collider(ghost, this.platforms);
      this.ghosts.push(ghost);
    }

    // 5. Reset live player and state variables
    this.player.resetTo(64, 400);
    this.remainingSeconds = this.loopDuration;
    this.currentTick = 0;
    this.inputRecorder.reset();
  }

  private restartFullLevel(): void {
    this.loopManager.clearAllHistory();
    this.destroyActiveGhosts();
    this.loopCount = 1;
    this.remainingSeconds = this.loopDuration;
    this.currentTick = 0;
    this.player.resetTo(64, 400);
    this.inputRecorder.reset();
  }

  private destroyActiveGhosts(): void {
    this.ghosts.forEach((ghost) => ghost.destroy());
    this.ghosts = [];
  }

  update(_time: number, delta: number): void {
    // Hotkey: R -> Restart level & clear all ghosts
    if (this.keyR && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartFullLevel();
      return;
    }

    // Hotkey: T -> Run smoke test
    if (this.keyT && Phaser.Input.Keyboard.JustDown(this.keyT)) {
      this.runSmokeTest();
    }

    // Clamped Accumulator physics update
    const clampedDelta = Math.min(delta, 250);
    this.accumulator += clampedDelta;

    let steps = 0;
    while (this.accumulator >= this.fixedDeltaTime && steps < this.maxStepsPerFrame) {
      const tick = this.currentTick;

      // 1. Sample live input frame
      const liveInput = this.inputRecorder.sampleInput(tick);

      // 2. Record live input frame into LoopManager
      this.loopManager.recordFrame(liveInput);

      // 3. Step live player with current input
      this.player.physicsStep(liveInput);

      // 4. Step all active ghosts with their respective recorded inputs
      this.ghosts.forEach((ghost, index) => {
        const ghostInput = this.loopManager.getInputForGhost(index, tick);
        ghost.physicsStep(ghostInput);
      });

      // 5. Step physics world simulation forward by 1/60s
      this.physics.world.step(this.fixedDeltaTime / 1000);

      this.currentTick++;
      this.remainingSeconds -= 1 / 60;
      this.accumulator -= this.fixedDeltaTime;
      steps++;

      // Timer Expiration -> Advance Loop
      if (this.remainingSeconds <= 0) {
        this.prepareNextLoop();
        break;
      }
    }

    // Drop excess accumulator time if max step limit reached
    if (steps >= this.maxStepsPerFrame) {
      this.accumulator = 0;
    }

    this.updateHUD();
  }

  private updateHUD(): void {
    const displayTime = Math.max(0, this.remainingSeconds).toFixed(2);
    this.timerText.setText(`TIME: ${displayTime}s`);
    this.loopText.setText(`LOOP: ${this.loopCount}`);
    this.ghostCountText.setText(`GHOSTS: ${this.ghosts.length}`);
    this.ticksText.setText(`TICKS: ${this.currentTick}`);
  }
}
