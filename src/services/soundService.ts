/**
 * Web Audio API synthesized sound generator for desktop reminder chimes.
 * Requires zero external audio files, works completely offline.
 */

class SoundService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Play an elegant, modern two-tone productivity chime
   */
  public playReminderChime(volume = 0.7): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(Math.min(0.8, volume), now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      gainNode.connect(ctx.destination);

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      osc1.connect(gainNode);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2: B5 (987.77 Hz) slightly delayed
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.16);
      osc2.connect(gainNode);
      osc2.start(now + 0.16);
      osc2.stop(now + 1.2);

      // Subtle harmonic overtone for warmth
      const osc3 = ctx.createOscillator();
      osc3.type = 'triangle';
      osc3.frequency.setValueAtTime(1318.51, now + 0.18); // E6
      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.15 * volume, now + 0.18);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc3.connect(subGain);
      subGain.connect(ctx.destination);
      osc3.start(now + 0.18);
      osc3.stop(now + 0.9);
    } catch (err) {
      console.warn('Audio chime playback error:', err);
    }
  }

  /**
   * Quick confirmation click/tick sound for task completion
   */
  public playSuccessTone(volume = 0.5): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.01, now);
      gainNode.gain.linearRampToValueAtTime(0.4 * volume, now + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      gainNode.connect(ctx.destination);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5
      osc.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (err) {
      console.warn('Success tone error:', err);
    }
  }
}

export const soundService = new SoundService();
