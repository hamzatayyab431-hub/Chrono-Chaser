import Phaser from 'phaser';
import { Player } from '../actors/Player';
import type { PlayerInput } from '../types/PlayerInput';

export interface DeterminismTestResult {
  passed: boolean;
  ticksExecuted: number;
  finalPosA: { x: number; y: number; vx: number; vy: number };
  finalPosB: { x: number; y: number; vx: number; vy: number };
  message: string;
}

export class DeterminismTest {
  public static runTest(scene: Phaser.Scene): DeterminismTestResult {
    // Generate 180 ticks (~3 seconds) of pseudo-random inputs
    const inputs: PlayerInput[] = [];
    for (let t = 0; t < 180; t++) {
      inputs.push({
        tick: t,
        left: t > 20 && t < 70,
        right: t > 80 && t < 150,
        jump: t === 30 || t === 90 || t === 130,
        action: false,
      });
    }

    // Create container graphics/textures for testing if needed
    const startX = 100;
    const startY = 400;

    const playerA = new Player(scene, startX, startY, 'player');
    const playerB = new Player(scene, startX, startY, 'player');

    // Make both actors non-visible for the test
    playerA.setVisible(false);
    playerB.setVisible(false);

    // Create a temporary platform for both to land on
    const ground = scene.add.rectangle(400, 550, 800, 40, 0x555555);
    scene.physics.add.existing(ground, true);

    const colliderA = scene.physics.add.collider(playerA, ground);
    const colliderB = scene.physics.add.collider(playerB, ground);

    // Simulate run A
    playerA.resetTo(startX, startY);
    for (let i = 0; i < inputs.length; i++) {
      playerA.physicsStep(inputs[i]);
      scene.physics.world.step(1 / 60);
    }

    const posA = {
      x: playerA.x,
      y: playerA.y,
      vx: (playerA.body as Phaser.Physics.Arcade.Body).velocity.x,
      vy: (playerA.body as Phaser.Physics.Arcade.Body).velocity.y,
    };

    // Simulate run B (reset and replay)
    playerB.resetTo(startX, startY);
    for (let i = 0; i < inputs.length; i++) {
      playerB.physicsStep(inputs[i]);
      scene.physics.world.step(1 / 60);
    }

    const posB = {
      x: playerB.x,
      y: playerB.y,
      vx: (playerB.body as Phaser.Physics.Arcade.Body).velocity.x,
      vy: (playerB.body as Phaser.Physics.Arcade.Body).velocity.y,
    };

    // Clean up temporary objects
    colliderA.destroy();
    colliderB.destroy();
    ground.destroy();
    playerA.destroy();
    playerB.destroy();

    const passed =
      posA.x === posB.x && posA.y === posB.y && posA.vx === posB.vx && posA.vy === posB.vy;

    const message = passed
      ? `PASS: Determinism verified over 180 ticks! PosA=(${posA.x.toFixed(2)}, ${posA.y.toFixed(
          2
        )}), PosB=(${posB.x.toFixed(2)}, ${posB.y.toFixed(2)})`
      : `FAIL: Desync detected! PosA=(${posA.x}, ${posA.y}), PosB=(${posB.x}, ${posB.y})`;

    console.log('[DeterminismTest]', message);

    return {
      passed,
      ticksExecuted: 180,
      finalPosA: posA,
      finalPosB: posB,
      message,
    };
  }
}
