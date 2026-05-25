// Procedural audio via Web Audio API — no asset files required.
// All sounds are synthesised from oscillators, noise, and envelopes.

class SoundManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private _volume = 0.38;
  private _enabled = true;

  private ambientOscillators: OscillatorNode[] = [];
  private ambientGains: GainNode[] = [];
  private ambientTimer: ReturnType<typeof setInterval> | null = null;
  private ambientRunning = false;

  private getCtx(): AudioContext | null {
    if (!this._enabled) return null;
    try {
      if (!this.ctx) {
        this.ctx = new AudioContext();
        this.master = this.ctx.createGain();
        this.master.gain.value = this._volume;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  get enabled() { return this._enabled; }
  set enabled(v: boolean) {
    this._enabled = v;
    if (this.master) this.master.gain.value = v ? this._volume : 0;
    if (!v) this.stopAmbientMusic();
  }

  get volume() { return this._volume; }
  set volume(v: number) {
    this._volume = v;
    if (this.master && this._enabled) this.master.gain.value = v;
  }

  // ── Internal helpers ─────────────────────────────────────────────────

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
    if (freqEnd !== undefined)
      o.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
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

  // ── Gameplay sounds ──────────────────────────────────────────────────

  jump() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 320, t, 0.12, 0.18, 0.005, 0.06, 180);
    this.osc("sine", 640, t, 0.08, 0.06, 0.002, 0.04, 500);
  }

  doubleJump() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 520, t, 0.11, 0.2, 0.004, 0.06, 780);
    this.osc("sine", 1040, t + 0.02, 0.08, 0.1, 0.002, 0.05, 800);
    this.osc("triangle", 1560, t + 0.04, 0.07, 0.08, 0.002, 0.04);
  }

  dash() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sawtooth", 200, t, 0.14, 0.22, 0.002, 0.08, 600);
    this.noise(t, 0.12, 0.18, 1200, 3);
    this.osc("sine", 880, t + 0.02, 0.1, 0.12, 0.001, 0.06);
  }

  stomp() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 90, t, 0.18, 0.35, 0.002, 0.1, 40);
    this.noise(t, 0.1, 0.3, 300, 1.5);
    this.osc("sine", 440, t, 0.08, 0.18, 0.001, 0.05, 220);
  }

  crystalCollect() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const notes = [784, 988, 1175, 1568];
    notes.forEach((freq, i) => {
      this.osc("sine", freq, t + i * 0.07, 0.22, 0.22, 0.005, 0.14);
    });
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
    this.noise(t, 0.4, 0.6, 300, 0.8);
    this.osc("sawtooth", 220, t, 0.4, 0.3, 0.005, 0.3, 55);
    this.osc("sawtooth", 330, t, 0.3, 0.2, 0.005, 0.25, 80);
    this.osc("sine", 110, t + 0.1, 0.35, 0.25, 0.01, 0.2);
  }

  timeSlow() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 900, t, 0.45, 0.2, 0.01, 0.3, 180);
    this.osc("sine", 440, t + 0.05, 0.4, 0.15, 0.02, 0.25, 110);
    this.noise(t, 0.35, 0.1, 800, 3);
    this.osc("sine", 80, t + 0.1, 0.2, 0.3, 0.005, 0.12);
  }

  timeSlowEnd() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 220, t, 0.25, 0.12, 0.01, 0.18, 440);
    this.osc("sine", 330, t + 0.05, 0.2, 0.1, 0.01, 0.15, 550);
  }

  allCrystals() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047, 1319].forEach((f, i) => {
      this.osc("sine", f, t + i * 0.09, 0.28, 0.22, 0.005, 0.2);
    });
    [330, 415, 523, 659].forEach((f, i) => {
      this.osc("triangle", f, t + i * 0.09 + 0.04, 0.22, 0.1, 0.005, 0.18);
    });
  }

  levelComplete() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 659, 1047].forEach((f, i) => {
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
    [440, 370, 311, 220].forEach((f, i) => {
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

  abilityUnlock() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => {
      this.osc("sine", f, t + i * 0.08, 0.26, 0.2, 0.004, 0.18);
    });
    this.osc("triangle", 2093, t + 0.4, 0.2, 0.18, 0.003, 0.14);
  }

  bossHit() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 55, t, 0.25, 0.4, 0.002, 0.15, 30);
    this.noise(t, 0.22, 0.5, 250, 1.2);
    this.osc("sawtooth", 110, t, 0.16, 0.3, 0.001, 0.12, 55);
  }

  bossPhaseChange() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.noise(t, 0.6, 0.5, 200, 0.5);
    [110, 138, 165, 220].forEach((f, i) => {
      this.osc("sawtooth", f, t + i * 0.08, 0.35, 0.25, 0.005, 0.28);
    });
    this.osc("sine", 440, t + 0.3, 0.3, 0.2, 0.01, 0.18, 880);
  }

  playerShoot() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("square", 1100, t, 0.05, 0.12, 0.001, 0.06, 550);
    this.osc("sine",   700,  t, 0.06, 0.10, 0.002, 0.07, 350);
    this.noise(t, 0.07, 0.10, 2200, 6);
  }

  bossDefeat() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    // Victory fanfare
    [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => {
      this.osc("sine", f, t + i * 0.1, 0.34, 0.28, 0.005, 0.24);
    });
    [165, 208, 247, 330].forEach((f, i) => {
      this.osc("triangle", f, t + i * 0.1 + 0.05, 0.4, 0.15, 0.008, 0.28);
    });
    this.osc("sine", 1568, t + 0.65, 0.4, 0.22, 0.005, 0.3);
  }

  // ── Ambient music ────────────────────────────────────────────────────

  startAmbientMusic() {
    const ctx = this.getCtx();
    if (!ctx || !this.master || this.ambientRunning) return;
    this.ambientRunning = true;

    // Pad drone — two detuned oscillators
    const makeAmbientOsc = (freq: number, type: OscillatorType, gainVal: number) => {
      const g = ctx.createGain();
      g.gain.value = gainVal * this._volume * 0.25;
      g.connect(this.master!);
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      o.connect(g);
      o.start();
      this.ambientOscillators.push(o);
      this.ambientGains.push(g);
    };

    makeAmbientOsc(55,  "sine",     0.5);
    makeAmbientOsc(82.5,"sine",     0.3);
    makeAmbientOsc(110, "triangle", 0.2);
    makeAmbientOsc(55.2,"sine",     0.15); // slight detune for shimmer

    // Slowly modulate the gain for a breathing effect
    let phase = 0;
    this.ambientTimer = setInterval(() => {
      if (!this._enabled) return;
      phase += 0.04;
      const lfo = 0.7 + 0.3 * Math.sin(phase);
      this.ambientGains.forEach((g, i) => {
        const base = [0.5, 0.3, 0.2, 0.15][i] ?? 0.2;
        g.gain.value = base * this._volume * 0.25 * lfo;
      });
    }, 50);

    // Occasional accent notes
    const accentNotes = [165, 220, 275, 330, 247, 185];
    let noteIdx = 0;
    const playAccent = () => {
      if (!this.ambientRunning || !this._enabled) return;
      const t = ctx.currentTime;
      const freq = accentNotes[noteIdx % accentNotes.length];
      this.osc("sine", freq, t, 1.8, 0.06, 0.1, 1.4);
      noteIdx++;
      const delay = 2500 + Math.random() * 3500;
      setTimeout(playAccent, delay);
    };
    setTimeout(playAccent, 1500);
  }

  comboKill() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 660, t, 0.12, 0.15, 0.003, 0.07, 990);
    this.osc("triangle", 990, t + 0.05, 0.10, 0.10, 0.002, 0.06, 1320);
  }

  itemPickup() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("sine", 440, t, 0.10, 0.10, 0.004, 0.07);
    this.osc("sine", 660, t + 0.07, 0.08, 0.10, 0.003, 0.06);
    this.osc("sine", 880, t + 0.14, 0.06, 0.10, 0.002, 0.06);
  }

  weakPointHit() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    this.osc("square", 880, t, 0.12, 0.15, 0.001, 0.08, 1320);
    this.noise(t, 0.14, 0.25, 2000, 5);
    this.osc("sine", 1760, t + 0.05, 0.09, 0.12, 0.002, 0.07);
  }

  stopAmbientMusic() {
    if (!this.ambientRunning) return;
    this.ambientRunning = false;
    if (this.ambientTimer !== null) {
      clearInterval(this.ambientTimer);
      this.ambientTimer = null;
    }
    this.ambientOscillators.forEach(o => {
      try { o.stop(); } catch {}
    });
    this.ambientOscillators = [];
    this.ambientGains = [];
  }
}

export const soundManager = new SoundManager();
