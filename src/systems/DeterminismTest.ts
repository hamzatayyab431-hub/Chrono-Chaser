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
    // Generate 180 ticks (~3 seconds) of inputs
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

    const startX = 100;
    const startY = 400;

    // Create an isolated, headless Arcade Physics World instance so main scene physics is untouched
    const testWorld = new Phaser.Physics.Arcade.World(scene, {
      gravity: { x: 0, y: 1000 },
      fps: 60,
    });

    const playerA = new Player(scene, startX, startY, 'player-texture');
    const playerB = new Player(scene, startX, startY, 'player-texture');

    playerA.setVisible(false);
    playerB.setVisible(false);

    // Isolate bodies into testWorld instead of main scene world
    scene.physics.world.remove(playerA.body as Phaser.Physics.Arcade.Body);
    scene.physics.world.remove(playerB.body as Phaser.Physics.Arcade.Body);
    testWorld.add(playerA.body as Phaser.Physics.Arcade.Body);
    testWorld.add(playerB.body as Phaser.Physics.Arcade.Body);

    // Create a temporary platform for isolated test world
    const ground = scene.add.rectangle(400, 550, 800, 40, 0x555555);
    testWorld.enable(ground, Phaser.Physics.Arcade.STATIC_BODY);

    const colliderA = testWorld.addCollider(playerA, ground);
    const colliderB = testWorld.addCollider(playerB, ground);

    // Simulate Run A in isolated world
    playerA.resetTo(startX, startY);
    for (let i = 0; i < inputs.length; i++) {
      playerA.physicsStep(inputs[i], false);
      testWorld.update(0, 1000 / 60);
      testWorld.postUpdate();
    }

    const posA = {
      x: playerA.x,
      y: playerA.y,
      vx: (playerA.body as Phaser.Physics.Arcade.Body).velocity.x,
      vy: (playerA.body as Phaser.Physics.Arcade.Body).velocity.y,
    };

    // Simulate Run B in isolated world
    playerB.resetTo(startX, startY);
    for (let i = 0; i < inputs.length; i++) {
      playerB.physicsStep(inputs[i], false);
      testWorld.update(0, 1000 / 60);
      testWorld.postUpdate();
    }

    const posB = {
      x: playerB.x,
      y: playerB.y,
      vx: (playerB.body as Phaser.Physics.Arcade.Body).velocity.x,
      vy: (playerB.body as Phaser.Physics.Arcade.Body).velocity.y,
    };

    // Cleanup isolated objects
    testWorld.removeCollider(colliderA);
    testWorld.removeCollider(colliderB);
    ground.destroy();
    playerA.destroy();
    playerB.destroy();
    testWorld.destroy();

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
