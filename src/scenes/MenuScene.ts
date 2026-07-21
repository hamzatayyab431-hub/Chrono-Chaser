import Phaser from 'phaser';
import { LEVELS_DATA } from '../levels/levelsData';
import { SoundEffects } from '../systems/SoundEffects';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x0a081d);

    // Dynamic ambient background particles
    this.createBackgroundParticles();

    // Header Panel
    const titleText = this.add.text(400, 75, 'CHRONO-CHASER', {
      fontFamily: 'monospace',
      fontSize: '38px',
      color: '#00F0FF',
      stroke: '#7B52FF',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Pulsing title glow
    this.tweens.add({
      targets: titleText,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.add.text(400, 120, '— COOPERATE WITH YOUR PAST SELVES —', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#FFDF00',
    }).setOrigin(0.5);

    // Render Level Selection Cards Grid (5 Levels)
    this.createLevelCards();

    // Footer info
    this.add.text(400, 560, 'Press [ 1 - 5 ] to Select Level  |  Click Card to Play', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#A0A0C0',
    }).setOrigin(0.5);

    // Keyboard listeners for number keys 1..5
    if (this.input && this.input.keyboard) {
      this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
        SoundEffects.ensureAudioUnlocked();
        const num = parseInt(event.key, 10);
        if (num >= 1 && num <= LEVELS_DATA.length) {
          this.launchLevel(num - 1);
        }
      });
    }

    // Unlock audio on click gesture
    this.input.on('pointerdown', () => {
      SoundEffects.ensureAudioUnlocked();
    });
  }

  private createBackgroundParticles(): void {
    for (let i = 0; i < 25; i++) {
      const p = this.add.circle(
        Phaser.Math.Between(50, 750),
        Phaser.Math.Between(50, 550),
        Phaser.Math.Between(2, 4),
        0x7b52ff,
        0.4
      );

      this.tweens.add({
        targets: p,
        y: p.y - Phaser.Math.Between(30, 80),
        alpha: 0.1,
        duration: Phaser.Math.Between(2000, 4000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createLevelCards(): void {
    const startY = 175;
    const cardHeight = 65;
    const cardWidth = 700;

    LEVELS_DATA.forEach((level, index) => {
      const y = startY + index * (cardHeight + 10);

      // Card Background Box
      const cardBg = this.add
        .rectangle(400, y, cardWidth, cardHeight, 0x121026)
        .setStrokeStyle(1, 0x3d2d75)
        .setInteractive({ useHandCursor: true });

      // Card Level Number Badge
      this.add
        .rectangle(80, y, 50, 45, 0x2a2050)
        .setStrokeStyle(1, 0x00f0ff);

      this.add
        .text(80, y, `${index + 1}`, {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#00F0FF',
        })
        .setOrigin(0.5);

      // Level Name & Description
      this.add.text(125, y - 14, level.name.toUpperCase(), {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#00FF66',
      });

      this.add.text(125, y + 8, level.description, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#A0A0C0',
      });

      // Max Loops Badge
      this.add.text(590, y, `CAP: ${level.maxLoops} L`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#CE42FF',
      }).setOrigin(0.5);

      // PLAY Button
      const playBtn = this.add
        .rectangle(690, y, 70, 36, 0x00f0ff)
        .setInteractive({ useHandCursor: true });

      this.add
        .text(690, y, 'PLAY', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#0A081D',
        })
        .setOrigin(0.5);

      // Hover Effects
      cardBg.on('pointerover', () => {
        cardBg.setStrokeStyle(2, 0x00f0ff);
        playBtn.setFillStyle(0x00ff66);
      });

      cardBg.on('pointerout', () => {
        cardBg.setStrokeStyle(1, 0x3d2d75);
        playBtn.setFillStyle(0x00f0ff);
      });

      cardBg.on('pointerdown', () => {
        SoundEffects.ensureAudioUnlocked();
        SoundEffects.playSwitch();
        this.launchLevel(index);
      });

      playBtn.on('pointerdown', () => {
        SoundEffects.ensureAudioUnlocked();
        SoundEffects.playSwitch();
        this.launchLevel(index);
      });
    });
  }

  private launchLevel(levelIndex: number): void {
    SoundEffects.stopAll();
    this.scene.start('LevelScene', { levelIndex });
  }
}
