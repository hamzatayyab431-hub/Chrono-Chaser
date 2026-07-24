# Chrono-Chaser

A 2D time-loop puzzle-platformer built with Phaser 3, TypeScript, Vite, and Web Audio API.

![Chrono-Chaser](https://raw.githubusercontent.com/hamzatayyab431-hub/Chrono-Chaser/main/public/favicon.svg)

## ⏳ Game Concept
The player controls a character trapped in a room that resets every **15 seconds**. To solve each puzzle level, the player must cooperate with translucent "ghosts" — pixel-perfect recordings of their own past actions from prior loops.

- **Loop 1:** Player performs an action (e.g. flips a switch) and the 15-second loop ends.
- **Loop 2:** A ghost replays the player's exact Loop 1 input stream in real time. Meanwhile, the player has a new body to execute simultaneous actions (e.g. sprint through an open gate).
- **Loop 3+:** All previous ghosts replay simultaneously. The player coordinates an increasing "army" of past selves to trigger simultaneous mechanisms (pressure plates that need multiple bodies at once).

---

## 🎮 Controls

- **A / D** or **Left / Right Arrows**: Walk Left / Right
- **Space** / **W** / **Up Arrow**: Jump (Coyote Time & Jump Buffering active)
- **E**: Interact / Flip Switch
- **R**: Restart Current Level (Clear Ghosts & Reset State)
- **N**: Jump to Next Level
- **P**: Jump to Previous Level
- **1 - 5**: Direct Level Selection (on Main Menu)
- **ESC / M**: Return to Main Menu
- **T**: Trigger Automated Determinism Smoke Test

---

## 🧩 Handcrafted Levels (1 - 5)

1. **Level 1: First Steps** — Flip the high left switch in Loop 1 so your Loop 2 self can pass through the unlocked gate to exit (Max Loops: 2).
2. **Level 2: Time Relay** — Coordinate real-time pressure plate timing: Ghost 1 holds Plate 1 while Player 2 sprints past the timed gate (Max Loops: 2).
3. **Level 3: Dual Pressure** — Simultaneous multi-point holding: Ghost 1 holds Plate A and Ghost 2 holds Plate B so Player 3 can reach the exit (Max Loops: 3).
4. **Level 4: Triple Synchrony** — 3-phase chain reaction: Ghost 1 opens Chamber 1, Ghost 2 holds Plate A inside, Ghost 3 holds Plate B on floor, and Player 4 escapes (Max Loops: 4).
5. **Level 5: Chrono Master (Finale)** — 4-loop master challenge: Coordinate a 3-ghost relay across 3 nested chambers with simultaneous dual pressure plate locking (Max Loops: 4).

---

## ⚙️ Technical Architecture

- **Deterministic Fixed-Timestep Physics Loop**: Fixed 60Hz Arcade Physics update loop (`customUpdate: true`) with manual `world.update(0, dt)` and `postUpdate()` integration.
- **Star Performance Ratings**: 1-to-3 star performance evaluation based on loop efficiency and speed, persisted across sessions in local storage.
- **Dynamic Particle Effects**: Micro-particle explosions for jump dust bursts, switch activations, and portal victory fireworks.
- **Zero-Dependency Web Audio Synthesis**: Synthesizes retro synth SFX dynamically using HTML5 Web Audio API (jump, switch click, plate hum, gate unlock sweep, rewind sweep, victory arpeggio, failure buzz).

---

## 🛠️ Setup & Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build

# Run TypeScript type check
npx tsc --noEmit
```
