import { createEmptyInput, type PlayerInput } from '../types/PlayerInput';

/**
 * LoopManager manages input recording, historical loop storage, and ghost playback.
 * 
 * --- RECORDING INDEX MAPPING (0-INDEXED) ---
 * - `recordedLoops` stores recordings in a 0-indexed array: `[0, 1, 2, ..., maxLoops - 1]`.
 * - 1-indexed Loop N (e.g. Loop 1) corresponds to 0-indexed recording index `N - 1` (index 0).
 * - Ghost index `i` (0-indexed) replays the recording stored at `recordedLoops[i]`.
 */
export class LoopManager {
  public readonly maxLoops: number;
  private recordedLoops: PlayerInput[][] = [];
  private currentLoopRecording: PlayerInput[] = [];

  /**
   * @param maxLoops Maximum number of loops allowed (default: 4).
   */
  constructor(maxLoops: number = 4) {
    this.maxLoops = Math.max(1, Math.floor(maxLoops));
  }

  /**
   * Returns the maximum allowed loops configuration.
   */
  public getMaxLoops(): number {
    return this.maxLoops;
  }

  /**
   * Checks whether the max loops limit has been reached.
   * Supports 1-indexed current loop numbers (e.g., Loop 4 of 4) or completed loop counts.
   * 
   * @param currentLoop 1-indexed loop number (e.g. 4) or completed loop count.
   * @returns `true` if current loop is >= maxLoops, `false` otherwise.
   */
  public isMaxLoopsReached(currentLoop: number): boolean {
    if (typeof currentLoop !== 'number' || isNaN(currentLoop)) {
      return false;
    }
    const guardedLoop = Math.max(0, currentLoop);
    return guardedLoop >= this.maxLoops;
  }

  /**
   * Calculates the remaining number of loops available.
   * 
   * @param currentLoop 1-indexed loop number (e.g., Loop 1 of 4 -> 3 remaining) or completed loop count.
   * @returns Remaining loop count, clamped to a minimum of 0.
   */
  public getRemainingLoops(currentLoop: number): number {
    if (typeof currentLoop !== 'number' || isNaN(currentLoop)) {
      return this.maxLoops;
    }
    const guardedLoop = Math.max(0, currentLoop);
    return Math.max(0, this.maxLoops - guardedLoop);
  }

  /**
   * Record a single input frame for the current active loop.
   */
  public recordFrame(input: PlayerInput): void {
    // Clone frame to avoid reference mutations
    this.currentLoopRecording.push({ ...input });
  }

  /**
   * Finalizes the current loop recording, storing it in history.
   * Explicitly guarded against pushing past maxLoops.
   */
  public finalizeLoop(): void {
    if (this.recordedLoops.length >= this.maxLoops) {
      console.warn(
        `[LoopManager] Cannot finalize loop: Max loops limit (${this.maxLoops}) reached.`
      );
      this.currentLoopRecording = [];
      return;
    }
    this.recordedLoops.push([...this.currentLoopRecording]);
    this.currentLoopRecording = [];
  }

  /**
   * Resets all recorded loop history for a full level restart.
   */
  public clearAllHistory(): void {
    this.recordedLoops = [];
    this.currentLoopRecording = [];
  }

  /**
   * Returns recorded input for a given ghost (0-indexed) at a specific tick.
   * Safe against negative, floating, or out-of-bounds access.
   * 
   * @param loopIndex 0-indexed ghost loop index (0 = Loop 1 recording).
   * @param tick Non-negative frame tick index.
   */
  public getInputForGhost(loopIndex: number, tick: number): PlayerInput {
    if (
      typeof loopIndex !== 'number' ||
      loopIndex < 0 ||
      loopIndex >= this.recordedLoops.length ||
      !Number.isInteger(loopIndex)
    ) {
      return createEmptyInput(Math.max(0, tick || 0));
    }

    const loopData = this.recordedLoops[loopIndex];
    if (typeof tick !== 'number' || tick < 0 || tick >= loopData.length || !Number.isInteger(tick)) {
      return createEmptyInput(Math.max(0, tick || 0));
    }

    return loopData[tick];
  }

  /**
   * Returns the total number of completed recorded loops.
   */
  public getCompletedLoopCount(): number {
    return this.recordedLoops.length;
  }

  /**
   * Returns the recording of a completed loop (0-indexed).
   * Safe against negative or out-of-bounds access.
   *
   * @param loopIndex 0-indexed loop index (0 maps to first completed loop).
   */
  public getLoopRecording(loopIndex: number): PlayerInput[] | null {
    if (
      typeof loopIndex !== 'number' ||
      loopIndex < 0 ||
      loopIndex >= this.recordedLoops.length ||
      !Number.isInteger(loopIndex)
    ) {
      return null;
    }
    return this.recordedLoops[loopIndex] || null;
  }
}
