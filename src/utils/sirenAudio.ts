/**
 * Web Audio API Siren Synthesizer for Indo-Armenia LLC Emergency SOS System
 * Generates an authentic European/Armenian two-tone emergency siren
 * Completely offline capable with zero external sound file dependencies.
 */

class SirenSynthesizer {
  private audioCtx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private isMuted = false;
  private intervalId: any = null;

  public start() {
    if (this.isPlaying) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.osc = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.osc.type = 'sawtooth';
      this.osc.frequency.setValueAtTime(650, this.audioCtx.currentTime);

      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.audioCtx.currentTime);

      this.osc.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.osc.start();
      this.isPlaying = true;

      // Authentic emergency siren pitch modulation (wa-wa or hi-lo siren)
      let highTone = false;
      this.intervalId = setInterval(() => {
        if (!this.audioCtx || !this.osc) return;
        const targetFreq = highTone ? 960 : 640;
        this.osc.frequency.setTargetAtTime(targetFreq, this.audioCtx.currentTime, 0.12);
        highTone = !highTone;
      }, 420);
    } catch (err) {
      console.warn('Web Audio Siren init prevented by browser policy until gesture:', err);
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch (_) {}
      this.osc = null;
    }

    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (_) {}
      this.gainNode = null;
    }

    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }

    this.isPlaying = false;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.audioCtx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const sirenPlayer = new SirenSynthesizer();
