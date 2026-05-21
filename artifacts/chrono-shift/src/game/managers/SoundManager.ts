// Procedural audio via Web Audio API — no files required.
// All sounds are synthesised from oscillators, noise, and envelopes.

class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private _volume = 0.38;
  private _enabled = true;

  // Lazy-initialise AudioContext on first sound (satisfies browser autoplay policy)
  private getCtx(): AudioContext | null {
    if (!this._enabled) return null;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this._volume;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  get enabled() { return this._enabled; }
  set enabled(v: boolean) {
    this._enabled = v;
    if (this.master) this.master.gain.value = v ? this._volume : 0;
  }

  get volume() { return this._volume; }
  set volume(v: number) {
    this._volume = v;
    if (this.master && this._enabled) this.master.gain.value = v;
  }

  // ── Internal helpers ────────────────────────────────────────────────

  private osc(
    type: OscillatorType,
    freq: number,
    startTime: number,
    duration: number,
    peakGain: number,
    attackTime = 0.005,
    releaseTime?: number,
    freqEnd?: number
  ) {
    const ctx = this.getCtx();
    if (!ctx || !this.master) return;
    const release = releaseTime ?? duration * 0.4;
    const g = ctx.createGain();
    g.connect(this.master);
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + attackTime);
    g.gain.setValueAtTime(peakGain, startTime + duration - release);
    g.gain.linearRampToValueAtTime(0, startTime + duration);

    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, startTime);
    if (freqEnd !== undefined) {
      o.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
    }
    o.connect(g);
    o.start(startTime);
    o.stop(startTime + duration + 0.01);
  }

  private noise(
    startTime: number,
    duration: number,
    peakGain: number,
    filterFreq = 1500,
    filterQ = 1
  ) {
    const ctx = this.getCtx();
    if (!ctx || !this.master) return;

    const bufSize = Math.ceil(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + 0.005);
    g.gain.linearRampToValueAtTime(0, startTime + duration);

    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
  }

  // ── Public sounds ───────────────────────────────────────────────────

  jump() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 320, t, 0.12, 0.18, 0.005, 0.06, 180);
    this.osc("sine", 640, t, 0.08, 0.06, 0.002, 0.04, 500);
  }

  crystalCollect() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [784, 988, 1175, 1568]; // G5 B5 D6 G6
    notes.forEach((freq, i) => {
      this.osc("sine", freq, t + i * 0.07, 0.22, 0.22, 0.005, 0.14);
    });
    // Sparkle high shimmer
    this.osc("sine", 3136, t + 0.1, 0.15, 0.06, 0.002, 0.1);
  }

  shardCollect() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("triangle", 880, t, 0.14, 0.14, 0.003, 0.1);
    this.osc("sine", 1320, t + 0.04, 0.1, 0.08, 0.002, 0.08);
  }

  healthCollect() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Warm major chord
    [330, 415, 523].forEach((f, i) => {
      this.osc("sine", f, t + i * 0.04, 0.3, 0.15, 0.01, 0.18);
    });
  }

  damage() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.noise(t, 0.18, 0.5, 400, 2);
    this.osc("sawtooth", 180, t, 0.12, 0.28, 0.002, 0.08, 80);
    this.osc("square", 120, t + 0.02, 0.1, 0.15, 0.001, 0.07);
  }

  death() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Descending crash
    this.noise(t, 0.4, 0.6, 300, 0.8);
    this.osc("sawtooth", 220, t, 0.4, 0.3, 0.005, 0.3, 55);
    this.osc("sawtooth", 330, t, 0.3, 0.2, 0.005, 0.25, 80);
    this.osc("sine", 110, t + 0.1, 0.35, 0.25, 0.01, 0.2);
  }

  timeSlow() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Descending whoosh + bass pulse
    this.osc("sine", 900, t, 0.45, 0.2, 0.01, 0.3, 180);
    this.osc("sine", 440, t + 0.05, 0.4, 0.15, 0.02, 0.25, 110);
    this.noise(t, 0.35, 0.1, 800, 3);
    // Low thud
    this.osc("sine", 80, t + 0.1, 0.2, 0.3, 0.005, 0.12);
  }

  timeSlowEnd() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 220, t, 0.25, 0.12, 0.01, 0.18, 440);
    this.osc("sine", 330, t + 0.05, 0.2, 0.1, 0.01, 0.15, 550);
  }

  timeRewind() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Glitchy stuttering reverse sweep
    for (let i = 0; i < 6; i++) {
      const delay = i * 0.05;
      const freq = 600 + i * 80;
      this.osc("square", freq, t + delay, 0.06, 0.14, 0.001, 0.04);
    }
    this.osc("sine", 1200, t, 0.3, 0.18, 0.005, 0.2, 300);
    this.noise(t, 0.3, 0.15, 1200, 4);
    // Sub boom
    this.osc("sine", 60, t + 0.05, 0.25, 0.35, 0.005, 0.15);
  }

  allCrystals() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Ascending fanfare
    const melody = [523, 659, 784, 1047, 1319];
    melody.forEach((f, i) => {
      this.osc("sine", f, t + i * 0.09, 0.28, 0.22, 0.005, 0.2);
    });
    // Harmony
    [330, 415, 523, 659].forEach((f, i) => {
      this.osc("triangle", f, t + i * 0.09 + 0.04, 0.22, 0.1, 0.005, 0.18);
    });
  }

  levelComplete() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const melody = [523, 659, 784, 659, 1047];
    melody.forEach((f, i) => {
      this.osc("sine", f, t + i * 0.12, 0.32, 0.22, 0.005, 0.22);
    });
    [330, 392, 523].forEach((f, i) => {
      this.osc("triangle", f, t + i * 0.1 + 0.06, 0.4, 0.1, 0.01, 0.3);
    });
  }

  gameOver() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const melody = [440, 370, 311, 220];
    melody.forEach((f, i) => {
      this.osc("sine", f, t + i * 0.2, 0.35, 0.2, 0.01, 0.25);
      this.osc("triangle", f * 0.5, t + i * 0.2 + 0.05, 0.3, 0.12, 0.01, 0.22);
    });
  }

  exitUnlock() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 880, t, 0.15, 0.18, 0.005, 0.1);
    this.osc("sine", 1109, t + 0.06, 0.12, 0.16, 0.005, 0.1);
    this.osc("sine", 1319, t + 0.12, 0.12, 0.2, 0.005, 0.12);
    this.osc("sine", 1760, t + 0.18, 0.1, 0.18, 0.002, 0.14);
  }

  buttonClick() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 660, t, 0.06, 0.1, 0.002, 0.05, 880);
  }

  buttonHover() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 440, t, 0.04, 0.05, 0.002, 0.04);
  }

  pauseOpen() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 660, t, 0.12, 0.12, 0.003, 0.08, 440);
    this.noise(t, 0.1, 0.06, 600, 5);
  }

  pauseClose() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 440, t, 0.1, 0.12, 0.003, 0.07, 660);
  }
}

export const soundManager = new SoundManager();
