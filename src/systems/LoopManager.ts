import { createEmptyInput, type PlayerInput } from '../types/PlayerInput';

export class LoopManager {
  private recordedLoops: PlayerInput[][] = [];
  private currentLoopRecording: PlayerInput[] = [];

  /**
   * Record a single input frame for the current active loop.
   */
  public recordFrame(input: PlayerInput): void {
    // Clone frame to avoid reference mutations
    this.currentLoopRecording.push({ ...input });
  }

  /**
   * Finalizes the current loop recording, storing it in history.
   */
  public finalizeLoop(): void {
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
   * Safe against out-of-bounds access.
   */
  public getInputForGhost(loopIndex: number, tick: number): PlayerInput {
    const loopData = this.recordedLoops[loopIndex];
    if (loopData && tick >= 0 && tick < loopData.length) {
      return loopData[tick];
    }
    return createEmptyInput(tick);
  }

  /**
   * Returns the total number of completed recorded loops.
   */
  public getCompletedLoopCount(): number {
    return this.recordedLoops.length;
  }

  /**
   * Returns the recording of a completed loop for inspection/verification.
   */
  public getLoopRecording(loopIndex: number): PlayerInput[] | null {
    return this.recordedLoops[loopIndex] || null;
  }
}
