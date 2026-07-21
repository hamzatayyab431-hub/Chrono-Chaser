import Phaser from 'phaser';
import { Player } from '../actors/Player';
import { Ghost } from '../actors/Ghost';
import { InputRecorder } from '../actors/InputRecorder';
import { LoopManager } from '../systems/LoopManager';
import { PersistentState } from '../systems/PersistentState';
import { SoundEffects } from '../systems/SoundEffects';
import { Switch } from '../interactables/Switch';
import { Gate } from '../interactables/Gate';
import { PressurePlate } from '../interactables/PressurePlate';
import { GoalZone } from '../interactables/GoalZone';
import { DeterminismTest, type DeterminismTestResult } from '../systems/DeterminismTest';
import type { PlayerInput } from '../types/PlayerInput';
import type { LevelData } from '../types/LevelData';
import { LEVELS_DATA } from '../levels/levelsData';

export class LevelScene extends Phaser.Scene {
  private currentLevelIndex: number = 0;
  private levelData!: LevelData;

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

  // Loop Lifecycle & Game State
  private remainingSeconds: number = 15.0;
  private loopCount: number = 1;
  private isLevelComplete: boolean = false;
  private isGameOver: boolean = false;

  // HUD Elements & Modals
  private levelTitleText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private loopText!: Phaser.GameObjects.Text;
  private ghostCountText!: Phaser.GameObjects.Text;
  private ticksText!: Phaser.GameObjects.Text;
  private testStatusText!: Phaser.GameObjects.Text;
  private modalContainer!: Phaser.GameObjects.Container;

