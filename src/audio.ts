/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private primaryGain: GainNode | null = null;
  private isMuted: boolean = false;
  private ambientOsc: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  // New procedural audio attributes
  private heartbeatInterval: any = null;
  private currentBpm: number = 65;
  private coreStreak: number = 0;
  private coreWpm: number = 0;
  private dangerProximity: number = 0; // 0 (safe) to 1 (near damage)
  private beatCounter: number = 0;

  constructor() {
    // Lazy initialized on user gesture
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.primaryGain = this.ctx.createGain();
      this.primaryGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.primaryGain.connect(this.ctx.destination);
      this.startAmbientDrone();
      this.startHeartbeatLoop();
    } catch (e) {
      console.warn('Web Audio API not supported in this environment:', e);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.primaryGain && this.ctx) {
      this.primaryGain.gain.setTargetAtTime(muted ? 0 : 0.6, this.ctx.currentTime, 0.05);
    }
  }

  getMuted(): boolean {
    return this.isMuted;
  }

  private startAmbientDrone() {
    if (!this.ctx || !this.primaryGain || this.isMuted) return;
    try {
      this.ambientOsc = this.ctx.createOscillator();
      this.ambientGain = this.ctx.createGain();

      this.ambientOsc.type = 'triangle';
      this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      // Low pass filter to make it warmer/subtler
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.ambientOsc.connect(filter);
      filter.connect(this.ambientGain);
      this.ambientGain.connect(this.primaryGain);

      this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.ambientOsc.start();
    } catch (e) {
      console.error('Ambient drone initialization failed:', e);
    }
  }

  // Speed factor reflects WPM: higher WPM or faster streak slightly raises ambient pitching & speed pulse
  updateAmbientDrone(streak: number, wpm: number, isOverdrive: boolean = false) {
    this.coreWpm = wpm;
    this.coreStreak = streak;
    if (!this.ctx || !this.ambientOsc || !this.ambientGain || this.isMuted) return;

    const baseFreq = isOverdrive ? 82.41 : 55; // Raise base drone pitch on overdrive for auditory feedback
    // Cap at double frequency for double atmosphere intensity
    const multiplier = Math.min(3, 1 + streak * 0.05 + (wpm > 0 ? (wpm / 110) : 0) + (isOverdrive ? 0.6 : 0));
    const targetFreq = baseFreq * multiplier;

    this.ambientOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.5);

    // Warm brightness scales slightly with performance
    const targetGain = Math.min(0.24, 0.08 + streak * 0.004 + (isOverdrive ? 0.08 : 0));
    this.ambientGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.3);

    // Dynamic tempo adjustment based on velocity
    let targetBpm = 65 + Math.min(60, (wpm / 2)) + (streak * 2);
    if (this.dangerProximity > 0.4) {
      // Danger speeds up heartbeat further
      targetBpm += (this.dangerProximity * 40);
    }
    this.currentBpm = Math.min(160, Math.max(60, targetBpm));
  }

  // Set the threat intensity (how close the nearest word is to hitting player)
  setDangerProximity(proximity: number) {
    this.dangerProximity = Math.min(1, Math.max(0, proximity));
  }

  private startHeartbeatLoop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    const runTicker = () => {
      if (this.ctx && !this.isMuted && this.ctx.state === 'running') {
        this.triggerHeartbeat();
      }
      // Re-schedule interval dynamically based on current BPM
      const intervalMs = (60 / this.currentBpm) * 1000;
      this.heartbeatInterval = setTimeout(runTicker, intervalMs);
    };

    this.heartbeatInterval = setTimeout(runTicker, 1000);
  }

  stopHeartbeatLoop() {
    if (this.heartbeatInterval) {
      clearTimeout(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Trigger procedural thump + optional instrument overlays depending on streak
  private triggerHeartbeat() {
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const isDoubleBeat = this.beatCounter % 2 === 0;
    this.beatCounter++;

    // Thump sound 1: Heart-like thud
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sine';
    const baseFreq = isDoubleBeat ? 52 : 45; // Ba-dum thud pitching difference
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(10, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(90, now);

    // Volume dynamically scales with proximity & performance
    const thudGain = 0.16 + (this.dangerProximity * 0.25);
    gain1.gain.setValueAtTime(thudGain, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + (isDoubleBeat ? 0.22 : 0.14));

    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(this.primaryGain!);

    osc1.start(now);
    osc1.stop(now + 0.25);

    // Optional thud harmonic
    if (this.dangerProximity > 0.5) {
      const oscHarmonic = this.ctx.createOscillator();
      const gainHarmonic = this.ctx.createGain();
      oscHarmonic.type = 'triangle';
      oscHarmonic.frequency.setValueAtTime(baseFreq * 2, now);
      gainHarmonic.gain.setValueAtTime(this.dangerProximity * 0.08, now);
      gainHarmonic.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      oscHarmonic.connect(filter);
      gainHarmonic.connect(this.primaryGain!);
      oscHarmonic.connect(gainHarmonic);
      oscHarmonic.start(now);
      oscHarmonic.stop(now + 0.2);
    }

    // --- Dynamic Instrument Stems depending on combo streak level ---

    // Stem 1: Crystalline hi-hat tick (plays every beat once streak >= 5)
    if (this.coreStreak >= 5) {
      const noiseOsc = this.ctx.createOscillator();
      const noiseGain = this.ctx.createGain();
      const hpf = this.ctx.createBiquadFilter();

      noiseOsc.type = 'triangle';
      noiseOsc.frequency.setValueAtTime(10000 + Math.random() * 2000, now);

      hpf.type = 'highpass';
      hpf.frequency.setValueAtTime(8000, now);

      // Delicate tick volume
      const tickVolume = Math.min(0.04, 0.01 + (this.coreStreak * 0.001));
      noiseGain.gain.setValueAtTime(tickVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      noiseOsc.connect(hpf);
      hpf.connect(noiseGain);
      noiseGain.connect(this.primaryGain!);

      noiseOsc.start(now);
      noiseOsc.stop(now + 0.03);
    }

    // Stem 2: Crystalline melodic plucks / arpeggios (plays every beat once streak >= 12)
    if (this.coreStreak >= 12) {
      const pluckOsc = this.ctx.createOscillator();
      const pluckGain = this.ctx.createGain();
      const pluckFilter = this.ctx.createBiquadFilter();

      pluckOsc.type = 'sine';

      // Map chord melodies dynamically in scale of A-minor
      const aminorChord = [440, 523.25, 659.25, 783.99, 880, 1046.50];
      const selectedIndex = (this.beatCounter + Math.floor(this.coreStreak / 4)) % aminorChord.length;
      const freq = aminorChord[selectedIndex];

      pluckOsc.frequency.setValueAtTime(freq, now);
      pluckOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);

      pluckFilter.type = 'bandpass';
      pluckFilter.frequency.setValueAtTime(1200, now);
      pluckFilter.Q.setValueAtTime(1.5, now);

      const pluckValValue = Math.min(0.08, 0.02 + ((this.coreStreak - 12) * 0.002));
      pluckGain.gain.setValueAtTime(pluckValValue, now);
      pluckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      pluckOsc.connect(pluckFilter);
      pluckFilter.connect(pluckGain);
      pluckGain.connect(this.primaryGain!);

      pluckOsc.start(now);
      pluckOsc.stop(now + 0.25);
    }
  }

  playKeypress(speedFactor: number = 1.0) {
    if (!this.ctx || this.isMuted) return;
    this.init(); // Ensure context is awake

    const now = this.ctx.currentTime;
    
    // Snappy typewriter or tick click sound
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    // Pitch scales slightly with velocity/user typing speed
    const pitch = 800 + Math.random() * 400 + (speedFactor * 50);
    osc.frequency.setValueAtTime(pitch, now);

    // Filter to make it clicky
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.Q.setValueAtTime(2.0, now);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.primaryGain!);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playSuccess() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Harmonizer
    // 1. High crystalline pulse
    const highOsc = this.ctx.createOscillator();
    const highGain = this.ctx.createGain();
    
    highOsc.type = 'sine';
    highOsc.frequency.setValueAtTime(880, now); // A5
    // Slide frequency up slightly
    highOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

    highGain.gain.setValueAtTime(0.12, now);
    highGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    highOsc.connect(highGain);
    highGain.connect(this.primaryGain!);
    
    highOsc.start(now);
    highOsc.stop(now + 0.16);

    // 2. Heavy sub resonance pulse (pulse boom feedback)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(110, now); // Low A2
    subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.25);

    subGain.gain.setValueAtTime(0.25, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    const subFilter = this.ctx.createBiquadFilter();
    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(150, now);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.primaryGain!);

    subOsc.start(now);
    subOsc.stop(now + 0.35);
  }

  playMiss() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Deep heavy distorted hit
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.4);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.primaryGain!);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playGlitch() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Glitch sound: rapid square wave sweeps and noise
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.setValueAtTime(120, now + 0.05);
    osc.frequency.setValueAtTime(450, now + 0.1);
    
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.primaryGain!);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playLevelUp() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Major sci-fi arpeggio ascent chord
    const notes = [220, 277.18, 329.63, 440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.primaryGain!);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.4);
    });
  }
}

export const gameAudio = new AudioEngine();
