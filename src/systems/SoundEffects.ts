/**
 * Web Audio API Sound Effects Synthesizer for Chrono-Chaser.
 */
export class SoundEffects {
  private static ctx: AudioContext | null = null;
  private static activeOscillators: OscillatorNode[] = [];
  private static muted: boolean = false;

  public static toggleMute(): boolean {
    SoundEffects.muted = !SoundEffects.muted;
    if (SoundEffects.muted) {
      SoundEffects.stopAll();
    }
    return SoundEffects.muted;
  }

  public static isMuted(): boolean {
    return SoundEffects.muted;
  }

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined' || SoundEffects.muted) return null;

    if (!SoundEffects.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        SoundEffects.ctx = new AudioCtxClass();
      }
    }

    if (SoundEffects.ctx && SoundEffects.ctx.state === 'suspended') {
      SoundEffects.ctx.resume().catch(() => {});
    }

    return SoundEffects.ctx;
  }

  /**
   * Unlock AudioContext on first user input gesture.
   */
  public static ensureAudioUnlocked(): void {
    const ctx = SoundEffects.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }

  public static playJump(): void {
    const ctx = SoundEffects.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);

      SoundEffects.trackOscillator(osc);
    } catch {
      // Ignore audio context autoplay restrictions
    }
  }

  public static playSwitch(): void {
    const ctx = SoundEffects.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);

      SoundEffects.trackOscillator(osc);
    } catch {
      // Ignore audio context restrictions
    }
  }

  public static playPlate(): void {
    const ctx = SoundEffects.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);

      SoundEffects.trackOscillator(osc);
    } catch {
      // Ignore audio context restrictions
    }
  }

  public static playReset(): void {
    const ctx = SoundEffects.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(700, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.22);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);

      SoundEffects.trackOscillator(osc);
    } catch {
      // Ignore audio context restrictions
    }
  }

  public static playWin(): void {
    const ctx = SoundEffects.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.25);

        SoundEffects.trackOscillator(osc);
      });
    } catch {
      // Ignore audio context restrictions
    }
  }

  public static playGateOpen(): void {
    const ctx = SoundEffects.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);

      SoundEffects.trackOscillator(osc);
    } catch {
      // Ignore audio context restrictions
    }
  }

  public static playFail(): void {
    const ctx = SoundEffects.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);

      SoundEffects.trackOscillator(osc);
    } catch {
      // Ignore audio context restrictions
    }
  }

  public static stopAll(): void {
    SoundEffects.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped oscillators
      }
    });
    SoundEffects.activeOscillators = [];
  }

  private static trackOscillator(osc: OscillatorNode): void {
    SoundEffects.activeOscillators.push(osc);
    osc.onended = () => {
      SoundEffects.activeOscillators = SoundEffects.activeOscillators.filter((o) => o !== osc);
    };
  }
}
