# Chrono-Chaser

A 2D time-loop puzzle-platformer built with Phaser 3, TypeScript, and Vite.

## Gameplay Concept
The player controls a character trapped in a room that resets every 15 seconds. To solve puzzles, the player must coordinate with translucent "ghosts" — pixel-perfect recordings of their own past actions from prior loops.

## Current State: Phase 1 (Core Engine & Controls)
- Fixed 60Hz Arcade Physics update loop (`customUpdate: true`) decoupled from render framerate
- Deterministic player controller with Coyote Time (~100ms) & Jump Buffering (~100ms)
- Live `InputRecorder` sampling tick-by-tick inputs
- 15-second loop timer with automatic actor reset
- Automated determinism smoke test verifying exact replay fidelity

## Controls
- **A / D** or **Left / Right Arrows**: Move left / right
- **Space** / **W** / **Up Arrow**: Jump
- **R**: Restart Level
- **T**: Trigger Determinism Smoke Test

## Setup & Run
```bash
npm install
npm run dev
```