  private keyR!: Phaser.Input.Keyboard.Key;
  private keyT!: Phaser.Input.Keyboard.Key;
  private keyN!: Phaser.Input.Keyboard.Key;
  private keyP!: Phaser.Input.Keyboard.Key;
  private keyEsc!: Phaser.Input.Keyboard.Key;
  private keyM!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: 'LevelScene' });
  }

  init(data?: { levelIndex?: number }): void {
    this.currentLevelIndex = data && typeof data.levelIndex === 'number' ? data.levelIndex : 0;
    this.currentLevelIndex = Phaser.Math.Clamp(this.currentLevelIndex, 0, LEVELS_DATA.length - 1);
    this.levelData = LEVELS_DATA[this.currentLevelIndex];

    this.validateLevelData(this.levelData);
  }

  create(): void {
    this.isLevelComplete = false;
    this.isGameOver = false;

    // Unlock Web Audio Context on user gesture
    this.input.on('pointerdown', () => SoundEffects.ensureAudioUnlocked());
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown', () => SoundEffects.ensureAudioUnlocked());
    }

    this.generateDynamicTextures();

    // Background
    this.add.rectangle(400, 300, 800, 600, 0x121026);

    // Systems & Managers
    this.loopManager = new LoopManager();
    this.persistentState = new PersistentState();

    // Create Platforms & Level Geometry
    this.platforms = this.physics.add.staticGroup();
    this.switches = [];
    this.gates = [];
    this.pressurePlates = [];

    this.buildRoomFromData(this.levelData);

    // Create Live Player
    const spawn = this.levelData.spawnPoint;
    this.player = new Player(this, spawn.x, spawn.y, 'player-texture');
    this.physics.add.collider(this.player, this.platforms);

    // Gates Collider
    this.gates.forEach((gate) => {
      this.physics.add.collider(this.player, gate);
    });

    // Create Input Recorder
    this.inputRecorder = new InputRecorder(this);

    // Keyboard shortcuts
    if (this.input.keyboard) {
      this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
      this.keyN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
      this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.keyM = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    }

    // Set up HUD
    this.setupHUD();

    // Start fresh level
    this.restartFullLevel();

    // Run initial determinism smoke test automatically
    this.runSmokeTest();
  }

  private validateLevelData(data: LevelData): void {
    const validIds = new Set<string>();
    if (data.switches) data.switches.forEach((sw) => validIds.add(sw.id));
    if (data.pressurePlates) data.pressurePlates.forEach((p) => validIds.add(p.id));

    if (data.gates) {
      data.gates.forEach((gate) => {
        gate.controlIds.forEach((cid) => {
          if (!validIds.has(cid)) {
            console.error(
              `[LevelValidationError] Level '${data.name}' Gate '${gate.id}' references non-existent controlId '${cid}'`
            );
          }
        });
      });
    }
  }

  private generateDynamicTextures(): void {
    // Player Texture: 32x48 cyan glowing block
    if (!this.textures.exists('player-texture')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x00F0FF, 1);
      g.fillRect(0, 0, 32, 48);
      g.lineStyle(2, 0xFFFFFF, 1);
      g.strokeRect(1, 1, 30, 46);
      g.fillStyle(0x0A081D, 1);
      g.fillRect(18, 10, 10, 8);
      g.generateTexture('player-texture', 32, 48);
      g.destroy();
    }

    // Platform Block Texture: 32x32 dark purple block
    if (!this.textures.exists('block-texture')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x2A2050, 1);
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x7B52FF, 1);
      g.fillRect(0, 0, 32, 4);
      g.lineStyle(1, 0x3D2D75, 1);
      g.strokeRect(0, 0, 32, 32);
      g.generateTexture('block-texture', 32, 32);
      g.destroy();
    }

    // Switch Texture: 24x32 lever sprite
    if (!this.textures.exists('switch-texture')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x1A1830, 1);
      g.fillRect(0, 0, 24, 32);
      g.fillStyle(0xFFFFFF, 1);
      g.fillRect(10, 4, 4, 20);
      g.fillRect(4, 22, 16, 6);
      g.generateTexture('switch-texture', 24, 32);
      g.destroy();
    }

    // Gate Texture: 32x96 tall barrier
    if (!this.textures.exists('gate-texture')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xFFDF00, 1);
      g.fillRect(0, 0, 32, 96);
      g.lineStyle(2, 0xFFFFFF, 1);
      g.strokeRect(2, 2, 28, 92);
      g.generateTexture('gate-texture', 32, 96);
      g.destroy();
    }

    // Pressure Plate Texture: 48x12 plate
    if (!this.textures.exists('plate-texture')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x7B52FF, 1);
      g.fillRect(0, 0, 48, 12);
      g.fillStyle(0x00F0FF, 1);
      g.fillRect(4, 2, 40, 4);
      g.generateTexture('plate-texture', 48, 12);
      g.destroy();
    }

    // Goal Zone Texture: 40x48 exit portal
    if (!this.textures.exists('goal-texture')) {
      const g = this.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0x00FF66, 1);
      g.fillRect(0, 0, 40, 48);
      g.fillStyle(0x0A081D, 1);
      g.fillRect(6, 6, 28, 36);
      g.fillStyle(0x00F0FF, 1);
      g.fillRect(14, 14, 12, 20);
      g.generateTexture('goal-texture', 40, 48);
      g.destroy();
    }
  }

  private buildRoomFromData(data: LevelData): void {
    data.platforms.forEach((p) => {
      const width = p.width || 32;
      const height = p.height || 32;

      for (let x = p.x - width / 2 + 16; x <= p.x + width / 2 - 16; x += 32) {
        for (let y = p.y - height / 2 + 16; y <= p.y + height / 2 - 16; y += 32) {
          this.platforms.create(x, y, 'block-texture').refreshBody();
        }
      }
    });

    if (data.switches) {
      data.switches.forEach((sw) => {
        const switchEntity = new Switch(this, sw.x, sw.y, {
          id: sw.id,
          persistentState: this.persistentState,
          textureKey: 'switch-texture',
        });
        this.switches.push(switchEntity);
      });
    }

    if (data.pressurePlates) {
      data.pressurePlates.forEach((plate) => {
        const plateEntity = new PressurePlate(this, plate.x, plate.y, {
          id: plate.id,
          persistentState: this.persistentState,
          textureKey: 'plate-texture',
        });
        this.pressurePlates.push(plateEntity);
      });
    }

    if (data.gates) {
      data.gates.forEach((gate) => {
        const gateEntity = new Gate(this, gate.x, gate.y, {
          id: gate.id,
          controlIds: gate.controlIds,
          mode: gate.mode || 'all',
          persistentState: this.persistentState,
          textureKey: 'gate-texture',
        });
        this.gates.push(gateEntity);
      });
    }

    this.goalZone = new GoalZone(this, data.goalZone.x, data.goalZone.y, {
      id: data.goalZone.id,
      textureKey: 'goal-texture',
    });
  }

  private setupHUD(): void {
    const textStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00F0FF',
    };

    // Header Panel Background
    this.add.rectangle(400, 30, 760, 40, 0x0a081d, 0.85).setStrokeStyle(1, 0x7b52ff);

    this.levelTitleText = this.add.text(25, 22, `L${this.currentLevelIndex + 1}: ${this.levelData.name}`, {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#00FF66',
    });

    this.timerText = this.add.text(260, 22, 'TIME: 15.00s', {
      fontFamily: 'monospace',
      fontSize: '15px',
      color: '#FFDF00',
    });

    this.loopText = this.add.text(410, 22, `LOOP: 1 of ${this.levelData.maxLoops}`, textStyle);
    this.ghostCountText = this.add.text(540, 22, 'GHOSTS: 0', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#CE42FF',
    });
    this.ticksText = this.add.text(660, 22, 'TICKS: 0', textStyle);

    this.testStatusText = this.add.text(25, 75, 'Determinism Check: Ready', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00FF66',
    });

    // Control tips footer
    this.add.text(
      25,
      545,
      '[A/D] Move | [Space] Jump | [E] Switch | [R] Reset | [N/P] Level | [ESC/M] Menu',
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#A0A0C0',
      }
    );

    this.modalContainer = this.add.container(0, 0).setDepth(100).setVisible(false);
  }

  private runSmokeTest(): void {
    const result: DeterminismTestResult = DeterminismTest.runTest(this);
    if (result.passed) {
      this.testStatusText.setText(`Smoke Test: PASS (180 ticks identical)`).setColor('#00FF66');
    } else {
      this.testStatusText.setText(`Smoke Test: FAIL (Desync detected)`).setColor('#FF3366');
    }
  }

  private syncAllInteractablesPreTick(): void {
    this.gates.forEach((gate) => gate.syncState());
    this.switches.forEach((sw) => sw.syncState());
    this.pressurePlates.forEach((plate) => plate.syncState());
  }

  private prepareNextLoop(): void {
    if (this.isLevelComplete || this.isGameOver) return;

    if (this.loopCount >= this.levelData.maxLoops) {
      this.triggerGameOver();
      return;
    }

    // Play Time-Warp Rewind SFX & Camera Flash
    SoundEffects.playReset();
    this.cameras.main.flash(200, 0, 240, 255);

    // 1. Finalize current loop recording
    this.loopManager.finalizeLoop();

    // 2. Increment loop count
    this.loopCount++;

    // 3. Destroy active ghosts
    this.destroyActiveGhosts();

    // 4. Spawn ghosts for all previously recorded loops
    const spawn = this.levelData.spawnPoint;
    const completedLoops = this.loopManager.getCompletedLoopCount();
    for (let i = 0; i < completedLoops; i++) {
      const ghost = new Ghost(this, spawn.x, spawn.y, i + 1, 'player-texture');
      this.physics.add.collider(ghost, this.platforms);
      this.gates.forEach((gate) => {
        this.physics.add.collider(ghost, gate);
      });
      this.ghosts.push(ghost);
    }

    // 5. Reset live player and state variables
    this.player.resetTo(spawn.x, spawn.y);
    this.remainingSeconds = this.levelData.loopDurationSeconds;
    this.currentTick = 0;
    this.inputRecorder.reset();

    // 6. Pre-tick Sync
    this.syncAllInteractablesPreTick();
  }

  private restartFullLevel(): void {
    this.isLevelComplete = false;
    this.isGameOver = false;
    this.modalContainer.removeAll(true).setVisible(false);

    this.loopManager.clearAllHistory();
    this.persistentState.resetAll();
    this.destroyActiveGhosts();

    this.loopCount = 1;
    this.remainingSeconds = this.levelData.loopDurationSeconds;
    this.currentTick = 0;

    const spawn = this.levelData.spawnPoint;
    this.player.resetTo(spawn.x, spawn.y);
    this.inputRecorder.reset();

    this.syncAllInteractablesPreTick();
  }

  private loadNextLevel(): void {
    SoundEffects.stopAll();
    const nextIndex = (this.currentLevelIndex + 1) % LEVELS_DATA.length;
    this.scene.restart({ levelIndex: nextIndex });
  }

  private loadPrevLevel(): void {
    SoundEffects.stopAll();
    const prevIndex = (this.currentLevelIndex - 1 + LEVELS_DATA.length) % LEVELS_DATA.length;
    this.scene.restart({ levelIndex: prevIndex });
  }

  private returnToMenu(): void {
    SoundEffects.stopAll();
    this.scene.start('MenuScene');
  }

  private destroyActiveGhosts(): void {
    this.ghosts.forEach((ghost) => ghost.destroy());
    this.ghosts = [];
  }

  update(_time: number, delta: number): void {
    // Hotkey: ESC / M -> Return to MenuScene
    if (
      (this.keyEsc && Phaser.Input.Keyboard.JustDown(this.keyEsc)) ||
      (this.keyM && Phaser.Input.Keyboard.JustDown(this.keyM))
    ) {
      this.returnToMenu();
      return;
    }

    // Hotkey: R -> Restart level
    if (this.keyR && Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.restartFullLevel();
      return;
    }

    // Hotkey: N -> Next level
    if (this.keyN && Phaser.Input.Keyboard.JustDown(this.keyN)) {
      this.loadNextLevel();
      return;
    }

    // Hotkey: P -> Prev level
    if (this.keyP && Phaser.Input.Keyboard.JustDown(this.keyP)) {
      this.loadPrevLevel();
      return;
    }

    if (this.isLevelComplete || this.isGameOver) {
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

      // --- STEP 3: Post-step Overlaps & Goal Check ---
      this.evaluateInteractables(liveInput, ghostInputs);
      this.checkGoalCondition();

      if (this.isLevelComplete) {
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

    if (steps >= this.maxStepsPerFrame) {
      this.accumulator = 0;
    }

    this.updateHUD();
  }

  private evaluateInteractables(liveInput: PlayerInput, ghostInputs: PlayerInput[]): void {
    const allActors = [this.player, ...this.ghosts];

    // Evaluate Switches
    this.switches.forEach((sw) => {
      let activated = false;

      if (this.physics.overlap(this.player, sw) && liveInput.action) {
        sw.activate();
        activated = true;
      }

      this.ghosts.forEach((ghost, index) => {
        const gInput = ghostInputs[index];
        if (this.physics.overlap(ghost, sw) && gInput && gInput.action) {
          sw.activate();
          activated = true;
        }
      });

      if (activated) {
        SoundEffects.playSwitch();
        this.cameras.main.shake(180, 0.008);
      }
    });

    // Evaluate Pressure Plates
    this.pressurePlates.forEach((plate) => {
      const prevPressed = this.persistentState.getState(plate.id);
      const overlappingCount = allActors.filter((actor) =>
        this.physics.overlap(actor, plate)
      ).length;

      plate.evaluateOverlaps(overlappingCount);
      const nowPressed = this.persistentState.getState(plate.id);

      if (!prevPressed && nowPressed) {
        SoundEffects.playPlate();
        this.cameras.main.shake(120, 0.005);
      }
    });
  }

  private checkGoalCondition(): void {
    if (this.isLevelComplete || !this.goalZone) return;

    if (this.physics.overlap(this.player, this.goalZone)) {
      this.triggerLevelWin();
    }
  }

  private triggerLevelWin(): void {
    this.isLevelComplete = true;

    // SFX, Camera Shake, and Victory Particles
    SoundEffects.playWin();
    this.cameras.main.shake(300, 0.012);
    this.createVictoryParticles(this.goalZone.x, this.goalZone.y);

    // Show Victory Modal
    this.showModal(
      '🎉 LEVEL SOLVED!',
      `You completed '${this.levelData.name}' in Loop ${this.loopCount} of ${this.levelData.maxLoops}!`,
      0x00FF66,
      true
    );
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    SoundEffects.playFail();
    this.showModal(
      'OUT OF LOOPS!',
      `Reached maximum limit (${this.levelData.maxLoops} loops) without exiting.`,
      0xFF3366,
      false
    );
  }

  private createVictoryParticles(x: number, y: number): void {
    for (let i = 0; i < 35; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(4, 8), 0x00F0FF);
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(100, 320);

      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.2,
        duration: 800,
        ease: 'Power2',
        onComplete: () => p.destroy(),
      });
    }
  }

  private showModal(title: string, subtitle: string, accentColor: number, isWin: boolean): void {
    this.modalContainer.removeAll(true);

    const overlay = this.add.rectangle(400, 300, 800, 600, 0x05040a, 0.85);
    const box = this.add
      .rectangle(400, 300, 520, 250, 0x0a081d)
      .setStrokeStyle(2, accentColor);

    const titleText = this.add
      .text(400, 225, title, {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: accentColor === 0x00FF66 ? '#00FF66' : '#FF3366',
      })
      .setOrigin(0.5);

    const subText = this.add
      .text(400, 275, subtitle, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#E0E0FF',
        align: 'center',
        wordWrap: { width: 480 },
      })
      .setOrigin(0.5);

    const promptMsg = isWin
      ? '[N] Next Level  |  [R] Replay  |  [M] Main Menu'
      : '[R] Retry Level  |  [M] Main Menu';

    const promptText = this.add
      .text(400, 345, promptMsg, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#FFDF00',
      })
      .setOrigin(0.5);

    this.modalContainer.add([overlay, box, titleText, subText, promptText]);
    this.modalContainer.setVisible(true);
  }

  private updateHUD(): void {
    const displayTime = Math.max(0, this.remainingSeconds).toFixed(2);
    this.levelTitleText.setText(`L${this.currentLevelIndex + 1}: ${this.levelData.name}`);
    this.timerText.setText(`TIME: ${displayTime}s`);
    this.loopText.setText(`LOOP: ${this.loopCount} of ${this.levelData.maxLoops}`);
    this.ghostCountText.setText(`GHOSTS: ${this.ghosts.length}`);
    this.ticksText.setText(`TICKS: ${this.currentTick}`);
  }
}
