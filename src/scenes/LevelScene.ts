import Phaser from 'phaser';
import { Player } from '../actors/Player';
import { Ghost } from '../actors/Ghost';
import { InputRecorder } from '../actors/InputRecorder';
import { LoopManager } from '../systems/LoopManager';
import { PersistentState } from '../systems/PersistentState';
import { Switch } from '../interactables/Switch';
import { Gate } from '../interactables/Gate';
import { PressurePlate } from '../interactables/PressurePlate';
import { GoalZone } from '../interactables/GoalZone';
import { DeterminismTest, type DeterminismTestResult } from '../systems/DeterminismTest';
import type { PlayerInput } from '../types/PlayerInput';

export class LevelScene extends Phaser.Scene {
  private player!: Player;
  private ghosts: Ghost[] = [];
  private inputRecorder!: InputRecorder;
  private loopManager!: LoopManager;
  private persistentState!: PersistentState;

  // Level Geometry & Interactables
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private switches: Switch[] = [];
  private gates: Gate[] = [];
  private pressurePlates: PressurePlate[] = [];
  private goalZone!: GoalZone;

  // Fixed Timestep Accumulator settings
  private accumulator: number = 0;
  private readonly fixedDeltaTime: number = 1000 / 60; // 16.666ms per tick
  private readonly maxStepsPerFrame: number = 5; // Clamped to prevent spiral of death
  private currentTick: number = 0;

  // Loop Lifecycle
  private readonly loopDuration: number = 15.0; // 15 seconds
  private remainingSeconds: number = 15.0;
  private loopCount: number = 1;
  private readonly maxLoops: number = 4;

  // Game State & Overlays
  private isGameOver: boolean = false;
  private isVictory: boolean = false;
  private failureOverlay!: Phaser.GameObjects.Container;
  private victoryOverlay!: Phaser.GameObjects.Container;

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
    this.persistentState = new PersistentState();

    // Create Platforms & Level Geometry
    this.platforms = this.physics.add.staticGroup();
    this.buildPuzzleRoom();

    // Create Live Player
    this.player = new Player(this, 64, 400, 'player-texture');
    this.physics.add.collider(this.player, this.platforms);

    // Create Gates Collider with Live Player
    this.gates.forEach((gate) => {
      this.physics.add.collider(this.player, gate);
    });

    // Create Input Recorder
    this.inputRecorder = new InputRecorder(this);

    // Keyboard shortcuts
    if (this.input.keyboard) {
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    }

