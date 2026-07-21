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

1. **Level 1: First Steps** — Single switch and gate tutorial (Max Loops: 2).
2. **Level 2: Time Relay** — Sprint to a distant gate while your past ghost flips a far-left switch (Max Loops: 2).
3. **Level 3: Dual Pressure** — Step on two separate pressure plates simultaneously with a ghost to open the goal gate (Max Loops: 3).
4. **Level 4: Triple Synchrony** — Coordinate 3 past selves across 3 loops to activate a switch and two pressure plates at once (Max Loops: 4).
5. **Level 5: Chrono Master (Finale)** — Master nested outer barriers and a 4-ghost simultaneous pressure plate puzzle (Max Loops: 4).

---

## ⚙️ Technical Architecture

- **Deterministic Fixed-Timestep Physics Loop**: Fixed 60Hz Arcade Physics update loop (`customUpdate: true`) decoupled from render framerate.
- **Accumulator Safety Clamping**: Capped to max 5 steps per frame to prevent lag spirals ("spiral of death").
- **Shared Movement Logic**: `Ghost` extends `Player` directly, guaranteeing 100% identical physics simulation between live player and ghosts.
- **One-Way Latch Mechanics**: Switches and multi-condition gates latch open permanently once triggered, enforcing the design rule that level geometry only ever opens up.
- **Zero-Dependency Web Audio Synthesis**: Synthesizes retro chiptune SFX dynamically using HTML5 Web Audio API (jump, switch click, plate hum, rewind sweep, victory arpeggio, failure buzz).

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