    // Set up HUD & Overlays
    this.setupHUD();
    this.setupOverlays();

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
        ctx.fillStyle = '#0A081D';
        ctx.fillRect(18, 10, 10, 8);
        pCanvas.refresh();
      }
    }

    // Alias 'player' texture if used by DeterminismTest
    if (!this.textures.exists('player')) {
      const pCanvas = this.textures.createCanvas('player', 32, 48);
      if (pCanvas) {
        const ctx = pCanvas.getContext();
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(0, 0, 32, 48);
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
        ctx.fillRect(0, 0, 32, 4);
        ctx.strokeStyle = '#3D2D75';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 32, 32);
        bCanvas.refresh();
      }
    }

    // Switch Texture: 24x32 lever sprite
    if (!this.textures.exists('switch-texture')) {
      const sCanvas = this.textures.createCanvas('switch-texture', 24, 32);
      if (sCanvas) {
        const ctx = sCanvas.getContext();
        ctx.fillStyle = '#1A1830';
        ctx.fillRect(0, 0, 24, 32);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(10, 4, 4, 20);
        ctx.fillRect(4, 22, 16, 6);
        sCanvas.refresh();
      }
    }

    // Gate Texture: 32x96 tall barrier
    if (!this.textures.exists('gate-texture')) {
      const gCanvas = this.textures.createCanvas('gate-texture', 32, 96);
      if (gCanvas) {
        const ctx = gCanvas.getContext();
        ctx.fillStyle = '#FFDF00';
        ctx.fillRect(0, 0, 32, 96);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 28, 92);
        gCanvas.refresh();
      }
    }

    // Pressure Plate Texture: 48x12 plate
    if (!this.textures.exists('plate-texture')) {
      const plCanvas = this.textures.createCanvas('plate-texture', 48, 12);
      if (plCanvas) {
        const ctx = plCanvas.getContext();
        ctx.fillStyle = '#7B52FF';
        ctx.fillRect(0, 0, 48, 12);
        ctx.fillStyle = '#00F0FF';
        ctx.fillRect(4, 2, 40, 4);
        plCanvas.refresh();
      }
    }

    // Goal Zone Texture: 48x64 glowing portal
    if (!this.textures.exists('goal-texture')) {
      const gCanvas = this.textures.createCanvas('goal-texture', 48, 64);
      if (gCanvas) {
        const ctx = gCanvas.getContext();
        ctx.fillStyle = '#00FF66';
        ctx.fillRect(0, 0, 48, 64);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, 44, 60);
        ctx.fillStyle = '#121026';
        ctx.fillRect(8, 8, 32, 48);
        ctx.fillStyle = '#00FF66';
        ctx.fillRect(14, 14, 20, 36);
        gCanvas.refresh();
      }
    }
  }

  private buildPuzzleRoom(): void {
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

    // Low Step Platform (Left side)
    for (let x = 120; x <= 180; x += 32) {
      this.platforms.create(x, 480, 'block-texture').refreshBody();
    }

    // Middle Floating Platform (Plate A sits here)
    for (let x = 250; x <= 450; x += 32) {
      this.platforms.create(x, 400, 'block-texture').refreshBody();
    }

    // Middle Step Platform (Between Middle and High platforms)
    for (let x = 490; x <= 530; x += 32) {
      this.platforms.create(x, 340, 'block-texture').refreshBody();
    }

    // High Right Platform (Gate-Goal and GoalZone sit here)
    for (let x = 580; x <= 760; x += 32) {
      this.platforms.create(x, 280, 'block-texture').refreshBody();
    }

    // --- INTERACTABLES SETUP ---

    // 1. Plate A on Middle Platform (x=350, y=378)
    const plateA = new PressurePlate(this, 350, 378, {
      id: 'plate-a',
      persistentState: this.persistentState,
      textureKey: 'plate-texture',
    });
    this.pressurePlates.push(plateA);

    // 2. Plate B on Floor (x=450, y=562)
    const plateB = new PressurePlate(this, 450, 562, {
      id: 'plate-b',
      persistentState: this.persistentState,
      textureKey: 'plate-texture',
    });
    this.pressurePlates.push(plateB);

    // 3. Gate-Goal on High Right Platform (x=620, y=216) -> requires both Plate A AND Plate B to latch open
    const gateGoal = new Gate(this, 620, 216, {
      id: 'gate-goal',
      controlId: 'gate-goal',
      persistentState: this.persistentState,
      textureKey: 'gate-texture',
    });
    this.gates.push(gateGoal);

    // 4. GoalZone at x=720, y=240
    this.goalZone = new GoalZone(this, 720, 240, {
      id: 'goal-zone',
      textureKey: 'goal-texture',
    });
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

    this.loopText = this.add.text(210, 22, 'LOOP: 1/4', textStyle);
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
      '[A/D] Move | [Space/W] Jump | [E] Action/Switch | [R] Restart Full Level | [T] Run Test',
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#A0A0C0',
      }
    );
  }

  private setupOverlays(): void {
    // Failure Overlay Container (Max Loops Expired)
    this.failureOverlay = this.add.container(0, 0);
    const failBg = this.add.rectangle(400, 300, 800, 600, 0x0a081d, 0.85);
    const failBox = this.add.rectangle(400, 300, 540, 250, 0x1a0a1a)
      .setStrokeStyle(3, 0xff3366);

    const failTitle = this.add.text(400, 215, 'TIME PARADOX DETECTED', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#FF3366',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const failSub = this.add.text(400, 260, 'MAX LOOPS EXPIRED (4/4 LOOPS USED)', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const failDesc = this.add.text(400, 295, 'All temporal attempts exhausted without reaching the Goal.', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#A0A0C0',
    }).setOrigin(0.5);

    const failPrompt = this.add.text(400, 350, 'Press [ R ] to Restart Level Timeline', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00F0FF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.failureOverlay.add([failBg, failBox, failTitle, failSub, failDesc, failPrompt]);
    this.failureOverlay.setDepth(100);
    this.failureOverlay.setVisible(false);

    // Victory Overlay Container
    this.victoryOverlay = this.add.container(0, 0);
    const vicBg = this.add.rectangle(400, 300, 800, 600, 0x0a081d, 0.85);
    const vicBox = this.add.rectangle(400, 300, 540, 250, 0x081a14)
      .setStrokeStyle(3, 0x00ff66);

    const vicTitle = this.add.text(400, 215, 'PARADOX SOLVED!', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: '#00FF66',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const vicSub = this.add.text(400, 260, 'Temporal Goal Reached Successfully!', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#FFFFFF',
    }).setOrigin(0.5);

    const vicPrompt = this.add.text(400, 350, 'Press [ R ] to Play Again', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00F0FF',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.victoryOverlay.add([vicBg, vicBox, vicTitle, vicSub, vicPrompt]);
    this.victoryOverlay.setDepth(100);
    this.victoryOverlay.setVisible(false);
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
   * Pre-tick Synchronization: Sync all Gate physics bodies with PersistentState
   * BEFORE the first tick of a loop runs.
   */
  private syncAllInteractablesPreTick(): void {
    this.gates.forEach((gate) => gate.syncState());
    this.switches.forEach((sw) => sw.syncState());
    this.pressurePlates.forEach((plate) => plate.syncState());
    if (this.goalZone) {
      this.goalZone.setUnlocked(this.persistentState.getState('gate-goal'));
    }
  }

  private triggerMaxLoopFailure(): void {
    this.isGameOver = true;
    this.failureOverlay.setVisible(true);
    this.testStatusText.setText('Status: MAX LOOPS EXPIRED').setColor('#FF3366');
  }

  private triggerVictory(): void {
    this.isVictory = true;
    this.victoryOverlay.setVisible(true);
    this.testStatusText.setText('Status: PARADOX SOLVED!').setColor('#00FF66');
  }

  private prepareNextLoop(): void {
    // 1. Finalize current loop's recording
    this.loopManager.finalizeLoop();

    // 2. Check if max loops (4) have expired
    if (this.loopManager.getCompletedLoopCount() >= this.maxLoops) {
      this.triggerMaxLoopFailure();
      return;
    }

    // 3. Increment loop count
    this.loopCount++;

    // 4. Destroy active ghosts (clean lifecycle)
    this.destroyActiveGhosts();

    // 5. Spawn N-1 ghosts for Loop N from LoopManager completed recordings
    const completedLoops = this.loopManager.getCompletedLoopCount();
    for (let i = 0; i < completedLoops; i++) {
      const ghost = new Ghost(this, 64, 400, i + 1, 'player-texture');
      this.physics.add.collider(ghost, this.platforms);
      this.gates.forEach((gate) => {
        this.physics.add.collider(ghost, gate);
      });
      this.ghosts.push(ghost);
    }

    // 6. Reset live player and state variables
    this.player.resetTo(64, 400);
    this.remainingSeconds = this.loopDuration;
    this.currentTick = 0;
    this.inputRecorder.reset();

    // 7. Pre-tick Sync of all gates and interactables from PersistentState
    this.syncAllInteractablesPreTick();
  }

  private restartFullLevel(): void {
    this.isGameOver = false;
    this.isVictory = false;
    if (this.failureOverlay) this.failureOverlay.setVisible(false);
    if (this.victoryOverlay) this.victoryOverlay.setVisible(false);

    this.loopManager.clearAllHistory();
    this.persistentState.resetAll();
    this.destroyActiveGhosts();
    this.loopCount = 1;
    this.remainingSeconds = this.loopDuration;
    this.currentTick = 0;
    this.player.resetTo(64, 400);
    this.inputRecorder.reset();

    // Pre-tick Sync
    this.syncAllInteractablesPreTick();
  }

  private destroyActiveGhosts(): void {
    this.ghosts.forEach((ghost) => ghost.destroy());
    this.ghosts = [];
  }

  update(_time: number, delta: number): void {
    // Hotkey: R -> Restart level & clear all ghosts and persistent state
    if (this.keyR && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartFullLevel();
      return;
    }

    // Stop physics simulation if level is completed or max loops expired
    if (this.isGameOver || this.isVictory) {
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

      // --- STEP 1: Pass inputs to live player & ghosts ---
      const liveInput = this.inputRecorder.sampleInput(tick);
      this.loopManager.recordFrame(liveInput);
      this.player.physicsStep(liveInput);

      const ghostInputs: PlayerInput[] = [];
      this.ghosts.forEach((ghost, index) => {
        const gInput = this.loopManager.getInputForGhost(index, tick);
        ghostInputs.push(gInput);
        ghost.physicsStep(gInput);
      });

      // --- STEP 2: Step physics world simulation forward by 1/60s ---
      this.physics.world.step(this.fixedDeltaTime / 1000);

      // --- STEP 3: Post-step Overlaps & PersistentState Updates ---
      this.evaluateInteractables(liveInput, ghostInputs);

      // --- STEP 4: Check Goal Zone Victory condition ---
      const isGoalUnlocked = this.persistentState.getState('gate-goal');
      if (this.goalZone) {
        this.goalZone.setUnlocked(isGoalUnlocked);
      }
      if (isGoalUnlocked && this.physics.overlap(this.player, this.goalZone)) {
        this.triggerVictory();
        break;
      }

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

  /**
   * Post-physics step evaluation of switches and pressure plates.
   */
  private evaluateInteractables(liveInput: PlayerInput, ghostInputs: PlayerInput[]): void {
    const allActors = [this.player, ...this.ghosts];

    // Evaluate Switches
    this.switches.forEach((sw) => {
      // Live player check
      if (this.physics.overlap(this.player, sw) && liveInput.action) {
        sw.activate();
      }

      // Ghost checks
      this.ghosts.forEach((ghost, index) => {
        const gInput = ghostInputs[index];
        if (this.physics.overlap(ghost, sw) && gInput && gInput.action) {
          sw.activate();
        }
      });
    });

    // Evaluate Pressure Plates across all actors (Live Player + Ghosts)
    this.pressurePlates.forEach((plate) => {
      const overlappingCount = allActors.filter((actor) =>
        this.physics.overlap(actor, plate)
      ).length;
      plate.evaluateOverlaps(overlappingCount);
    });

    // Latch Gate-Goal open if both Plate A AND Plate B are active simultaneously
    const plateAActive = this.persistentState.getState('plate-a');
    const plateBActive = this.persistentState.getState('plate-b');
    if (plateAActive && plateBActive) {
      this.persistentState.setState('gate-goal', true);
    }
  }

  private updateHUD(): void {
    const displayTime = Math.max(0, this.remainingSeconds).toFixed(2);
    this.timerText.setText(`TIME: ${displayTime}s`);
    this.loopText.setText(`LOOP: ${this.loopCount}/4`);
    this.ghostCountText.setText(`GHOSTS: ${this.ghosts.length}`);
    this.ticksText.setText(`TICKS: ${this.currentTick}`);
  }
}
